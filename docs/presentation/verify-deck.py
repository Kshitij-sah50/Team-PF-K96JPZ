"""Structural artifact checks; visual review remains necessary. Standard library only."""
from pathlib import Path
import re
import sys
import xml.etree.ElementTree as ET
from zipfile import ZipFile

root = Path(__file__).resolve().parent
ns = {"a": "http://schemas.openxmlformats.org/drawingml/2006/main",
      "p": "http://schemas.openxmlformats.org/presentationml/2006/main"}
stem = sys.argv[1] if len(sys.argv) > 1 else "Tsukuyomi-Watch-Judging-Deck"
expected = 8 if stem == "Tsukuyomi-Watch-8-Slide-Pitch" else 17
with ZipFile(root / (stem + ".pptx")) as archive:
    assert archive.testzip() is None, "Corrupt ZIP member"
    slides = sorted(n for n in archive.namelist() if re.fullmatch(r"ppt/slides/slide\d+\.xml", n))
    notes = sorted(n for n in archive.namelist() if re.fullmatch(r"ppt/notesSlides/notesSlide\d+\.xml", n))
    assert len(slides) == len(notes) == expected, (len(slides), len(notes))
    size = ET.fromstring(archive.read("ppt/presentation.xml")).find("p:sldSz", ns)
    width, height = int(size.attrib["cx"]), int(size.attrib["cy"])
    texts = []
    for name in slides:
        slide = ET.fromstring(archive.read(name))
        words = " ".join(t.text or "" for t in slide.findall(".//a:t", ns))
        assert words.strip(), f"Empty slide: {name}"
        texts.append(words)
        for transform in slide.findall(".//a:xfrm", ns):
            origin, extent = transform.find("a:off", ns), transform.find("a:ext", ns)
            if origin is None or extent is None:
                continue
            x, y = int(origin.attrib["x"]), int(origin.attrib["y"])
            w, h = int(extent.attrib["cx"]), int(extent.attrib["cy"])
            assert min(x, y, w, h) >= 0, f"Negative shape bounds: {name}"
            assert x + w <= width + 100 and y + h <= height + 100, f"Off-slide shape: {name}"
    for name in notes:
        words = " ".join(t.text or "" for t in ET.fromstring(archive.read(name)).findall(".//a:t", ns))
        assert len(words) > 100, f"Missing speaker notes: {name}"
    joined = " ".join(texts)
    if expected == 17:
        assert "28" in joined and "41" in joined and "15.8" in joined
    else:
        assert "31 / 31" in joined and "Spirit Lens" in joined
    assert "postgresql://" not in joined and "npg_" not in joined
pdf = (root / (stem + ".pdf")).read_bytes()
assert pdf.startswith(b"%PDF-"), "Invalid PDF header"
print(f"PASS: {expected} slides, {expected} speaker-note pages, valid ZIP/PDF, no off-slide shapes.")
