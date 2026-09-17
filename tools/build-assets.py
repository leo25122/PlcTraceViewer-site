#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Builds every image the website uses, from the original screenshots.

    python tools/build-assets.py

Two rules are baked in and must stay:

1. The LOG panel of the Live window is never published. It is cropped away from
   every shot (the right-hand column), because the lines in it describe how the
   fast read works — that belongs to us, not to a competitor with a zoom tool.
2. Nothing is retouched. Values, names and timings in the shots are the ones the
   application really showed; the only operation is a rectangular crop and a
   resize. What the site shows is what the program does.

Sources stay where they are (SRC below); only the generated files live in the repo.
"""

import os, sys, shutil
from PIL import Image

SRC  = r"D:\App\PLCTrace\Screenshot\PLCTraceViewer"
ART  = os.path.join(SRC, "website-assets-creative")
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT  = os.path.join(HERE, "assets", "img")

# The Live window is 1919 px wide; its right-hand column (ACQUISITION + LOG)
# starts at x = 1518. Everything from there on is cut.
LOG_X = 1516

S = lambda n: os.path.join(SRC, "Screenshot 2026-09-17 %s.png" % n)

#  out name              source        crop (l, t, r, b) or None      max width
JOBS = [
    # ── the Live window ────────────────────────────────────────────────────
    ("app-workspace",     S("161306"), (0,    0,   LOG_X, 1150), 1516),
    ("app-grid",          S("161306"), (332,  140, LOG_X, 1128), 1184),
    ("app-tree",          S("161306"), (0,    105, 336,   1128), 336),
    ("app-toolbar",       S("161306"), (0,    0,   LOG_X, 103),  1516),
    ("app-charts",        S("161836"), (332,  105, LOG_X, 1128), 1184),
    ("app-charts-wide",   S("161836"), (0,    0,   LOG_X, 1150), 1516),
    ("app-workspace-2",   S("161802"), (0,    0,   LOG_X, 1150), 1516),
    ("app-live-values",   S("161250"), (332,  140, LOG_X, 1128), 1184),
    ("app-io",            S("160842"), (0,    0,   1022,  812),  1022),
    ("app-rate-warning",  S("160842"), (0,    788, 430,   812),  430),
    ("app-acquisition",   S("161425"), None,                     397),

    # ── the Analysis window (no log panel in it) ───────────────────────────
    ("analysis",          S("161135"), (0,    0,   1919,  1150), 1516),
    ("analysis-2",        S("161112"), (0,    0,   1919,  1148), 1516),
    ("analysis-3",        S("161058"), (0,    0,   1919,  1143), 1516),
    ("analysis-4",        S("161153"), (0,    0,   1919,  1152), 1516),
    ("analysis-markers",  S("161135"), (292,  902, 1692,  1078), 1400),
    ("analysis-stats",    S("161135"), (0,    75,  286,   790),  286),
    ("analysis-summary",  S("161135"), (1694, 75,  1919,  800),  286),

    # ── dialogs and in-app help ────────────────────────────────────────────
    ("dialog-s7",         S("161401"), None, 545),
    ("dialog-ring",       S("161346"), None, 624),
    ("tip-import-tags",   S("161318"), None, 589),
    ("tip-tia-project",   S("161323"), None, 668),
    ("tip-reread",        S("161331"), None, 650),
    ("tip-web",           S("161336"), None, 440),
    ("tip-trace-db",      S("161340"), None, 711),
    ("tip-folder",        S("161746"), None, 207),
    ("tip-new-live",      S("161407"), None, 165),
]

# Art direction pieces, already prepared as 16:9 WebP.
ART_JOBS = [
    ("art-plant",     "01-plant-to-live-insight.webp"),
    ("art-workflow",  "02-signal-ribbon-workflow.webp"),
    ("art-analysis",  "03-analysis-data-sculpture.webp"),
    ("art-portal",    "04-physical-to-digital-portal.webp"),
    ("art-workbench", "05-workbench-live-signals.png"),
    ("art-waterfall", "06-analysis-waterfall.png"),
]

# These also get a PNG next to the WebP: they are the ones a very old browser
# would otherwise show as a broken box on the first screen.
NEED_PNG = {"app-workspace"}


def emit(img, name, maxw, png=False):
    if img.width > maxw:
        img = img.resize((maxw, round(img.height * maxw / img.width)), Image.LANCZOS)
    img = img.convert("RGB")
    w = os.path.join(OUT, name + ".webp")
    img.save(w, "WEBP", quality=88, method=6)
    size = os.path.getsize(w) / 1024
    extra = ""
    if png:
        p = os.path.join(OUT, name + ".png")
        img.save(p, "PNG", optimize=True)
        extra = " + png %.0f KB" % (os.path.getsize(p) / 1024)
    print("  %-22s %4d x %-4d  %6.0f KB%s" % (name, img.width, img.height, size, extra))


def main():
    os.makedirs(OUT, exist_ok=True)
    missing = 0
    print("screenshots →")
    for name, src, box, maxw in JOBS:
        if not os.path.exists(src):
            print("  MISSING", src); missing += 1; continue
        im = Image.open(src)
        if box:
            box = (box[0], box[1], min(box[2], im.width), min(box[3], im.height))
            im = im.crop(box)
        emit(im, name, maxw, png=name in NEED_PNG)

    print("art →")
    for name, fn in ART_JOBS:
        src = os.path.join(ART, fn)
        if not os.path.exists(src):
            print("  MISSING", src); missing += 1; continue
        emit(Image.open(src), name, 1672, png=name in NEED_PNG)

    total = sum(os.path.getsize(os.path.join(OUT, f)) for f in os.listdir(OUT))
    print("\n%d files, %.1f MB in %s" % (len(os.listdir(OUT)), total / 1048576, OUT))
    return 1 if missing else 0


if __name__ == "__main__":
    sys.exit(main())
