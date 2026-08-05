# Design — Wired Editorial Light

How this app is styled, and the rules a change should follow. Companion to
`BACKLOG.md`: that file is *what* to build, this one is *what it should look
like*.

**Direction:** Wired Editorial Light — stark black-and-white hierarchy, flat,
hairline rules instead of shadows, mono caps carrying the labels. The app reads
as an instrument, not a canvas app: precise, technical, print-inspired.

**Two sanctioned departures from the source system**, both deliberate:

1. The sheet keeps its drop shadow (§6). The system says flat; the shadow is the
   only thing separating a white sheet from a white desk, so it stays.
2. Control borders are black hairlines, not `#E5E7EB` (§2). The supplied border
   token fails contrast for interactive elements.

---

## 1. Surface

**One surface: white.** The previous two-surface model (light stage, dark rail)
is gone — the direction is light-only and supplies no dark tokens, so a dark
rail would mean inventing colors it doesn't sanction.

| Region     | Treatment                                                        |
| ---------- | ---------------------------------------------------------------- |
| `.app__stage` | White. The desk. Sheet sits on it under a shadow.             |
| `.app__panels` | White. Separated by a single `--rule` vertical line, not a fill or a shade. |

Separation comes from rules, spacing, and typographic weight — never from a
change in background. If two regions need distinguishing, add a hairline.

The pen colors are now the only chromatic thing on screen. That's the point:
the artwork leads because everything else is black, white, and gray.

> Optional, not adopted: a very light gray well (`#F5F5F5`) behind the sheet for
> extra separation. Measures 1.09:1 against the sheet — decorative only, the
> shadow is doing the actual work. Available if the stage ever feels too flat.

---

## 2. Color

```css
--ink:        #000000;  /* headlines, labels, borders, most interactive text */
--ink-muted:  #4B4B4B;  /* supporting text, softer hierarchy */
--accent:     #0066CC;  /* links and emphasis — used sparingly */
--surface:    #FFFFFF;  /* page, rail, sheet, cards */
--rule:       #E5E7EB;  /* structural dividers only — see below */
--error:      #D92D20;  /* destructive/validation; should stay rare */
```

All verified against AA:

| Pair                            | Ratio   |         |
| ------------------------------- | ------- | ------- |
| `--ink` on `--surface`          | 21.00:1 | PASS    |
| `--ink-muted` on `--surface`    | 8.72:1  | PASS    |
| `--accent` on `--surface`       | 5.57:1  | PASS    |
| white on `--ink` (primary btn)  | 21.00:1 | PASS    |
| white on `--ink-muted` (hover)  | 8.72:1  | PASS    |
| `--error` on `--surface`        | 4.83:1  | PASS    |
| **`--rule` on `--surface`**     | **1.24:1** | **FAIL** (3:1 bar) |

**The border rule.** `#E5E7EB` is far below the 3:1 floor for UI components, so
it cannot outline anything a user has to find and operate. Split the job:

- `--rule` (`#E5E7EB`) — structural dividers between regions and panels.
  Decorative separation, nothing depends on seeing it.
- `--ink` (`#000000`) at 1px — every **interactive** outline: inputs, selects,
  the segmented control, secondary buttons, the dropzone.

This isn't a compromise. The system's own prose specifies `button-secondary` as
"white surface with black border and text" — black control outlines are the
more on-brand answer anyway.

**Pen colors are not design tokens.** `src/pens/pens.js` holds real ink colors
modelling physical pens. The direction does not restyle them, and the inline
style in `ColorPanel.jsx` that reads color from data is correct — leave it.

---

## 3. Type

Two voices, mirroring the source system's Breve Text / WIRED Mono split, but
drawn from one superfamily so they share a skeleton and sit together cleanly.
Collapsing to a single voice would flatten the hierarchy — the mono caps only
read as machine labels because they contrast with something.

Both voices come from **one variable font**. `Bakemono-Variable.ttf` carries two
axes — `wght` 100–800 and a custom **`mono` 0–1000** axis that morphs the
proportional Text design (`mono: 0`) through Stereo (`500`) to true monospace
(`1000`). All 21 named instances live in that single 353KB file.

So there is no `--font-mono` / `--font-text` family pair. There is one family and
an axis token:

```css
--font: 'Bakemono', ui-monospace, system-ui, sans-serif;

--axis-text: 'mono' 0;      /* proportional — reading voice */
--axis-mono: 'mono' 1000;   /* monospaced — label + number voice */
```

Applied as `font-variation-settings: var(--axis-mono)`. Set the axis at the use
site, not in `@font-face` — the `font-variation-settings` descriptor has patchy
support for custom axes, while the property does not.

| Axis                  | Carries                                                  |
| --------------------- | -------------------------------------------------------- |
| `--axis-mono`         | Panel titles, step chip, buttons, and **every number** — readouts, slider values, dimensions. |
| `--axis-text`         | Control labels, algorithm description, dropzone hint, export note. |

Numbers always go mono. The readout and slider values are measurements on a
machine tool; tabular figures that don't reflow mid-drag are functional, not
stylistic. Keep `font-variant-numeric: tabular-nums` on anything live.

**Stereo (`mono: 500`) is unused.** It's the family's middle setting; this app
has one headline-length string, which doesn't justify a third voice. It costs
nothing to leave available — it's the same file.

⚠️ **The weight axis is not the CSS scale.** The named instances sit at
Regular **450**, Medium 560, Bold **670**, Extrabold 800 — not 400/600/700.
Writing `font-weight: 700` lands between Bold and Extrabold. Use `450` for
regular and `670` for bold to hit the drawn weights.

### Scale

The source system's headline ramp (64/45/32/23px) is article furniture — this
app's largest text is a brand mark. Four styles are actually in play:

| Token          | Size / weight / axis                    | Used by                    |
| -------------- | --------------------------------------- | -------------------------- |
| `--type-brand` | 20px, wght 670, mono, caps, 0.08em      | `.app__brand`              |
| `--type-label` | 12px, wght 670, mono, caps, 0.1em       | `.panel__title`            |
| `--type-chip`  | 10px, wght 670, mono, caps, 0.12em      | `.panel__step`             |
| `--type-body`  | 14px/1.43, wght 450, text, 0.1px        | control labels, hint       |
| `--type-meta`  | 12px/1.33, wght 450, text, 0.1px        | notes, source meta, desc   |
| `--type-num`   | 13px/1.4, wght 450, mono, tabular       | readouts, slider values    |

### Font loading

One file, one request: `src/styles/fonts/Bakemono-Variable.ttf` (353KB). The 21
static TTFs have been deleted — they totalled 2.4MB and the variable font
reproduces every one of them.

```css
@font-face {
  font-family: 'Bakemono';
  src: url('./fonts/Bakemono-Variable.ttf') format('truetype');
  font-weight: 100 800;
  font-display: swap;
}
```

Converting to woff2 should roughly halve it and is worth doing before ship.

### The measurements that shape the layout

Read from `hmtx`/`cmap`, not estimated. Control label column is `5.5rem` = 88px:

| Label            | Text (`mono: 0`) @14px | Mono (`mono: 1000`) @14px |
| ---------------- | ---------------------- | ------------------------- |
| Hatch spacing    | **90px**               | 109px                     |
| Parallel lines   | 82px                   | 118px                     |
| Shade levels     | 78px                   | 101px                     |
| Line spacing     | 79px                   | 101px                     |
| White point      | 75px                   | 92px                      |

**This is why control labels sit at `mono: 0`.** In monospace, five of seven
labels overflow — that voice would force the slider to stack its label above the
track. The proportional axis keeps the existing one-row layout.

**One required change:** "Hatch spacing" is 90px against an 88px column. Widen
`.control--slider`'s first column from `5.5rem` to `6rem` (96px) and every label
clears. This is the only layout adjustment the direction demands.

Safe as measured: readout labels max 94px in mono @13px against a 104px column;
panel titles max 84px ("PARAMETERS", mono @12px with 0.1em) in a ~256px row.

---

## 4. Spacing, radius, motion

```css
--space-hair: 2px;   /* the direction's `xs`, renamed so the ramp stays monotonic */
--space-2xs:  4px;   /* added */
--space-xs:   8px;   /* added */
--space-sm:  12px;
--space-md:  16px;
--space-lg:  24px;
--space-xl:  48px;

--radius-none: 0px;
--radius-sm:   4px;   /* buttons, inputs, swatches */
--radius-md:   8px;   /* panels */
--radius-full: 9999px;/* step chip, toggle track */

--dur: 120ms;
--ease: cubic-bezier(0.2, 0, 0.2, 1);
```

The direction's ramp jumps 2 → 12 with nothing between; 4 and 8 are added
because the tighter rows need somewhere to land. Most of the app already sits
near this scale: rail padding 16, rail gap 12, panel padding 16, panel body gap
12.

**Shapes stay rectilinear.** 4px and 8px only; full rounding is reserved for the
step chip and the toggle track. Nothing else rounds.

**Motion is state feedback only** — no entrances, no decoration. Wrap it:

```css
@media (prefers-reduced-motion: reduce) {
  * { transition-duration: 0.01ms !important; animation: none !important; }
}
```

---

## 5. Elevation

Flat. Hierarchy comes from contrast, hairlines, and type — no shadows,
no gradients, no glassmorphism.

**One exception, sanctioned:** the paper sheet keeps its existing shadow
(`rgba(0,0,0,0.22)`, blur 34, offsetY 12). A white sheet on a white desk has no
other figure/ground signal, and the physical-paper metaphor is the whole point
of the stage. It stays exactly as it is.

No other element in the app gets a shadow.

---

## 6. Canvas constants

`P5Canvas.jsx` paints the desk, the sheet, its shadow, and the empty state in
JavaScript — CSS cannot reach any of it. Mirror the values rather than
hand-copying them:

| Thing            | Value                                    |
| ---------------- | ---------------------------------------- |
| Desk background  | `#FFFFFF`                                |
| Sheet fill       | `#FFFFFF`                                |
| Sheet shadow     | `rgba(0,0,0,0.22)`, blur 34, offsetY 12  |
| Sheet padding    | `PAD = 56`                               |
| Empty-state text | `--ink-muted`, 14px, Bakemono (`mono: 0`) |

Export from `src/styles/canvasTheme.js` and import into the sketch, so changing
the stage is one edit. The empty state currently uses p5's default font at
`fill(150)` — that's below `--ink-muted` and off-system; move it to `#4B4B4B`.

Note the canvas can't reach `font-variation-settings`: `ctx.font` will render
the variable font's default instance, which is **Thin (wght 100)**, not Regular.
Set an explicit weight in `ctx.font` (`450 14px Bakemono`) or the empty-state
text will come out hairline.

Two backlog items land here — *change the canvas background colour* and *zoom
into the artwork*. Both get easier once these are named.

---

## 7. Components

Keyed to the BEM classes that already exist.

**Panel** (`.panel`) — the system's `card`. White, 1px `--rule`, `--radius-md`,
`--space-md` padding. No shadow. Panels are separated from each other by their
borders and `--space-sm`.

**Panel title** (`.panel__title`) — `--type-label`. Uppercase mono caps are the
single most brand-carrying element here; the class is already uppercase and
tracked, so this is close to a drop-in.

**Step badge** (`.panel__step`) — the system's `chip`. Black fill, white text,
`--type-chip`, `--radius-full`, `4px 10px`. It carries the 1→5 workflow, so it
stays prominent enough to scan down the column.

**Button** (`.btn`, `.btn--primary`) — height 40px, padding `8px 16px`,
`--radius-sm`, mono. Primary: black fill, white text. Secondary: white fill,
**1px black border**, black text. Hover shifts to `--ink-muted` — understated,
never a new hue. Disabled: `opacity: 0.5`, no hover.

**Select** (`.control--select`) — the system's `input`. White, 1px black,
`--radius-sm`, 40px height, `8px 12px`. The current `background: var(--bg)`
must go; on a white surface it reads as a hole.

**SegmentedControl** (`.segmented`) — white with a black outline, 1px black
dividers, active segment black-filled with white text.

Selection uses a **knockout sliding indicator**: two identical label rows are
stacked, the lower in ink on the surface and the upper inverted and clipped to
a black pill (`.segmented__fill`). The pill slides to the active index while
the inverted row slides back by the same distance, so labels flip colour
exactly as the pill crosses them rather than switching all at once.

Segments are equal width, which is what lets both offsets be percentages of
`--seg-count` — nothing is measured at runtime. The two `left` transitions must
stay identical or the labels shear mid-slide. The component passes
`--seg-index` / `--seg-count` as inline custom properties; that's layout data,
the same exemption the pen swatch gets.

Reach for this on any small set of mutually exclusive options. It scales to
*n* segments without change.

**Slider** (`.control--slider`) — three columns: proportional label / track /
mono tabular value. Fixed-width value column so the track never jumps mid-drag.
Track and thumb in black; square thumb, `--radius-none` or `--radius-sm`.

**Toggle** (`.control--toggle`) — black when on, `--rule` fill when off, white
knob, `--radius-full`.
⚠️ `.control--toggle input { display: none }` removes every toggle from the
keyboard tab order. Replace with a visually-hidden pattern (`position:absolute;
opacity:0; width:1px; height:1px`) and focus the track via
`input:focus-visible + .control__switch`. This is a bug, not a preference.

**Dropzone** (`.dropzone`) — 1px dashed black, `--radius-sm`. Drag-over swaps to
`--accent` with a pale accent wash.
⚠️ It's a bare `<div>` with `onClick` — give it `role="button"` and
`tabIndex={0}` so it's reachable.

**Readout** (`.readout`) — over the canvas, bottom-left. Mono tabular
(`--type-num`), labels in `--ink-muted`, values in `--ink`. Label column fixed
at `6.5rem`; "Line to draw" at 13px mono is ~94px, so it fits.

---

## 8. Interaction states

There are currently **no** `:hover`, `:focus-visible`, or `:active` styles
anywhere. Every interactive element gets all three:

| State            | Treatment                                                   |
| ---------------- | ----------------------------------------------------------- |
| `:hover`         | Border or fill shifts toward `--ink-muted`. No new hues.     |
| `:focus-visible` | `outline: 2px solid var(--accent); outline-offset: 2px`. Never removed. |
| `:active`        | Flat, no transition delay.                                   |
| `:disabled`      | `opacity: 0.5`, no hover response.                            |

Use `:focus-visible`, not `:focus` — mouse users shouldn't see rings on click.

Baseline: AA contrast (4.5:1 text, 3:1 UI borders and large text), every control
keyboard-reachable in visual order, no state signalled by color alone.

---

## 9. Layout stance

Desktop-only, deliberately. `grid-template-columns: 1fr 320px`, `height: 100vh`,
no breakpoints. This is a tool used next to a plotter on a desk.

The rail is a fixed 320px, scrolls independently, and is divided from the stage
by a 1px `--rule` — no background change. Panels stack in workflow order
(Source → Algorithm → Parameters → Color → Export) and that order is meaningful;
don't reorder for visual balance.

---

## 10. Adoption order

1. `@font-face` for `Bakemono-Variable.ttf`; add `--font` and the two axis tokens.
2. Replace the token block in `index.css` with §2–§4. Remove the dark-theme
   variables (`--bg`, `--panel`, `--text`, `--text-dim`).
3. Convert `App.css` to the new tokens. **Delete** the `.stage__view .segmented*`
   override block and the rail's dark background.
4. Retype: mono caps on panel titles and the chip, proportional on control
   labels, mono tabular on all numbers. Widen the slider label column to `6rem`.
5. Black hairlines on every interactive outline; `--rule` on structural dividers.
6. Extract `canvasTheme.js`; point `P5Canvas.jsx` at it; fix the empty-state color.
7. Add interaction states (§8), fix the toggle tab-order bug and the dropzone role.

Steps 7's fixes are real accessibility bugs — worth doing regardless of how the
visual direction evolves.

---

## 11. Open

- **TTF → woff2** conversion before ship (~353KB → ~180KB).
- **`--error`** has no home yet — the app has no error states. It arrives with
  validation or a failed export.
- **Paper color** (backlog) would break the white-on-white assumption the sheet
  shadow currently solves. Revisit §5 when it lands.
