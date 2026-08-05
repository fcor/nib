/**
 * Serpentine Wiggle
 *
 * A single continuous line sweeps left↔right in rows down the page. Darker
 * regions (higher tone) give the line more amplitude, so the extra ink reads as
 * tone. Very pen-plotter friendly: one long path, no pen-ups.
 *
 * `process` receives a `tone(nx, ny) -> [0,1]` sampler (0 = flat, 1 = full
 * amplitude); the caller decides whether that comes from brightness or an ink
 * channel. `params._offset` (0..1) shifts the rows so color layers interleave.
 */
export const serpentine = {
  id: 'serpentine',
  name: 'Serpentine Wiggle',
  description: 'Single line, L↔R; wiggle amplitude maps to darkness.',
  params: [
    { key: 'lineSpacing', label: 'Line spacing', type: 'range', min: 1, max: 20, step: 1, default: 4, unit: 'mm' },
    { key: 'amplitude', label: 'Wiggle amp', type: 'range', min: 0, max: 100, step: 5, default: 70, unit: '%' },
    { key: 'frequency', label: 'Frequency', type: 'range', min: 1, max: 200, step: 1, default: 60 },
    { key: 'whitePoint', label: 'White point', type: 'range', min: 50, max: 100, step: 5, default: 100, unit: '%' },
    { key: 'invert', label: 'Invert', type: 'toggle', default: false },
  ],

  process(tone, params, area) {
    const { lineSpacing, amplitude, frequency } = params
    const spacing = Math.max(0.5, lineSpacing)
    const rowOffset = (params._offset ?? 0) * spacing
    const rows = Math.max(1, Math.floor(area.h / spacing))
    const maxAmp = (amplitude / 100) * (spacing / 2) * 0.95
    const samplesPerRow = Math.max(80, Math.round(frequency * 6))

    const line = []
    for (let r = 0; r < rows; r++) {
      const rowY = area.y + spacing * (r + 0.5) + rowOffset
      const leftToRight = r % 2 === 0
      for (let s = 0; s <= samplesPerRow; s++) {
        const t = s / samplesPerRow
        const along = leftToRight ? t : 1 - t
        const worldX = area.x + along * area.w
        const amp = tone(along, (rowY - area.y) / area.h) * maxAmp
        const phase = along * frequency * Math.PI * 2
        const py = rowY + Math.sin(phase) * amp
        line.push([worldX, py])
      }
    }
    return [line]
  },
}
