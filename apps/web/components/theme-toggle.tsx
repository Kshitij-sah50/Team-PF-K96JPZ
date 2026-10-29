"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isLight = mounted && resolvedTheme === "light";
  const label = `Switch to ${isLight ? "dark" : "light"} mode`;
  return (
    <button
      type="button"
      className="watch-theme-toggle"
      onClick={() => setTheme(isLight ? "dark" : "light")}
      disabled={!mounted}
      aria-label={label}
      title={label}
    >
      {isLight ? <Moon size={16} aria-hidden="true" /> : <Sun size={16} aria-hidden="true" />}
      <span>{isLight ? "Dark mode" : "Light mode"}</span>
    </button>
  );
}
