import { ReactNode, useEffect, forwardRef } from "react";
import { AccessibilityContext, useAccessibilityState } from "@/hooks/use-accessibility";

interface AccessibilityProviderProps {
  children: ReactNode;
}

const AccessibilityProvider = ({ children }: AccessibilityProviderProps) => {
  const accessibilityState = useAccessibilityState();

  // Restore persisted accessibility classes on mount
  useEffect(() => {
    if (localStorage.getItem('a11y_highlight_links') === 'true') {
      document.documentElement.classList.add('highlight-links');
    }
    if (localStorage.getItem('a11y_reduced_motion') === 'true') {
      document.documentElement.classList.add('reduced-motion');
    }
    if (localStorage.getItem('a11y_large_cursor') === 'true') {
      document.documentElement.classList.add('large-cursor');
    }
  }, []);

  return (
    <AccessibilityContext.Provider value={accessibilityState}>
      {children}
    </AccessibilityContext.Provider>
  );
};

export default AccessibilityProvider;
