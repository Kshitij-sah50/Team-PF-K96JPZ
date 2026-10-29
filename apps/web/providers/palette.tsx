"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { JapaneseText } from "~/components/japanese-text";

export const palettes = [
  {
    id: "tsukuyomi",
    label: "墨 Ink Wash · Indigo",
    meaning: "墨 — Ink, used in traditional ink-wash painting",
  },
  {
    id: "akatsuki",
    label: "鳥居 Torii · Crimson",
    meaning: "鳥居 — Torii, a traditional Japanese shrine gate",
  },
  { id: "sakura", label: "桜 Sakura · Rose", meaning: "桜 — Sakura, cherry blossom" },
  { id: "katana", label: "刀 Katana · Black & Gold", meaning: "刀 — Katana, a Japanese sword" },
] as const;
type Palette = (typeof palettes)[number]["id"];
const isPalette = (value: string | null): value is Palette =>
  palettes.some((palette) => palette.id === value);
const PaletteContext = createContext<{
  palette: Palette;
  setPalette: (palette: Palette) => void;
  ready: boolean;
}>({ palette: "tsukuyomi", setPalette: () => {}, ready: false });

export function PaletteProvider({ children }: { children: ReactNode }) {
  const [palette, setPalette] = useState<Palette>("tsukuyomi");
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try {
      const stored = localStorage.getItem("tsukuyomi-palette");
      if (stored === "bamboo") setPalette("katana");
      else if (isPalette(stored)) setPalette(stored);
    } catch {
      /* The default works without storage. */
    }
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    document.documentElement.dataset.palette = palette;
    try {
      localStorage.setItem("tsukuyomi-palette", palette);
    } catch {
      /* Keep the selected palette for this visit. */
    }
  }, [palette, ready]);
  return (
    <PaletteContext.Provider value={{ palette, setPalette, ready }}>
      {children}
    </PaletteContext.Provider>
  );
}

export function PalettePicker() {
  const { palette, setPalette, ready } = useContext(PaletteContext);
  return (
    <label className="watch-palette-picker">
      <span className="sr-only">Color palette</span>
      <JapaneseText
        meaning={palettes.find((option) => option.id === palette)!.meaning}
        asChild
        touchToggle={false}
      >
        <select
          aria-label="Color palette"
          value={palette}
          disabled={!ready}
          onChange={(event) => {
            if (isPalette(event.target.value)) setPalette(event.target.value);
          }}
        >
          {palettes.map((option) => (
            <option key={option.id} value={option.id} title={option.meaning}>
              {option.label}
            </option>
          ))}
        </select>
      </JapaneseText>
    </label>
  );
}
