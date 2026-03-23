import { useEffect } from "react";

export function useTimeTheme() {
  useEffect(() => {
    const applyTheme = () => {
      const hour = new Date().getHours();
      const isDark = hour >= 18 || hour < 6;
      document.documentElement.classList.toggle("dark", isDark);
    };

    applyTheme();
    const interval = setInterval(applyTheme, 60_000);
    return () => clearInterval(interval);
  }, []);
}
