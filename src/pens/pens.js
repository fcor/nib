/**
 * Ink defaults.
 *
 * Colour is picked freely per layer now, so there's no fixed pen list any
 * more — these are just the values each channel opens with, chosen to
 * approximate process inks.
 *
 * Nib width stays hardcoded: it drives the true-scale preview stroke and the
 * exported `stroke-width`, and choosing it properly means modelling real
 * products. See "Real pen library" in BACKLOG.md.
 */
export const PEN_WIDTH = 0.4 // mm

export const DEFAULT_COLORS = {
  mono: '#1A1A1A',
  c: '#009FE3',
  m: '#E6007E',
  y: '#F2C200',
  k: '#1A1A1A',
}
