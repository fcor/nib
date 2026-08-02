/**
 * Map a sampled brightness [0,1] to a wiggle "tone" [0,1] where 0 = flat line
 * and 1 = full amplitude.
 *
 * Non-inverted: pixels brighter than the white point go flat; everything darker
 * is remapped across the full range (raising contrast). Inverted mirrors this
 * around a symmetric black point, so dark areas go flat instead.
 */
export function toneFromBrightness(brightness, whitePoint, invert) {
  const wp = whitePoint / 100
  let tone
  if (invert) {
    const bp = 1 - wp
    tone = bp < 1 ? (brightness - bp) / (1 - bp) : 0
  } else {
    tone = wp > 0 ? (wp - brightness) / wp : 0
  }
  return tone < 0 ? 0 : tone > 1 ? 1 : tone
}
