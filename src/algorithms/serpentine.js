import { toneFromBrightness } from '../image/tone.js'

/**
 * Serpentine Wiggle
 *
 * A single continuous line sweeps left↔right in rows down the page. In darker
 * regions of the source image the line gains amplitude, so the extra ink laid
 * down reads as tone. Very pen-plotter friendly: one long path, no pen-ups.
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

  /**
   * @param image  prepared image with sample(nx, ny) -> brightness [0,1]
   * @param params current parameter values
   * @param area   draw rectangle in mm { x, y, w, h }
   * @returns polylines: array of one polyline (array of [x, y] in mm)
   */
  process(image, params, area) {
    const { lineSpacing, amplitude, frequency, whitePoint, invert } = params
    const spacing = Math.max(0.5, lineSpacing)
    const rows = Math.max(1, Math.floor(area.h / spacing))
    // Amplitude is a fraction of the half-row space, so rows can never collide
    // regardless of line spacing. 0.95 leaves a hair of gap between crests.
    const maxAmp = (amplitude / 100) * (spacing / 2) * 0.95
    // Enough samples to resolve each wave crest smoothly (~6 per wave).
    const samplesPerRow = Math.max(80, Math.round(frequency * 6))

    const line = []
    for (let r = 0; r < rows; r++) {
      const rowY = area.y + spacing * (r + 0.5)
      const leftToRight = r % 2 === 0
      for (let s = 0; s <= samplesPerRow; s++) {
        const t = s / samplesPerRow
        const along = leftToRight ? t : 1 - t
        const worldX = area.x + along * area.w
        const brightness = image.sample(along, (rowY - area.y) / area.h)
        const amp = toneFromBrightness(brightness, whitePoint, invert) * maxAmp
        // Phase tied to spatial position so waves stay aligned row to row.
        const phase = along * frequency * Math.PI * 2
        const py = rowY + Math.sin(phase) * amp
        line.push([worldX, py])
      }
    }
    return [line]
  },
}
