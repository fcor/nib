/**
 * RGB → ink amounts.
 *
 * Standard subtractive separation. Each returned value is 0..1 "how much of
 * this ink is needed here". With useK, a black channel is pulled out of the
 * common floor (GCR) so shadows stay clean instead of muddy C+M+Y stacks.
 */
export function rgbToCMYK(r, g, b, useK = true) {
  if (!useK) {
    return { c: 1 - r, m: 1 - g, y: 1 - b, k: 0 }
  }
  const k = 1 - Math.max(r, g, b)
  if (k >= 1 - 1e-6) {
    return { c: 0, m: 0, y: 0, k: 1 }
  }
  const d = 1 - k
  return {
    c: (1 - r - k) / d,
    m: (1 - g - k) / d,
    y: (1 - b - k) / d,
    k,
  }
}
