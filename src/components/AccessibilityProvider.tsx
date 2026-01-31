import { ReactNode } from "react";
import { AccessibilityContext, useAccessibilityState } from "@/hooks/use-accessibility";

interface AccessibilityProviderProps {
  children: ReactNode;
}

const AccessibilityProvider = ({ children }: AccessibilityProviderProps) => {
  const accessibilityState = useAccessibilityState();

  return (
    <AccessibilityContext.Provider value={accessibilityState}>
      {children}
    </AccessibilityContext.Provider>
  );
};

export default AccessibilityProvider;
