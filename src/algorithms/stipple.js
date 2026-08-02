/**
 * Stipple (placeholder)
 *
 * Included now only to prove the plugin pattern — its parameter schema differs
 * from Serpentine, so the Parameters panel must render whatever the selected
 * algorithm declares. Real implementation comes later.
 */
export const stipple = {
  id: 'stipple',
  name: 'Stipple',
  description: 'Dots placed by weighted density; darker = more dots.',
  params: [
    { key: 'dotCount', label: 'Dot count', type: 'range', min: 500, max: 20000, step: 500, default: 5000 },
    { key: 'minGap', label: 'Min gap', type: 'range', min: 0.5, max: 8, step: 0.5, default: 1.5, unit: 'mm' },
    { key: 'invert', label: 'Invert', type: 'toggle', default: false },
  ],
}
