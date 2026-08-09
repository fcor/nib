# Nib

Turn an image into a pen-plotter drawing. Drop in a photo, pick an algorithm
that renders its tones as lines, and export an SVG that plots at true physical
size.

**[Try it →](https://fcor.github.io/nib/)**

Everything runs in the browser. No upload, no server — the image never leaves
the machine.

## What it does

Nib reads an image's tone and re-draws it as strokes a pen can actually make.
Darkness becomes line density, wiggle amplitude, or fill — depending on the
algorithm — and the result comes out as a layered SVG ready for AxiDraw,
Inkscape, or any plotter toolchain.

- **Serpentine Wiggle** — a single continuous line, left to right; wiggle
  amplitude maps to darkness.
- **Spiral Halftone** — one spiral from the centre, radial wiggle mapping tone.
- **Cross-hatch** — layered angled strokes; darker areas add more layers.
- **Pixel Art** — a coarse square grid, each cell filled by tone.

## Features

- **Mono or CMYK.** CMYK separates the image into ink channels and runs the
  algorithm once per channel, interleaving the layers so overlapping colours
  mix on paper.
- **Free ink colours.** Pick any colour per layer; the preview draws at the
  pen's true nib width, so density on screen matches density on paper.
- **Per-layer visibility.** Inspect a multi-colour plot one plate at a time.
  Hidden layers drop out of the preview, the export, and the readouts together.
- **Travel optimised.** Strokes are reordered to cut pen-up movement. It can't
  change the artwork, only the order it's drawn in, so it's always on.
- **Live readouts.** Path length and pen-up travel in millimetres, updating as
  you tune.
- **A3 / A4 / A5**, with the artwork fitted to the sheet inside its margins.

## Export

The SVG uses millimetres as its user unit, so it plots at real size with no
scaling step. Each pen becomes its own Inkscape-labelled layer group carrying
that pen's colour and nib width — the format AxiDraw's "layers" mode plots
pass-by-pass, pausing for pen swaps.

Files are named for what made them:

```
portrait-crosshatch-a5-cmyk-20260809-143211.svg
```

Source, algorithm, paper, colour mode, timestamp — so repeated exports of
different variations never collide or blur together.

The full settings ride along inside the file, as a JSON record in `<metadata>`
plus a plain-language `<title>` and `<desc>`:

```xml
<title>Portrait Study #3 — Cross-hatch on A5</title>
<desc>Cross-hatch · A5 148×210 mm · CMYK · hatch spacing 2 mm, layers 3, angle 45°</desc>
```

Open a plot six months later and it still says exactly what produced it.

## Running locally

```bash
npm install
npm run dev
```

Requires Node 20 or newer. `npm run build` produces a static bundle in `dist/`.

## How it fits together

```
image → tone sampler → algorithm → polylines (mm) → travel optimise → SVG
```

- `src/image/` — loads the image and exposes brightness/RGB samplers in
  normalised coordinates.
- `src/algorithms/` — each technique is a plain module exporting
  `process(tone, params, area)` and returning polylines in millimetres. No DOM,
  no p5 — so they run under Node as-is, which is how they're tested.
- `src/color/separate.js` — RGB to CMYK ink amounts.
- `src/pipeline/generate.js` — assembles layers from the image, algorithm and
  colour mode.
- `src/geometry/` — page layout and travel optimisation.
- `src/export/` — SVG building, filenames, and the embedded settings record.

Adding an algorithm means writing one module and listing it in
`src/algorithms/index.js`; the parameters panel builds itself from the `params`
array the module declares.

## Documentation

- [`BACKLOG.md`](BACKLOG.md) — what's built, what's next, and what was
  deliberately dropped.
- [`DESIGN.md`](DESIGN.md) — the visual system and the rules a UI change should
  follow.
