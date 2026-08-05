/**
 * Spiral Halftone
 *
 * A single continuous Archimedean spiral winds out from the center; its radius
 * gains a sinusoidal in/out wiggle whose amplitude tracks tone, so dark regions
 * lay down extra ink between rings. One long path, no pen-ups. The spiral fills
 * the largest circle that fits the draw area (image is center-cropped).
 *
 * `process` receives a `tone(nx, ny) -> [0,1]` sampler. `params._offset` (0..1)
 * rotates the whole spiral so color layers interleave.
 */
export const spiral = {
  id: 'spiral',
  name: 'Spiral Halftone',
  description: 'One spiral from center; radial wiggle maps to darkness.',
  params: [
    { key: 'ringSpacing', label: 'Ring spacing', type: 'range', min: 1, max: 20, step: 1, default: 4, unit: 'mm' },
    { key: 'amplitude', label: 'Wiggle amp', type: 'range', min: 0, max: 100, step: 5, default: 70, unit: '%' },
    { key: 'frequency', label: 'Frequency', type: 'range', min: 1, max: 200, step: 1, default: 60 },
    { key: 'whitePoint', label: 'White point', type: 'range', min: 50, max: 100, step: 5, default: 100, unit: '%' },
    { key: 'invert', label: 'Invert', type: 'toggle', default: false },
  ],

  process(tone, params, area) {
    const { ringSpacing, amplitude, frequency } = params
    const pitch = Math.max(0.5, ringSpacing)
    const maxAmp = (amplitude / 100) * (pitch / 2) * 0.95
    const freq = Math.max(1, frequency)
    const rot = (params._offset ?? 0) * Math.PI * 2

    const cx = area.x + area.w / 2
    const cy = area.y + area.h / 2
    const R = Math.min(area.w, area.h) / 2

    const TWO_PI = Math.PI * 2
    const thetaMax = TWO_PI * (R / pitch)
    const stepsPerRev = Math.max(160, Math.round(freq * 8))
    const dTheta = TWO_PI / stepsPerRev

    const line = []
    for (let theta = 0; theta <= thetaMax; theta += dTheta) {
      const rBase = pitch * (theta / TWO_PI)
      const ang = theta + rot
      const cos = Math.cos(ang)
      const sin = Math.sin(ang)

      const bx = cx + rBase * cos
      const by = cy + rBase * sin
      const rampIn = Math.min(1, theta / TWO_PI)
      const amp = tone((bx - area.x) / area.w, (by - area.y) / area.h) * maxAmp * rampIn
      const r = rBase + Math.sin(theta * freq) * amp

      line.push([cx + r * cos, cy + r * sin])
    }
    return [line]
  },
}
