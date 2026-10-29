import type { Metadata } from "next";
import { SpiritLens } from "~/components/spirit-lens/spirit-lens";

export const metadata: Metadata = {
  title: "Spirit Lens · Tsukuyomi Watch",
  description:
    "Restore and explore your astronomical images with local AI denoising and an interactive comparison view.",
};

export default function SpiritLensPage() {
  return <SpiritLens />;
}
