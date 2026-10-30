import { useEffect, useState } from "react";
import { withColoringFooter, type ColoringPageSize } from "@/lib/coloring-footer";

export function useColoringFooter(url: string, childName?: string | null, size: ColoringPageSize = "preview") {
  const [page, setPage] = useState<{ key: string; url: string } | null>(null);
  const key = JSON.stringify([url, childName, size]);
  useEffect(() => {
    if (!url) return;
    let alive = true;
    let ownedUrl: string | undefined;
    const controller = new AbortController();
    withColoringFooter(url, childName, size, controller.signal).then((value) => {
      if (!alive) { URL.revokeObjectURL(value); return; }
      ownedUrl = value;
      if (alive) setPage({ key, url: value });
    }).catch((error) => { if (error?.name !== "AbortError") console.error("Coloring footer failed", error); });
    return () => {
      alive = false;
      controller.abort();
      if (ownedUrl) URL.revokeObjectURL(ownedUrl);
    };
  }, [url, childName, size, key]);
  return page?.key === key ? page.url : null;
}