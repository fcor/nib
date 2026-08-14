const BLACK_REFLECTANCE = 1e-4
const DEGENERATE_DENSITY = 1e-12
const EXACT_COLOR_TOLERANCE = 1e-12
const SOLVER_TOLERANCE = 1e-7
const MAX_SOLVER_PASSES = 24

function clamp01(value) {
  return Math.min(1, Math.max(0, value))
}

/**
 * Parse a CSS hex colour or RGB triplet into normalized sRGB components.
 *
 * Numeric triplets whose components are all in 0..1 are treated as normalized
 * RGB. Other finite numeric triplets use the conventional 0..255 range.
 * Invalid values return null.
 */
export function parseRgbColor(color) {
  if (typeof color === 'string') {
    const match = color.trim().match(/^#([\da-f]{3}|[\da-f]{6})$/i)
    if (!match) return null

    const hex = match[1].length === 3
      ? [...match[1]].map((digit) => digit + digit).join('')
      : match[1]

    return [
      Number.parseInt(hex.slice(0, 2), 16) / 255,
      Number.parseInt(hex.slice(2, 4), 16) / 255,
      Number.parseInt(hex.slice(4, 6), 16) / 255,
    ]
  }

  if (
    (!Array.isArray(color) && !ArrayBuffer.isView(color)) ||
    color.length < 3
  ) {
    return null
  }

  const rgb = [Number(color[0]), Number(color[1]), Number(color[2])]
  if (!rgb.every(Number.isFinite)) return null

  const scale = rgb.every((component) => component >= 0 && component <= 1)
    ? 1
    : 255

  return rgb.map((component) => clamp01(component / scale))
}

function srgbToLinear(component) {
  return component <= 0.04045
    ? component / 12.92
    : ((component + 0.055) / 1.055) ** 2.4
}

function opticalDensity(rgb) {
  return rgb.map((component) => (
    -Math.log(Math.max(BLACK_REFLECTANCE, srgbToLinear(component)))
  ))
}

function sameColor(a, b) {
  return a.every(
    (component, index) =>
      Math.abs(component - b[index]) <= EXACT_COLOR_TOLERANCE,
  )
}

/**
 * Precompute an N-ink separator for repeated per-pixel sampling.
 *
 * The model treats each ink colour as its full-coverage reflectance over white.
 * Beer-Lambert optical densities add under overprint, so separation becomes a
 * small box-constrained least-squares problem with one 0..1 variable per ink.
 */
export function createSpotSeparator(inks) {
  const sourceInks = Array.isArray(inks) ? inks : []
  const inkColors = sourceInks.map(parseRgbColor)
  const columns = []

  for (let index = 0; index < inkColors.length; index += 1) {
    const color = inkColors[index]
    if (!color) continue

    const density = opticalDensity(color)
    const squaredLength = density.reduce(
      (sum, component) => sum + component * component,
      0,
    )
    if (squaredLength <= DEGENERATE_DENSITY) continue

    columns.push({ index, color, density, squaredLength })
  }

  return function separate(source) {
    const coverages = new Array(sourceInks.length).fill(0)
    const sourceColor = parseRgbColor(source)
    if (!sourceColor || columns.length === 0) return coverages

    const target = opticalDensity(sourceColor)
    if (target.every((component) => component <= DEGENERATE_DENSITY)) {
      return coverages
    }

    // Prefer one direct plate over an equivalent multi-ink approximation.
    const exact = columns.find(({ color }) => sameColor(color, sourceColor))
    if (exact) {
      coverages[exact.index] = 1
      return coverages
    }

    const prediction = [0, 0, 0]

    for (let pass = 0; pass < MAX_SOLVER_PASSES; pass += 1) {
      let largestChange = 0

      for (const { index, density, squaredLength } of columns) {
        const previous = coverages[index]
        let numerator = 0

        for (let channel = 0; channel < 3; channel += 1) {
          const predictionWithoutInk =
            prediction[channel] - density[channel] * previous
          numerator +=
            density[channel] * (target[channel] - predictionWithoutInk)
        }

        const next = clamp01(numerator / squaredLength)
        const change = next - previous
        if (change === 0) continue

        coverages[index] = next
        largestChange = Math.max(largestChange, Math.abs(change))
        for (let channel = 0; channel < 3; channel += 1) {
          prediction[channel] += density[channel] * change
        }
      }

      if (largestChange <= SOLVER_TOLERANCE) break
    }

    return coverages.map((coverage) => (
      Number.isFinite(coverage) ? clamp01(coverage) : 0
    ))
  }
}

/**
 * Separate one source colour. Use createSpotSeparator when processing pixels.
 */
export function separateSpotColor(source, inks) {
  return createSpotSeparator(inks)(source)
}
