"use client";

import { useState } from "react";
import { THEME_STORAGE_KEY } from "@/lib/theme-constants";

export type Theme = "light" | "dark" | "exp" | "terminal";

export { THEME_STORAGE_KEY };

function readStoredTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  return stored === "light" || stored === "exp" || stored === "terminal" ? stored : "dark";
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.classList.toggle("theme-exp", theme === "exp");
  root.classList.toggle("theme-terminal", theme === "terminal");
  localStorage.setItem(THEME_STORAGE_KEY, theme);
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(readStoredTheme);

  function setTheme(next: Theme) {
    setThemeState(next);
    applyTheme(next);
  }

  return { theme, setTheme };
}
