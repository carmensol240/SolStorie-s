import { useState } from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import QRCode from 'qrcode';
import { useToast } from '@/hooks/use-toast';
import { useSignedUrls } from '@/hooks/use-signed-urls';
import { translateTopic } from '@/lib/topic-translations';
import { supabase } from '@/integrations/supabase/client';
import solMagicBookCover from '@/assets/sol-magic-book-cover.png';
import { PAGE_MM, PAGE_PX, SAFE_MM, PRINT_TEXTS, buildPageSequence, TEXT_FIT_STEPS, containRect, printLang, type PrintLang } from '@/lib/print-layout';

// Helper function to escape HTML entities and prevent XSS
const escapeHtml = (unsafe: string): string => {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

interface StoryPage {
  page_number: number;
  text: string;
  illustration_url: string | null;
}

interface Story {
  id: string;
  child_name: string;
  child_gender?: string;
  topic: string;
  language?: string;
  age_range?: string;
  cover_url?: string | null;
  child_photo_url?: string | null;
  pages: StoryPage[];
}


interface VirtualPdfPage {
  text: string;
  illustration_url: string | null;
  page_number: number;
}

// Rainbow gradient for decorative fallback
const RAINBOW_CSS = 'linear-gradient(135deg, #FFE4E1 0%, #FFDAB9 15%, #FFFACD 30%, #E0FFE0 45%, #E0F0FF 60%, #E8D8FF 75%, #FFE4F0 90%, #FFE4E1 100%)';

export const usePdfExport = () => {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();
  const { fetchSignedUrls } = useSignedUrls();

  // Defense-in-depth entitlement check: ensures PDF generation cannot be
  // triggered programmatically without an active PDF entitlement, even if
  // the calling UI's paywall guard is bypassed.
  const verifyPdfEntitlement = async (storyId?: string): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) return false;

      // Admins always allowed
      const { data: effAdmin } = await supabase.rpc('is_effective_admin', { _user_id: user.id });
      if (effAdmin) return true;

      // Subscribers allowed
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_subscriber')
        .eq('id', user.id)
        .maybeSingle();
      if (profile?.is_subscriber) return true;

      // Multi-story package or single_story_full purchase grants PDF rights
      const { data: purchases } = await supabase
        .from('purchases')
        .select('package_name')
        .eq('user_id', user.id)
        .in('status', ['completed', 'test_completed'])
        .limit(50);
      const hasFullPdfRight = (purchases ?? []).some((row: any) => {
        const name: string = row?.package_name ?? '';
        return !name.includes('single_story') || name.includes('single_story_full');
      });
      if (hasFullPdfRight) return true;

      // Single-story full unlock for this specific story
      if (storyId) {
        const { data: unlock } = await supabase
          .from('story_unlocks' as any)
          .select('unlock_type')
          .eq('user_id', user.id)
          .eq('story_id', storyId)
          .eq('unlock_type', 'single')
          .maybeSingle();
        if (unlock) return true;
      }
      return false;
    } catch (e) {
      console.error('PDF entitlement check failed:', e);
      return false;
    }
  };

  // ─── Image loading (object URLs, revoked after use — no big base64 strings) ──
  const loadImage = async (url: string): Promise<{ img: HTMLImageElement; revoke: () => void }> => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`image ${res.status}`);
    const objUrl = URL.createObjectURL(await res.blob());
    const img = new Image();
    img.src = objUrl;
    await img.decode();
    return { img, revoke: () => URL.revokeObjectURL(objUrl) };
  };

  const fontsReady = async () => {
    try {
      await Promise.all([
        document.fonts.load('500 40px Heebo'),
        document.fonts.load('700 40px Heebo'),
        document.fonts.load('900 40px Heebo'),
      ]);
      await document.fonts.ready;
    } catch { /* fonts API missing — continue */ }
  };

  // ─── Native jsPDF footer: logo watermark + optional page number, inside the safe area ──
  const drawFooter = (pdf: jsPDF, opts: { pageNumber?: number; onPicture?: boolean } = {}) => {
    const W = PAGE_MM;
    const urlY = W - SAFE_MM;          // 203 mm — lowest baseline
    const brandY = urlY - 5;           // 198 mm
    if (opts.onPicture) {
      const GState = (pdf as any).GState;
      if (GState) pdf.setGState(new GState({ opacity: 0.7 }));
      pdf.setFillColor(255, 255, 255);
      pdf.roundedRect(W / 2 - 20, brandY - 5, 40, 11, 3, 3, 'F');
      if (GState) pdf.setGState(new GState({ opacity: 1 }));
    } else {
      pdf.setDrawColor(212, 165, 116);
      pdf.setLineWidth(0.2);
      pdf.line(SAFE_MM, brandY - 6, W - SAFE_MM, brandY - 6);
    }
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.setTextColor(147, 51, 234);
    pdf.text("SolStorie's\u2122", W / 2, brandY, { align: 'center' });
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(37, 99, 235);
    pdf.textWithLink('soulstory.co.il', W / 2, urlY, { url: 'https://soulstory.co.il', align: 'center' });
    if (opts.pageNumber) {
      pdf.setFontSize(9);
      pdf.setTextColor(120, 120, 120);
      pdf.text(String(opts.pageNumber), W - SAFE_MM, urlY, { align: 'right' });
    }
  };

  const freeCanvas = (c: HTMLCanvasElement) => { c.width = 0; c.height = 0; };

  // ─── html2canvas capture of a 1240px design page at 300 DPI ──
  const DESIGN = 1240;
  const SAFE_PX = Math.ceil((SAFE_MM / PAGE_MM) * DESIGN); // ~75 design px
  const captureHtml = async (container: HTMLDivElement, el: HTMLElement, pdf: jsPDF, format: 'PNG' | 'JPEG') => {
    container.innerHTML = '';
    container.appendChild(el);
    await fontsReady();
    const canvas = await html2canvas(container, {
      scale: PAGE_PX / DESIGN,
      useCORS: true,
      allowTaint: false,
      backgroundColor: '#ffffff',
      width: DESIGN,
      height: DESIGN,
    });
    if (format === 'PNG') pdf.addImage(canvas, 'PNG', 0, 0, PAGE_MM, PAGE_MM, undefined, 'FAST');
    else pdf.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, PAGE_MM, PAGE_MM);
    freeCanvas(canvas);
    container.innerHTML = '';
  };

  // ─── Illustration page drawn directly on canvas: full picture + blurred fill to the bleed ──
  const addIllustrationPage = async (pdf: jsPDF, url: string) => {
    const { img, revoke } = await loadImage(url);
    try {
      const S = PAGE_PX;
      const canvas = document.createElement('canvas');
      canvas.width = S; canvas.height = S;
      const ctx = canvas.getContext('2d')!;
      // Blur by downscale → upscale (works in Safari, which lacks ctx.filter)
      const small = document.createElement('canvas');
      small.width = 48; small.height = 48;
      const sctx = small.getContext('2d')!;
      const k = Math.max(48 / img.naturalWidth, 48 / img.naturalHeight);
      sctx.drawImage(img, (48 - img.naturalWidth * k) / 2, (48 - img.naturalHeight * k) / 2, img.naturalWidth * k, img.naturalHeight * k);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(small, 0, 0, S, S);
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.fillRect(0, 0, S, S);
      freeCanvas(small);
      const r = containRect(img.naturalWidth, img.naturalHeight, S);
      ctx.drawImage(img, r.x, r.y, r.w, r.h);
      pdf.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, PAGE_MM, PAGE_MM);
      freeCanvas(canvas);
    } finally {
      revoke();
    }
  };

  // ─── Small inline SVG icons (no emojis) ──
  const starSvg = (size: number, color = '#FFD66B') =>
    `<svg width="${size}" height="${size}" viewBox="0 0 24 24" style="display:inline-block;vertical-align:middle;"><path d="M12 2L13.8 8.2L20 10L13.8 11.8L12 18L10.2 11.8L4 10L10.2 8.2L12 2Z" fill="${color}"/></svg>`;
  const heartSvg = (size: number, color = '#FFD66B') =>
    `<svg width="${size}" height="${size}" viewBox="0 0 24 24" style="display:inline-block;vertical-align:middle;"><path d="M12 21s-7.5-4.6-10-9.2C.4 8.4 2.6 4.5 6.4 4.5c2.2 0 3.6 1.2 4.6 2.6 1-1.4 2.4-2.6 4.6-2.6 3.8 0 6 3.9 4.4 7.3C19.5 16.4 12 21 12 21z" fill="${color}"/></svg>`;

  const pageBase = (dir: 'rtl' | 'ltr') =>
    `width:${DESIGN}px;height:${DESIGN}px;position:relative;overflow:hidden;box-sizing:border-box;direction:${dir};font-family:Heebo,Assistant,sans-serif;`;

  const renderCoverPage = (childName: string, title: string, lang: PrintLang, coverSrc: string): HTMLDivElement => {
    const T = PRINT_TEXTS[lang];
    const el = document.createElement('div');
    el.style.cssText = pageBase(T.dir);
    const side = T.dir === 'rtl' ? 'right' : 'left';
    el.innerHTML = `
      <img src="${coverSrc}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;" />
      <div style="position:absolute;top:${SAFE_PX + 10}px;${side}:${SAFE_PX + 10}px;z-index:2;
        background:rgba(255,255,255,0.18);border:1px solid rgba(255,255,255,0.35);
        border-radius:999px;padding:10px 22px;color:#ffffff;font-size:22px;font-weight:600;
        text-shadow:0 1px 4px rgba(0,0,0,0.4);">${starSvg(22)} SolStorie's™</div>
      <div style="position:absolute;bottom:0;left:0;right:0;height:55%;
        background:linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.55) 50%, transparent 100%);"></div>
      <div style="position:absolute;bottom:0;left:0;right:0;z-index:1;text-align:center;padding:0 ${SAFE_PX + 20}px ${SAFE_PX + 20}px;">
        <h1 style="color:#ffffff;font-size:88px;font-weight:900;margin:0 0 20px 0;line-height:1.1;
          text-shadow:0 2px 10px rgba(0,0,0,0.7);">${escapeHtml(title)}</h1>
        <p style="color:#FFD66B;font-size:42px;font-weight:700;margin:0 0 40px 0;
          text-shadow:0 2px 8px rgba(0,0,0,0.6);">${heartSvg(36)} ${escapeHtml(T.storyOf(childName))}</p>
        <p style="color:rgba(255,255,255,0.75);font-size:20px;font-weight:500;margin:0;direction:ltr;">SolStorie's™ · soulstory.co.il</p>
      </div>`;
    return el;
  };

  const renderInsideCover = (lang: PrintLang): HTMLDivElement => {
    const T = PRINT_TEXTS[lang];
    const el = document.createElement('div');
    el.style.cssText = pageBase(T.dir) + `background:#ffffff;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:${SAFE_PX + 80}px;text-align:center;`;
    el.innerHTML = `
      ${starSvg(56)}
      <p style="color:#1f2937;font-size:52px;font-weight:700;margin:30px 0 70px;">${escapeHtml(T.belongsTo)}</p>
      <div style="width:70%;border-bottom:3px solid #d4d4d8;"></div>`;
    return el;
  };

  const renderDedicationPage = (lang: PrintLang): HTMLDivElement => {
    const T = PRINT_TEXTS[lang];
    const el = document.createElement('div');
    el.style.cssText = pageBase(T.dir) + `background:#ffffff;display:flex;flex-direction:column;align-items:center;text-align:center;padding:120px 140px 200px;`;
    const lines = Array.from({ length: 8 })
      .map(() => `<div style="height:0;border-bottom:2px solid #d4d4d8;margin:0 0 80px 0;"></div>`).join('');
    el.innerHTML = `
      <div style="margin:0 0 24px 0;">${starSvg(64)}</div>
      <p style="color:#1f2937;font-size:52px;font-weight:700;margin:0 0 30px 0;line-height:1.5;">${escapeHtml(T.dedication)}</p>
      <div style="width:100%;">${lines}</div>`;
    return el;
  };

  // One or two story paragraphs, stacked, with a small star between them.
  const renderTextOnlyPage = (texts: string[], lang: PrintLang): HTMLDivElement => {
    const el = document.createElement('div');
    el.style.cssText = pageBase(PRINT_TEXTS[lang].dir) + `background:#ffffff;display:flex;align-items:center;justify-content:center;padding:180px 160px 200px;box-sizing:border-box;`;
    const para = (t: string) => `<p data-fit style="color:#1f2937;font-size:54px;line-height:1.9;font-weight:500;margin:0;
        text-align:center;word-wrap:break-word;overflow-wrap:break-word;white-space:pre-line;">${escapeHtml(t)}</p>`;
    el.innerHTML = `<div data-fit-box style="width:100%;display:flex;flex-direction:column;align-items:center;gap:36px;">${
      texts.map(para).join(`<div aria-hidden="true" style="line-height:0;">${starSvg(34, '#F5B942')}</div>`)
    }</div>`;
    return el;
  };

  // Shrink font (54→40) then line-height (1.9→1.6) until the text fits inside the padded area.
  const fitTextPage = async (container: HTMLDivElement, el: HTMLDivElement) => {
    container.innerHTML = '';
    container.appendChild(el);
    await fontsReady();
    const box = el.querySelector('[data-fit-box]') as HTMLElement;
    const ps = Array.from(el.querySelectorAll('[data-fit]')) as HTMLElement[];
    const avail = DESIGN - 180 - 200;
    for (const step of TEXT_FIT_STEPS) {
      ps.forEach(p => { p.style.fontSize = `${step.font}px`; p.style.lineHeight = String(step.line); });
      if (box.scrollHeight <= avail) break;
    }
  };

  const renderDecorativePage = (): HTMLDivElement => {
    const el = document.createElement('div');
    el.style.cssText = pageBase('ltr') + `background:${RAINBOW_CSS};display:flex;align-items:center;justify-content:center;gap:40px;`;
    el.innerHTML = `${starSvg(90, '#F5B942')}${heartSvg(110, '#F28AB2')}${starSvg(90, '#8EC5FF')}`;
    return el;
  };

  const purpleBg = 'background:linear-gradient(160deg, #1a0a3e 0%, #2a1050 45%, #3b1466 100%);';

  const renderTheEndPage = (childName: string, lang: PrintLang, childGender?: string): HTMLDivElement => {
    const T = PRINT_TEXTS[lang];
    const isMale = childGender === 'male' || childGender === 'boy' || childGender === 'זכר';
    const el = document.createElement('div');
    el.style.cssText = pageBase(T.dir) + purpleBg + `display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:120px 120px 200px;`;
    el.innerHTML = `
      <div style="color:#FFD66B;font-size:96px;font-weight:900;margin-bottom:40px;">${escapeHtml(T.theEnd)} ${starSvg(72)}</div>
      <p style="color:#ffffff;font-size:50px;font-weight:700;margin:0 0 60px 0;line-height:1.4;">${escapeHtml(T.closing(childName, isMale))}</p>
      <p style="color:rgba(255,255,255,0.85);font-size:38px;font-weight:600;margin:0 0 40px 0;">${escapeHtml(T.appIntro)}</p>
      <div style="display:flex;flex-direction:column;align-items:flex-start;gap:22px;background:rgba(255,255,255,0.08);
        border:1px solid rgba(255,255,255,0.18);border-radius:32px;padding:44px 64px;max-width:900px;">
        ${T.benefits.map(b => `<div style="color:#ffffff;font-size:34px;font-weight:500;line-height:1.5;">${starSvg(30)} ${escapeHtml(b)}</div>`).join('')}
      </div>`;
    return el;
  };

  const renderBackCoverPage = async (childName: string, lang: PrintLang, photoSrc: string | null): Promise<HTMLDivElement> => {
    const T = PRINT_TEXTS[lang];
    const qrDataUrl = await QRCode.toDataURL('https://soulstory.co.il', { width: 360, margin: 1, color: { dark: '#1a0a3e', light: '#ffffff' } });
    const today = new Date().toLocaleDateString(T.locale, { day: 'numeric', month: 'long', year: 'numeric' });
    const el = document.createElement('div');
    el.style.cssText = pageBase(T.dir) + purpleBg + `display:flex;flex-direction:column;align-items:center;justify-content:space-between;padding:120px 110px;text-align:center;`;
    el.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;">
        <div style="color:#FFD66B;font-size:90px;font-weight:900;direction:ltr;">${starSvg(70)} SolStorie's™</div>
        ${photoSrc ? `
        <div style="margin-top:36px;display:flex;flex-direction:column;align-items:center;gap:12px;">
          <img src="${photoSrc}" style="width:120px;height:120px;border-radius:50%;object-fit:cover;border:4px solid #FFD66B;" />
          <p style="color:#ffffff;font-size:26px;font-weight:700;margin:0;">${escapeHtml(T.heroOf(childName))}</p>
        </div>` : ''}
        <p style="color:#ffffff;font-size:46px;font-weight:700;margin:50px 0 0 0;line-height:1.4;">${escapeHtml(T.tagline)}</p>
        <p style="color:rgba(255,255,255,0.85);font-size:30px;font-weight:500;margin:24px 0 0 0;">${escapeHtml(T.sub)}</p>
      </div>
      <div style="display:flex;flex-direction:column;align-items:center;background:rgba(255,255,255,0.08);
        border:1px solid rgba(255,255,255,0.18);border-radius:32px;padding:36px 56px;">
        <img src="${qrDataUrl}" style="width:260px;height:260px;border-radius:16px;background:#ffffff;padding:14px;" />
        <p style="color:#ffffff;font-size:28px;font-weight:600;margin:22px 0 6px 0;">${escapeHtml(T.scan)}</p>
        <p style="color:#FFD66B;font-size:22px;font-weight:500;margin:0;">soulstory.co.il</p>
      </div>
      <div style="display:flex;flex-direction:column;align-items:center;gap:10px;">
        <p style="color:rgba(255,255,255,0.75);font-size:22px;margin:0;">${escapeHtml(T.created(childName, today))}</p>
        <p style="color:rgba(255,255,255,0.5);font-size:18px;margin:0;">${escapeHtml(T.rights)}</p>
      </div>`;
    return el;
  };

  // ─── Print-quality illustrations (upscaled once on the server, reused later) ──
  const getPrintIllustrations = async (story: Story): Promise<Record<string, string>> => {
    try {
      const { data: rows } = await supabase
        .from('story_pages')
        .select('illustration_url, print_illustration_url')
        .eq('story_id', story.id);
      const withPic = (rows ?? []).filter((r: any) => r.illustration_url);
      const ready: Record<string, string> = {};
      withPic.forEach((r: any) => { if (r.print_illustration_url) ready[r.illustration_url] = r.print_illustration_url; });
      if (withPic.length > 0 && Object.keys(ready).length === withPic.length) return ready;

      toast({ title: 'מכינים את האיורים להדפסה, בפעם הראשונה זה לוקח עד דקה וחצי' });
      const { data: { session } } = await supabase.auth.getSession();
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 90_000);
      try {
        const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/upscale-print-illustrations`, {
          method: 'POST',
          signal: ctrl.signal,
          headers: {
            'Content-Type': 'application/json',
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${session?.access_token ?? ''}`,
          },
          body: JSON.stringify({ storyId: story.id }),
        });
        if (res.ok) {
          const data = await res.json();
          for (const [k, v] of Object.entries<any>(data.images ?? {})) ready[k] = v.url;
        }
      } finally {
        clearTimeout(timer);
      }
      return ready;
    } catch (e) {
      console.warn('Print upscale unavailable, using original illustrations', e);
      return {};
    }
  };

  // ─── Square 21x21 cm book with 3 mm bleed ──
  const exportSquare = async (story: Story) => {
    const lang = printLang(story.language);
    const illustrationUrls = story.pages.map(p => p.illustration_url).filter((u): u is string => !!u);
    const urlsToSign = [...illustrationUrls];
    if (story.cover_url) urlsToSign.push(story.cover_url);
    const [signedUrlMap, printMap] = await Promise.all([
      fetchSignedUrls(urlsToSign, story.id),
      getPrintIllustrations(story),
    ]);
    const picUrl = (u: string) => printMap[u] || signedUrlMap[u] || u;

    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [PAGE_MM, PAGE_MM], compress: true });
    const container = document.createElement('div');
    container.style.cssText = `position:absolute;left:-99999px;top:0;width:${DESIGN}px;height:${DESIGN}px;`;
    document.body.appendChild(container);

    const seq = buildPageSequence(story.pages);
    try {
      for (let i = 0; i < seq.length; i++) {
        const slot = seq[i];
        const pageNo = i + 1;
        if (i > 0) pdf.addPage([PAGE_MM, PAGE_MM], 'portrait');
        switch (slot.kind) {
          case 'cover': {
            const p1 = story.pages.find(p => p.page_number === 1)?.illustration_url || story.pages[0]?.illustration_url;
            const src = p1 ? picUrl(p1) : story.cover_url ? picUrl(story.cover_url) : solMagicBookCover;
            let loaded: { img: HTMLImageElement; revoke: () => void } | null = null;
            try { loaded = await loadImage(src); } catch { loaded = await loadImage(solMagicBookCover); }
            try {
              await captureHtml(container, renderCoverPage(story.child_name, translateTopic(story.topic, story.language), lang, loaded.img.src), pdf, 'JPEG');
            } finally { loaded.revoke(); }
            break;
          }
          case 'insideCover':
            await captureHtml(container, renderInsideCover(lang), pdf, 'PNG');
            break;
          case 'dedication':
            await captureHtml(container, renderDedicationPage(lang), pdf, 'PNG');
            drawFooter(pdf);
            break;
          case 'text':
          {
            const el = renderTextOnlyPage(slot.storyIndexes.map(k => story.pages[k].text), lang);
            await fitTextPage(container, el);
            await captureHtml(container, el, pdf, 'PNG');
          }
            drawFooter(pdf, { pageNumber: pageNo });
            break;
          case 'illustration': {
            const u = story.pages[slot.storyIndex].illustration_url!;
            try {
              await addIllustrationPage(pdf, picUrl(u));
            } catch {
              // print copy failed to load → try the original, else a decorative page (never skip)
              try { await addIllustrationPage(pdf, signedUrlMap[u] || u); }
              catch { await captureHtml(container, renderDecorativePage(), pdf, 'JPEG'); }
            }
            drawFooter(pdf, { onPicture: true });
            break;
          }
          case 'decorative':
            await captureHtml(container, renderDecorativePage(), pdf, 'JPEG');
            drawFooter(pdf, { onPicture: true });
            break;
          case 'theEnd':
            await captureHtml(container, renderTheEndPage(story.child_name, lang, story.child_gender), pdf, 'JPEG');
            break;
          case 'blank':
            break;
          case 'backCover': {
            let photo: { img: HTMLImageElement; revoke: () => void } | null = null;
            if (story.child_photo_url) { try { photo = await loadImage(story.child_photo_url); } catch { photo = null; } }
            try {
              await captureHtml(container, await renderBackCoverPage(story.child_name, lang, photo?.img.src ?? null), pdf, 'JPEG');
            } finally { photo?.revoke(); }
            break;
          }
        }
      }
    } finally {
      document.body.removeChild(container);
    }
    return pdf;
  };

  const makePdfFileName = (story: Story) => {
    const safeName = story.child_name.replace(/[^\u0590-\u05FFa-zA-Z0-9]/g, '_').replace(/_+/g, '_');
    return `SoulStory_${safeName}_${story.id.slice(0, 8)}.pdf`;
  };

  const buildPdf = async (story: Story) => {
    return await exportSquare(story);
  };

  const exportToPdf = async (story: Story) => {
    if (isExporting) return;
    const entitled = await verifyPdfEntitlement(story.id);
    if (!entitled) {
      toast({
        title: 'הורדת ה-PDF דורשת רכישה',
        description: 'נדרשת רכישה כדי להוריד את הסיפור כקובץ PDF.',
        variant: 'destructive',
      });
      return;
    }
    setIsExporting(true);
    toast({ title: 'מכין את קובץ ה-PDF...' });

    try {
      const pdf = await buildPdf(story);
      const fileName = makePdfFileName(story);
      const blob = pdf.output('blob');
      const pdfFile = new File([blob], fileName, { type: 'application/pdf' });

      // Use native share sheet on mobile if available
      if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
        try {
          await navigator.share({
            files: [pdfFile],
            title: `הסיפור של ${story.child_name}`,
          });
          toast({ title: 'ה-PDF שותף בהצלחה!' });
        } catch (shareErr: any) {
          if (shareErr?.name !== 'AbortError') {
            pdf.save(fileName);
            toast({ title: 'ה-PDF הורד בהצלחה!' });
          }
        }
      } else {
        pdf.save(fileName);
        toast({ title: 'ה-PDF הורד בהצלחה!' });
      }
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast({ title: 'שגיאה ביצירת ה-PDF', variant: 'destructive' });
    } finally {
      setIsExporting(false);
    }
  };

  const generatePdfFile = async (story: Story): Promise<File> => {
    const entitled = await verifyPdfEntitlement(story.id);
    if (!entitled) {
      throw new Error('PDF entitlement required');
    }
    const pdf = await buildPdf(story);
    const blob = pdf.output('blob');
    const fileName = makePdfFileName(story);
    return new File([blob], fileName, { type: 'application/pdf' });
  };

  return { exportToPdf, generatePdfFile, isExporting };
};
