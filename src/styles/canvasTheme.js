/**
 * The stage is painted in JavaScript, so CSS cannot reach it. These are the
 * canvas-side counterparts of the tokens in `index.css` — keep them in step.
 *
 * The sheet shadow is the one sanctioned exception to the flat direction: a
 * white sheet on a white desk has no other figure/ground signal.
 */
export const canvasTheme = {
  desk: '#ffffff',
  sheet: '#ffffff',

  shadowColor: 'rgba(0, 0, 0, 0.22)',
  shadowBlur: 34,
  shadowOffsetY: 12,

  /** Gap between the sheet and the edge of the stage, in px. */
  pad: 56,

  emptyText: '#4b4b4b',
  /* Canvas 2D can't reach font-variation-settings, and the variable font's
     default instance is Thin — so the weight has to be stated explicitly. */
  emptyFont: "450 14px 'Bakemono', ui-monospace, system-ui, sans-serif",
}
