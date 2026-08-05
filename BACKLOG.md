# Backlog

Ideas for later. Not scheduled, not ordered by priority — grouped by the area
they touch. Notes point at the files a change would most likely start from.

## Input

- [ ] **Load an SVG and preview it as a plot** — drop in the SVG output of a
      coding sketch (p5, Processing, whatever) and see it on the sheet exactly
      like a generated plot: paper fit, path length, travel, pen colour, export.
      Bypasses the whole image path — no tone map, no algorithm — so it needs a
      second route into `pipeline/generate.js` that parses the SVG, flattens
      curves/arcs into polylines in mm, and returns the same
      `{ pen, polylines }` layer shape everything downstream already expects.
      Open questions: which units the incoming file uses (px vs mm vs viewBox),
      whether to honour the SVG's own stroke colours as separate pen layers, and
      what to do with fills (ignore, or hand off to the fill techniques item).

## Canvas & artwork placement

- [ ] **Rotate the artwork on the sheet** — free rotation (or 90° steps) of the
      generated art inside the paper, independent of the paper orientation.
      Touches `geometry/layout.js` (the draw area becomes a transform, not just
      a rect) and `export/exportSVG.js` so the SVG matches the preview.
- [ ] **Scale the artwork manually** — a size/zoom control instead of always
      fitting to the sheet, with the option to overflow past the margins.
      Pairs naturally with drag-to-position.
- [ ] **Change the canvas background colour** — simulate coloured or toned
      paper behind the strokes. Affects `P5Canvas.jsx` and probably wants a
      matching background rect in the SVG export (or an explicit "preview only"
      note).
- [ ] **Landscape / portrait toggle** — the paper presets are portrait-only
      today (`PAPER_SIZES` in `panels/ExportPanel.jsx`).

## Preview & comparison

- [ ] **Compare source and plot preview side by side** — the view toggle is
      either/or right now. A split view (or a wipe slider over the sheet) makes
      it much easier to judge whether the algorithm is holding the tones.
- [x] **Show/hide individual layers** — per-layer visibility so a CMYK plot can
      be inspected one plate at a time, or two plates together.
      Done: an eye toggle per row in `panels/ColorPanel.jsx`, with `visible` on
      each pen. No separate layer list was needed — the colour rows already are
      one. `pipeline/generate.js` skips hidden channels, so they drop out of the
      preview, the export, and the length/travel readouts together. The filter
      runs *after* `_offset` is assigned, so hiding one layer never shifts the
      strokes of the others.
- [ ] **Solo a layer** — one click to isolate, as the fast path of the above.
      Now cheap: the `visible` flags exist, so this is a modifier-click (or a
      small button) that sets one true and the rest false, plus a way back.
- [ ] **Zoom into the artwork** — scroll/pinch to zoom and drag to pan the
      preview, to check stroke density and pen overlap up close. A viewport
      transform in `P5Canvas.jsx` (the `mx`/`my` mm→px mapping already funnels
      every coordinate through one place), not a change to the plot itself —
      distinct from scaling the artwork on the sheet. Wants a "fit to sheet"
      reset and a zoom-level indicator.

## Colour

- [x] **Colour picker** — pick an arbitrary ink colour rather than choosing from
      the fixed pen list.
      Done: `panels/ColorPanel.jsx`. Native `<input type="color">` behind the
      swatch plus an editable hex field that only commits once it parses. The
      fixed `PENS` list is gone; `pens/pens.js` now holds just the per-channel
      starting colours and the shared nib width.
- [ ] **N-colour mode** — a third mode beyond mono and CMYK: add as many
      pens/colours as you like and let the app work out how to split the image
      across them (nearest-colour assignment, or a proper separation solved
      against the chosen inks). Biggest single item here; `color/separate.js` is
      the starting point.
- [ ] **Real pen library** — actual products (Micron, Posca, Staedtler, gel
      pens…) with their true ink colour and nib width in mm, so the preview
      stroke weight and the exported line width match what will be plotted.
      Extends `pens/pens.js`.
      Also the right home for **drying and directionality**: a `wet` pen draws
      adjacent strokes back-to-back under travel optimization and smears, and a
      `directional` nib (chisel, brush, flex) shows it when `optimizeTravel`
      reverses a stroke. Both want a structured draw order instead. That's a
      property of the pen, not a user setting — the old "Optimize travel"
      toggle asked the question the wrong way round and has been removed, so
      the ordering strategy should be derived from the selected pen here.
- [ ] **Paper/ink interaction** — coarse simulation of how ink sits on the
      chosen paper colour, so previews on toned stock aren't misleading.

## Algorithms

- [ ] **Cross-stitch / punto de cruz** — grid of little ×-marks, density driven
      by tone.
- [ ] **Stipple** — `algorithms/stipple.js` is a stub: it declares params but no
      `process()`, and it isn't listed in `algorithms/index.js`, so it never
      shows up in the UI. Needs weighted dot placement (Poisson/Lloyd relaxation
      against the tone map) and registering.
- [ ] **Dots only / solo puntos** — the simpler cousin of stipple: fixed grid,
      dot size driven by tone, no relaxation.
- [ ] **Circles only / solo círculos** — concentric or scattered circles sized
      by local tone.
- [x] **Pixel art** — quantise to a coarse grid and fill each cell.
      Done: `algorithms/pixelart.js`.
- [ ] **Fill techniques** — a shared set of fills (hatch, contour-following,
      concentric, scribble, Hilbert/space-filling) that algorithms can call
      into, instead of each one inventing its own. Would live alongside
      `algorithms/` as something like `fills/`.
- [ ] **Edge/contour tracing** — outline pass that can be layered under any
      fill.

## Output

- [ ] **Plot directly from the app** — drive the machine over WebSerial
      (AxiDraw/EBB, GRBL, or plain G-code) instead of exporting an SVG and
      handing it to another tool. Needs pen up/down + speed settings, a job
      queue, and pause/resume. Big one, but it closes the loop.
- [ ] **PDF export** — the button exists in `panels/ExportPanel.jsx` but is
      hidden behind `SHOW_PDF_EXPORT`. Flip that flag when there's something
      behind it; until then the panel shouldn't advertise a feature we may
      never build.
- [ ] **Per-layer file export** — one SVG per pen for multi-colour plots that
      are run as separate passes.
- [ ] **Plot time estimate** — from path length + travel + pen-up count, so the
      readout says "about 12 minutes", not just millimetres.
