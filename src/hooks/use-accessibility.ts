import { useState, useEffect, createContext, useContext } from "react";

interface AccessibilitySettings {
  visualAidMode: boolean;
  audioSupport: boolean;
}

interface AccessibilityContextValue extends AccessibilitySettings {
  setVisualAidMode: (enabled: boolean) => void;
  setAudioSupport: (enabled: boolean) => void;
}

const STORAGE_KEY = "accessibility_settings";

const defaultSettings: AccessibilitySettings = {
  visualAidMode: false,
  audioSupport: false,
};

export const AccessibilityContext = createContext<AccessibilityContextValue | null>(null);

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error("useAccessibility must be used within AccessibilityProvider");
  }
  return context;
};

export const useAccessibilityState = (): AccessibilityContextValue => {
  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    if (typeof window === "undefined") return defaultSettings;
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : defaultSettings;
  });

  // Apply visual aid mode to document
  useEffect(() => {
    if (settings.visualAidMode) {
      document.documentElement.classList.add("visual-aid-mode");
    } else {
      document.documentElement.classList.remove("visual-aid-mode");
    }
  }, [settings.visualAidMode]);

  // Persist settings
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const setVisualAidMode = (enabled: boolean) => {
    setSettings((prev) => ({ ...prev, visualAidMode: enabled }));
  };

  const setAudioSupport = (enabled: boolean) => {
    setSettings((prev) => ({ ...prev, audioSupport: enabled }));
  };

  return {
    ...settings,
    setVisualAidMode,
    setAudioSupport,
  };
};
