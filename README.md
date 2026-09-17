# PlcTraceViewer — website

The product site for **PlcTraceViewer**, a signal recorder and analyser for Siemens
S7-300/400/1200/1500 PLCs. Published with GitHub Pages at
<https://leo25122.github.io/PlcTraceViewer-site/>.

## Structure

```
index.html          the product story (hero, workspace, speed, analysis, editions, FAQ)
datasheet.html      the technical datasheet, DS-PTV-21 — prints as a proper document
quickstart.html     from installing to the first recorded file, in ten steps
404.html            served by GitHub Pages for unknown paths
assets/css/site.css one stylesheet: design tokens, components, animations
assets/js/site.js   one script: language, theme, reveals, canvases, lightbox, function wall
assets/js/functions.js   generated — the 94 expression functions the application accepts
assets/img/         generated — every screenshot and campaign image the site uses
tools/build-assets.py    regenerates assets/img from the original screenshots
```

No framework, no build step, no dependency beyond the Google Fonts stylesheet: the pages are
plain HTML5 and are served exactly as they are committed.

## Both languages live in the page

Italian and English sit side by side in the markup, marked `data-it` and `data-en`; the
stylesheet hides one of the two according to `<html lang>`, and the IT/EN switch in the header
changes it (remembered in `localStorage`). Adding copy means adding both variants — a paragraph
with only one will show in both languages.

## Images

`tools/build-assets.py` crops and converts the original screenshots (they live outside this
repository) into `assets/img`. Two rules are part of the script and must stay:

1. **The LOG panel of the Live window is never published.** It is cropped out of every shot.
2. **Nothing is retouched.** Values, names and timings in the screenshots are the ones the
   application really showed; the only operations are a rectangular crop and a resize.

```bash
python tools/build-assets.py      # needs Pillow
```

`assets/js/functions.js` is generated from the application's own function registry, so the list
the site shows is the list the expression editor accepts.

## Claims

Every figure on the site is either measured or explicitly framed as an illustration. The
sampling numbers in the speed section come from the application's test bench (100 channels at
1 ms against simulated controllers, with the interface deliberately under load) and are labelled
as such; the site never promises a rate for a real plant, because that depends on the CPU.

© 2026 Leonardo Dogariu. Siemens, SIMATIC, S7 and TIA Portal are trademarks of Siemens AG;
this product is not affiliated with Siemens AG.
