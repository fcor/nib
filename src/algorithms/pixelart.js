const SAMPLES = 3 // n×n tone samples averaged per cell
const MAX_DIRS = 4 // horizontal, vertical, 45°, 135°

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v)

/**
 * Evenly spaced lines across a square, walked as one boustrophedon stroke so
 * the whole pass costs a single pen-down. `phase` (0..1 of a step) slides them.
 */
function zigzag(x0, y0, size, count, phase, vertical) {
  const step = size / count
  const points = []
  for (let i = 0; i < count; i++) {
    const d = step * i + step * phase
    const near = i % 2 === 1 ? size : 0
    const far = i % 2 === 1 ? 0 : size
    if (vertical) points.push([x0 + d, y0 + near], [x0 + d, y0 + far])
    else points.push([x0 + near, y0 + d], [x0 + far, y0 + d])
  }
  return points
}

/**
 * Diagonal lines clipped to the square: `dir` 1 runs ↗ (y = x + b), -1 runs ↘
 * (y = -x + b). Each one is its own stroke — a diagonal can't zigzag back
 * without drawing outside the cell.
 */
function diagonals(x0, y0, size, count, dir) {
  const out = []
  for (let i = 0; i < count; i++) {
    const t = (i + 0.5) / count
    if (dir === 1) {
      const b = -size + 2 * size * t
      out.push(
        b >= 0
          ? [[x0, y0 + b], [x0 + size - b, y0 + size]]
          : [[x0 - b, y0], [x0 + size, y0 + size + b]],
      )
    } else {
      const b = 2 * size * t
      out.push(
        b <= size
          ? [[x0, y0 + b], [x0 + b, y0]]
          : [[x0 + b - size, y0 + size], [x0 + size, y0 + b - size]],
      )
    }
  }
  return out
}

/**
 * Pixel art
 *
 * Quantises the image onto a coarse grid of square cells. Each cell's tone is
 * averaged, snapped to one of `levels` shades, and filled with that many lines —
 * a pen can't lay down a solid square, so darkness is line count.
 *
 * Two fills, same ink budget per cell:
 * - "lines" spends every line on one direction: flat, blocky, one pen-down.
 * - "cross" spreads them over up to four directions (—, |, ╱, ╲), adding a new
 *   angle per shade before thickening any: denser texture, more pen-ups.
 *
 * `params._offset` (0..1) slides the fill within the cell so CMYK plates
 * interleave; the grid itself stays aligned across layers, which is what makes
 * the inks mix per pixel.
 */
export const pixelart = {
  id: 'pixelart',
  name: 'Pixel Art',
  description: 'Coarse square grid; darker cells get more fill lines.',
  params: [
    { key: 'cellSize', label: 'Cell size', type: 'range', min: 2, max: 20, step: 0.5, default: 6, unit: 'mm' },
    { key: 'levels', label: 'Shade levels', type: 'range', min: 1, max: 8, step: 1, default: 4 },
    { key: 'gap', label: 'Cell gap', type: 'range', min: 0, max: 50, step: 5, default: 10, unit: '%' },
    {
      key: 'fill',
      label: 'Cell fill',
      type: 'select',
      default: 'lines',
      options: [
        { value: 'lines', label: 'Parallel lines' },
        { value: 'cross', label: 'Cross-hatch' },
      ],
    },
    { key: 'whitePoint', label: 'White point', type: 'range', min: 50, max: 100, step: 5, default: 100, unit: '%' },
    { key: 'invert', label: 'Invert', type: 'toggle', default: false },
  ],

  process(tone, params, area) {
    const { levels, gap, fill } = params
    const cell = Math.max(1, params.cellSize)
    const cols = Math.max(1, Math.floor(area.w / cell))
    const rows = Math.max(1, Math.floor(area.h / cell))

    // Centre the grid in the draw area so leftover space splits evenly.
    const originX = area.x + (area.w - cols * cell) / 2
    const originY = area.y + (area.h - rows * cell) / 2
    const inset = (cell * Math.min(gap, 50)) / 100 / 2
    const inner = cell - inset * 2
    // Mono centres the fill in the cell; CMYK slides each plate's lines by a
    // fraction of a step. Both keep every line inside the cell.
    const phase = params._offset ?? 0.5

    const lines = []
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cellX = originX + c * cell
        const cellY = originY + r * cell

        let sum = 0
        for (let sy = 0; sy < SAMPLES; sy++) {
          for (let sx = 0; sx < SAMPLES; sx++) {
            const px = cellX + ((sx + 0.5) / SAMPLES) * cell
            const py = cellY + ((sy + 0.5) / SAMPLES) * cell
            sum += tone(
              clamp01((px - area.x) / area.w),
              clamp01((py - area.y) / area.h),
            )
          }
        }

        const level = Math.round((sum / (SAMPLES * SAMPLES)) * levels)
        if (level <= 0) continue

        const x0 = cellX + inset
        const y0 = cellY + inset

        if (fill !== 'cross') {
          lines.push(zigzag(x0, y0, inner, level, phase, false))
          continue
        }

        // Spend the same `level` lines across as many directions as the shade
        // has reached, spreading the remainder so the total ink still matches.
        const dirs = Math.min(level, MAX_DIRS)
        const base = Math.floor(level / dirs)
        const extra = level % dirs
        for (let d = 0; d < dirs; d++) {
          const count = base + (d < extra ? 1 : 0)
          if (count <= 0) continue
          if (d === 0) lines.push(zigzag(x0, y0, inner, count, phase, false))
          else if (d === 1) lines.push(zigzag(x0, y0, inner, count, phase, true))
          else lines.push(...diagonals(x0, y0, inner, count, d === 2 ? 1 : -1))
        }
      }
    }
    return lines
  },
}
