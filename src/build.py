"""Inline the four tab icons (Figma 115:1252/1261/1271/1280) as currentColor SVGs and emit index.html."""
import re
from pathlib import Path

root = Path(__file__).resolve().parent.parent
src = (root / "src" / "index.src.html").read_text()


def icon(n: int) -> str:
    svg = (root / "assets" / f"tab{n}.svg").read_text()
    svg = re.sub(r'\s(preserveAspectRatio|overflow|style)="[^"]*"', "", svg)
    svg = re.sub(r'\sid="[^"]*"', "", svg)
    # outer ring: first circle/path carrying the white fill
    svg = re.sub(r'<circle cx="24" cy="24" r="23.5" stroke="#020814" stroke-opacity="0.16"/>',
                 '<circle class="ring" cx="24" cy="24" r="23.5"/>', svg)
    svg = re.sub(r'(<path d="M47.5 24C47[^"]*" fill="white") stroke="#5D30C8"/>',
                 r'\1/><circle class="ring" cx="24" cy="24" r="23.5"/>', svg)
    svg = re.sub(r'stroke="#(020814|5D30C8)"', 'stroke="currentColor"', svg)
    svg = re.sub(r'fill="#(020814|5D30C8)"', 'fill="currentColor"', svg)
    svg = svg.replace("<svg ", '<svg aria-hidden="true" focusable="false" ', 1)
    return " ".join(svg.split())


out = src
for n in range(1, 5):
    out = out.replace("{{TAB%d}}" % n, icon(n))
(root / "index.html").write_text(out)
print("ok", len(out), "placeholders left:", out.count("{{"))
