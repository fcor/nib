// Crossing angles added per layer (degrees), relative to the base angle.
const LAYER_OFFSETS = [0, 90, 45, 135]
const MARCH_STEP = 0.5 // mm resolution along each hatch line

/**
 * Cross-hatching
 *
 * Darker regions (higher tone) accumulate more layers of parallel hatch lines
 * at crossing angles. Each hatch line is clipped to the runs where the local
 * tone exceeds that layer's threshold, so it breaks into many short strokes —
 * the first algorithm here with real pen-ups.
 *
 * `process` receives a `tone(nx, ny) -> [0,1]` sampler. `params._offset` (0..1)
 * rotates the whole hatch so color layers interleave.
 */
export const crosshatch = {
  id: 'crosshatch',
  name: 'Cross-hatch',
  description: 'Layered angled strokes; darker areas add more layers.',
  params: [
    { key: 'spacing', label: 'Hatch spacing', type: 'range', min: 0.5, max: 8, step: 0.5, default: 2, unit: 'mm' },
    { key: 'levels', label: 'Layers', type: 'range', min: 1, max: 4, step: 1, default: 3 },
    { key: 'angle', label: 'Angle', type: 'range', min: 0, max: 90, step: 5, default: 45, unit: '°' },
    { key: 'whitePoint', label: 'White point', type: 'range', min: 50, max: 100, step: 5, default: 100, unit: '%' },
    { key: 'invert', label: 'Invert', type: 'toggle', default: false },
  ],

  process(tone, params, area) {
    const { spacing, levels, angle } = params
    const hatch = Math.max(0.3, spacing)
    const angleOffset = (params._offset ?? 0) * 90
    const inside = (x, y) =>
      x >= area.x && x <= area.x + area.w && y >= area.y && y <= area.y + area.h

    const lines = []
    for (let layer = 0; layer < levels; layer++) {
      const threshold = (layer + 1) / (levels + 1)
      const a = ((angle + angleOffset + LAYER_OFFSETS[layer]) * Math.PI) / 180
      const dx = Math.cos(a)
      const dy = Math.sin(a)
      const nx = -dy
      const ny = dx

      const corners = [
        [area.x, area.y],
        [area.x + area.w, area.y],
        [area.x, area.y + area.h],
        [area.x + area.w, area.y + area.h],
      ]
      const sVals = corners.map(([x, y]) => x * dx + y * dy)
      const oVals = corners.map(([x, y]) => x * nx + y * ny)
      const sMin = Math.min(...sVals)
      const sMax = Math.max(...sVals)
      const oMin = Math.min(...oVals)
      const oMax = Math.max(...oVals)

      const nSteps = Math.ceil((sMax - sMin) / MARCH_STEP)

      for (let o = oMin; o <= oMax; o += hatch) {
        let runStart = null
        let last = null
        for (let j = 0; j <= nSteps; j++) {
          const s = Math.min(sMin + j * MARCH_STEP, sMax)
          const px = dx * s + nx * o
          const py = dy * s + ny * o

          let on = false
          if (inside(px, py)) {
            on = tone((px - area.x) / area.w, (py - area.y) / area.h) >= threshold
          }

          if (on) {
            if (!runStart) runStart = [px, py]
            last = [px, py]
          } else if (runStart) {
            if (last && last !== runStart) lines.push([runStart, last])
            runStart = null
            last = null
          }
        }
        if (runStart && last && last !== runStart) lines.push([runStart, last])
      }
    }
    return lines
  },
}
