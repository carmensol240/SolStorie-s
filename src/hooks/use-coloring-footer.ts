import { useEffect, useState } from "react";
import { withColoringFooter } from "@/lib/coloring-footer";

export function useColoringFooter(url: string, childName?: string | null) {
  const [page, setPage] = useState<{ key: string; url: string } | null>(null);
  const key = JSON.stringify([url, childName]);
  useEffect(() => {
    if (!url) return;
    let alive = true;
    withColoringFooter(url, childName).then((value) => {
      if (alive) setPage({ key, url: value });
    }).catch((error) => console.error("Coloring footer failed", error));
    return () => { alive = false; };
  }, [url, childName, key]);
  return page?.key === key ? page.url : null;
}