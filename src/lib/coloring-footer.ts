import solPage from "@/assets/coloring-gang/sol.png.asset.json";
import { coloringCorsUrl, prepareColoringCanvas, fitContain } from "@/lib/coloring-a4";

export const COLORING_COPYRIGHT = "© 2026 SolStories · soulstory.co.il · לשימוש אישי בלבד · אין למכור או להפיץ מחדש";
export const COLORING_COPYRIGHT_PAID = "© 2026 SolStories · soulstory.co.il";
export const COLORING_FOOTER_TOP = 3050 / 3508;
const pages = new Map<string, Promise<string>>();

async function image(url: string) {
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = coloringCorsUrl(url);
  await img.decode();
  return img;
}

/** Free pages keep their original name/brand pixels; paid pages reuse that exact brand strip. */
export function withColoringFooter(url: string, childName?: string | null): Promise<string> {
  const key = JSON.stringify([url, childName]);
  const cached = pages.get(key);
  if (cached) return cached;
  const result = (async () => {
    await document.fonts.ready;
    const img = await image(url);
    const canvas = document.createElement("canvas");
    canvas.width = 2480;
    canvas.height = 3508;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas unavailable");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (childName) {
      const source = prepareColoringCanvas(img);
      const fit = fitContain(img.naturalWidth, img.naturalHeight, 2480, 3000);
      ctx.drawImage(source, fit.x, fit.y, fit.w, fit.h);
      ctx.textAlign = "center";
      ctx.direction = "rtl";
      ctx.fillStyle = "#000000";
      ctx.font = "bold 180px Heebo, Arial, sans-serif";
      ctx.fillText(childName, 1240, 3242, 2200);
      const template = await image(solPage.url);
      // Copy the unchanged free-page application name: same font, size, color and position.
      ctx.drawImage(template, 0, 3280, 2480, 110, 0, 3280, 2480, 110);
    } else {
      ctx.drawImage(img, 0, 0, 2480, 3508);
    }
    ctx.textAlign = "center";
    // Base direction RTL so the line reads right-to-left: "© 2026 SolStories" on the right.
    ctx.direction = "rtl";
    ctx.fillStyle = "#444444";
    ctx.font = "40px Heebo, Arial, sans-serif";
    ctx.fillText(childName ? COLORING_COPYRIGHT_PAID : COLORING_COPYRIGHT, 1240, 3450, 2240);
    return canvas.toDataURL("image/png");
  })();
  pages.set(key, result);
  if (pages.size > 16) {
    const oldest = pages.keys().next().value;
    if (oldest !== undefined) pages.delete(oldest);
  }
  result.catch(() => pages.delete(key));
  return result;
}