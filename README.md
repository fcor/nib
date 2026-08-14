# Nib

Turn an image into a pen plotter drawing. Drop in a photo, pick an algorithm
that renders its tones as lines, and export an SVG that plots at true physical
size.

**[Try it →](https://fcor.github.io/nib/)**

Everything runs in the browser. No upload, no server. The image never leaves
the machine.

## What it does

Nib reads an image's tone and redraws it as strokes a pen can actually make.
Darkness becomes line density, wiggle amplitude, or fill depending on the
algorithm. The result is a layered SVG ready for AxiDraw,
Inkscape, or any plotter toolchain.

* **Serpentine Wiggle.** A single continuous line, left to right. Wiggle
  amplitude maps to darkness.
* **Spiral Halftone.** One spiral from the centre, with radial wiggle mapping
  tone.
* **Cross hatch.** Layered angled strokes. Darker areas add more layers.
* **Pixel Art.** A coarse square grid with each cell filled by tone.
* **Halftone Dots.** A physical dot screen with each mark filled by one
  continuous spiral sized for the pen width.

## Features

* **Mono, CMYK, or two ink Riso.** Riso separates against curated or custom
  spot inks; every mode runs the selected algorithm once per plate and
  interleaves the layers so overlapping colours mix on paper.
* **Free ink colours.** Pick any colour for each layer. The preview draws at the
  pen's true nib width, so density on screen matches density on paper.
* **Layer visibility.** Inspect a multicolour plot one plate at a time.
  Hidden layers drop out of the preview, the export, and the readouts together.
* **Travel optimised.** Strokes are reordered to cut movement with the pen up.
  It cannot change the artwork, only the order it is drawn in, so it is always on.
* **Live readouts.** Path length, travel with the pen up, and an approximate plot
  time based on the default AxiDraw V3 speed, acceleration, and pen lift
  settings. Manual pen swaps are listed separately.
* **Inspect up close.** Zoom around the pointer, pinch, or drag the sheet to
  inspect individual strokes without changing the exported plot.
* **A3 / A4 / A5.** The artwork fits the sheet inside its margins.

## Spot ink separation

Nib uses Beer Lambert spot colour separation with box constrained least squares
solved by cyclic coordinate descent. For every sampled pixel, it converts the
source colour and each available ink into optical density, where overlapping
inks can be approximated by adding their absorption. It then adjusts one ink
coverage at a time to minimise the difference between the predicted and target
colour, keeping every coverage between zero and one until the values stabilise.
The resulting coverage for each ink becomes a separate tone map that the
selected plotting algorithm turns into paths. The solver accepts any number of
inks, so the same implementation can support three ink Riso and future N colour
separation.

## Export

The SVG uses millimetres as its user unit, so it plots at real size with no
scaling step. Each pen becomes its own layer group labelled for Inkscape,
carrying that pen's colour and nib width. The format lets AxiDraw's "layers"
mode plot each pass separately and pause for pen swaps.

Files are named for what made them:

```
portrait-crosshatch-a5-cmyk-20260809-143211.svg
```

The source, algorithm, paper, colour mode, and timestamp distinguish repeated
exports, so different variations never collide or blur together.

The full settings ride along inside the file, as a JSON record in `<metadata>`
plus a plain language `<title>` and `<desc>` that summarise the algorithm,
paper, colour mode, and parameters.

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

* `src/image/`. Loads the image and exposes brightness/RGB samplers in
  normalised coordinates.
* `src/algorithms/`. Each technique is a plain module exporting
  `process(tone, params, area)` and returning polylines in millimetres. No DOM,
  no p5. They run under Node unchanged, which is how they are tested.
* `src/color/separate.js`. Converts RGB to CMYK ink amounts.
* `src/color/spotSeparation.js`. Provides reusable arbitrary ink separation
  using a bounded optical density solver.
* `src/pipeline/generate.js`. Assembles layers from the image, algorithm, and
  colour mode.
* `src/geometry/`. Handles page layout and travel optimisation.
* `src/export/`. Builds SVG files, filenames, and the embedded settings record.

Adding an algorithm means writing one module and listing it in
`src/algorithms/index.js`; the parameters panel builds itself from the `params`
array the module declares.

## Documentation

* [`BACKLOG.md`](BACKLOG.md). Records what is built, what is next, and what was
  deliberately dropped.
* [`DESIGN.md`](DESIGN.md). Defines the visual system and the rules a UI change
  should follow.
