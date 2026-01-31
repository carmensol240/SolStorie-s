import { useState } from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { useToast } from '@/hooks/use-toast';

interface StoryPage {
  page_number: number;
  text: string;
  illustration_url: string | null;
}

interface Story {
  id: string;
  child_name: string;
  topic: string;
  pages: StoryPage[];
}

export type PdfLayout = 'portrait' | 'landscape-book';

export const usePdfExport = () => {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const loadImage = (url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  };

  const createPdfPage = async (
    content: HTMLDivElement,
    pdf: jsPDF,
    isFirstPage: boolean
  ) => {
    const canvas = await html2canvas(content, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: null,
    });

    const imgData = canvas.toDataURL('image/png');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    if (!isFirstPage) {
      pdf.addPage();
    }

    pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, pageHeight);
  };

  const exportPortrait = async (story: Story) => {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // Create a temporary container for rendering
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '0';
      container.style.width = `${pageWidth * 3.78}px`; // Convert mm to px (roughly)
      container.style.height = `${pageHeight * 3.78}px`;
      container.style.fontFamily = 'Heebo, Assistant, sans-serif';
      container.style.direction = 'rtl';
      document.body.appendChild(container);

      // Create cover page
      const coverPage = document.createElement('div');
      coverPage.style.cssText = `
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #F5E6D3 0%, #FFF8E7 100%);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 40px;
        box-sizing: border-box;
        direction: rtl;
      `;
      coverPage.innerHTML = `
        <div style="
          border: 4px double #8B4513;
          border-radius: 16px;
          padding: 48px;
          background: rgba(255,248,231,0.9);
          text-align: center;
          max-width: 80%;
        ">
          <div style="color: #8B4513; font-size: 14px; margin-bottom: 24px;">✦ סיפור מיוחד ✦</div>
          <h1 style="
            color: #8B4513;
            font-size: 32px;
            font-weight: bold;
            margin: 0 0 16px 0;
            line-height: 1.4;
          ">הסיפור של</h1>
          <h2 style="
            color: #9333ea;
            font-size: 42px;
            font-weight: bold;
            margin: 0 0 24px 0;
          ">${story.child_name}</h2>
          <p style="
            color: #6B4423;
            font-size: 18px;
            margin: 0;
            line-height: 1.6;
          ">${story.topic}</p>
        </div>
      `;
      container.innerHTML = '';
      container.appendChild(coverPage);
      await createPdfPage(container as any, pdf, true);

      // Create story pages
      for (let i = 0; i < story.pages.length; i++) {
        const page = story.pages[i];
        
        const storyPage = document.createElement('div');
        storyPage.style.cssText = `
          width: 100%;
          height: 100%;
          background: linear-gradient(to bottom, #FFF8E7 0%, #F5E6D3 100%);
          padding: 20px 24px;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          direction: rtl;
        `;

        let illustrationHtml = '';
        if (page.illustration_url) {
          try {
            const img = await loadImage(page.illustration_url);
            illustrationHtml = `
              <div style="
                flex: 0 0 65%;
                display: flex;
                justify-content: center;
                align-items: center;
                margin-bottom: 8px;
              ">
                <img 
                  src="${page.illustration_url}" 
                  style="
                    max-width: 95%;
                    max-height: 100%;
                    border-radius: 16px;
                    border: 3px solid #D4A574;
                    box-shadow: 0 8px 24px rgba(139, 69, 19, 0.2);
                    object-fit: contain;
                  "
                  crossorigin="anonymous"
                />
              </div>
            `;
          } catch (e) {
            console.log('Could not load illustration for page', i + 1);
          }
        }

        storyPage.innerHTML = `
          <div style="
            border: 3px solid #8B4513;
            border-radius: 16px;
            padding: 16px 20px;
            flex: 1;
            display: flex;
            flex-direction: column;
            background: rgba(255, 248, 231, 0.95);
            box-shadow: inset 0 2px 8px rgba(139, 69, 19, 0.1);
          ">
            ${illustrationHtml}
            
            <div style="
              flex: ${page.illustration_url ? '0 0 25%' : '1'};
              display: flex;
              align-items: ${page.illustration_url ? 'flex-start' : 'center'};
              justify-content: center;
              padding: 8px 16px;
            ">
              <p style="
                color: #4A3728;
                font-size: 28px;
                line-height: 1.8;
                text-align: center;
                margin: 0;
                font-family: Heebo, Assistant, sans-serif;
                max-width: 90%;
              ">${page.text}</p>
            </div>
            
            <div style="
              flex: 0 0 auto;
              text-align: center;
              color: #8B4513;
              font-size: 16px;
              padding-top: 8px;
              border-top: 2px solid #D4A574;
            ">✦ ${i + 1} / ${story.pages.length} ✦</div>
          </div>
        `;

        container.innerHTML = '';
        container.appendChild(storyPage);
        await createPdfPage(container as any, pdf, false);
      }

      // Cleanup
      document.body.removeChild(container);

    // Download the PDF
    const fileName = `סיפור-${story.child_name.replace(/\s+/g, '-')}.pdf`;
    pdf.save(fileName);
  };

  const exportLandscapeBook = async (story: Story) => {
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = pdf.internal.pageSize.getWidth();   // 297mm
    const pageHeight = pdf.internal.pageSize.getHeight(); // 210mm

    // Create a temporary container for rendering
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = `${pageWidth * 3.78}px`;
    container.style.height = `${pageHeight * 3.78}px`;
    container.style.fontFamily = 'Heebo, Assistant, sans-serif';
    container.style.direction = 'rtl';
    document.body.appendChild(container);

    // Create cover page (full width centered)
    const coverPage = document.createElement('div');
    coverPage.style.cssText = `
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #F5E6D3 0%, #FFF8E7 50%, #F5E6D3 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      direction: rtl;
    `;
    coverPage.innerHTML = `
      <div style="
        border: 4px double #8B4513;
        border-radius: 20px;
        padding: 48px 80px;
        background: rgba(255,248,231,0.95);
        text-align: center;
        box-shadow: 0 12px 40px rgba(139, 69, 19, 0.25);
      ">
        <div style="color: #8B4513; font-size: 16px; margin-bottom: 28px; letter-spacing: 4px;">✦ סיפור מיוחד ✦</div>
        <h1 style="
          color: #8B4513;
          font-size: 40px;
          font-weight: bold;
          margin: 0 0 16px 0;
          line-height: 1.4;
        ">הסיפור של</h1>
        <h2 style="
          color: #9333ea;
          font-size: 56px;
          font-weight: bold;
          margin: 0 0 28px 0;
        ">${story.child_name}</h2>
        <p style="
          color: #6B4423;
          font-size: 24px;
          margin: 0;
          line-height: 1.6;
        ">${story.topic}</p>
      </div>
    `;
    container.innerHTML = '';
    container.appendChild(coverPage);
    await createPdfPage(container as any, pdf, true);

    // Create story spreads (image on right, text on left - RTL)
    for (let i = 0; i < story.pages.length; i++) {
      const page = story.pages[i];
      
      const spreadPage = document.createElement('div');
      spreadPage.style.cssText = `
        width: 100%;
        height: 100%;
        display: flex;
        direction: rtl;
        background: linear-gradient(to right, #FFF8E7 0%, #FFF8E7 49.5%, #D4A574 49.5%, #8B4513 50%, #D4A574 50.5%, #FFF8E7 50.5%, #FFF8E7 100%);
      `;

      let illustrationHtml = '';
      if (page.illustration_url) {
        try {
          await loadImage(page.illustration_url);
          illustrationHtml = `
            <img 
              src="${page.illustration_url}" 
              style="
                max-width: 90%;
                max-height: 90%;
                border-radius: 16px;
                box-shadow: 0 8px 32px rgba(139, 69, 19, 0.25);
                object-fit: contain;
              "
              crossorigin="anonymous"
            />
          `;
        } catch (e) {
          console.log('Could not load illustration for page', i + 1);
        }
      }

      spreadPage.innerHTML = `
        <!-- Right side - Illustration (in RTL this appears first/right) -->
        <div style="
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #FFF8E7 0%, #F5E6D3 100%);
          padding: 24px;
        ">
          ${illustrationHtml || `
            <div style="
              width: 80%;
              height: 80%;
              background: linear-gradient(135deg, #F5E6D3, #E8D4BC);
              border-radius: 16px;
              display: flex;
              align-items: center;
              justify-content: center;
              color: #8B4513;
              font-size: 48px;
            ">📖</div>
          `}
        </div>
        
        <!-- Left side - Text (in RTL this appears second/left) -->
        <div style="
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: #FFF8E7;
          padding: 40px;
          position: relative;
        ">
          <!-- Decorative corner -->
          <div style="
            position: absolute;
            top: 20px;
            right: 20px;
            color: #D4A574;
            font-size: 24px;
          ">❧</div>
          
          <p style="
            color: #4A3728;
            font-size: 32px;
            line-height: 2;
            text-align: center;
            margin: 0;
            font-family: Heebo, Assistant, sans-serif;
            max-width: 85%;
          ">${page.text}</p>
          
          <!-- Page number -->
          <div style="
            position: absolute;
            bottom: 24px;
            left: 50%;
            transform: translateX(-50%);
            color: #8B4513;
            font-size: 18px;
          ">✦ ${i + 1} / ${story.pages.length} ✦</div>
          
          <!-- Decorative corner -->
          <div style="
            position: absolute;
            bottom: 20px;
            left: 20px;
            color: #D4A574;
            font-size: 24px;
            transform: rotate(180deg);
          ">❧</div>
        </div>
      `;

      container.innerHTML = '';
      container.appendChild(spreadPage);
      await createPdfPage(container as any, pdf, false);
    }

    // Cleanup
    document.body.removeChild(container);

    // Download the PDF
    const fileName = `ספר-${story.child_name.replace(/\s+/g, '-')}.pdf`;
    pdf.save(fileName);
  };

  const exportToPdf = async (story: Story, layout: PdfLayout = 'portrait') => {
    if (isExporting) return;
    
    setIsExporting(true);
    toast({ title: 'מכין את קובץ ה-PDF...' });

    try {
      if (layout === 'landscape-book') {
        await exportLandscapeBook(story);
      } else {
        await exportPortrait(story);
      }

      toast({ title: 'ה-PDF הורד בהצלחה!' });
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast({ 
        title: 'שגיאה ביצירת ה-PDF', 
        variant: 'destructive' 
      });
    } finally {
      setIsExporting(false);
    }
  };

  return { exportToPdf, isExporting };
};
