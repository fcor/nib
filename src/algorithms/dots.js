import { spiralDisk } from '../fills/spiralDisk.js'
import { PEN_WIDTH } from '../pens/pens.js'

const SCREEN_ANGLES = {
  c: 15,
  m: 75,
  y: 0,
  k: 45,
}

// Spot colours use the same proven separations before falling back to evenly
// spaced angles. The layer index keeps this independent of any ink naming.
const SPOT_SCREEN_ANGLES = [15, 75, 0, 45]

const SAMPLE_OFFSETS = [-0.28, 0, 0.28]

function clamp01(value) {
  return Math.max(0, Math.min(1, value))
}

function averageCellTone(tone, cx, cy, spacing, angle, area) {
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  let sum = 0
  let count = 0

  for (const oy of SAMPLE_OFFSETS) {
    for (const ox of SAMPLE_OFFSETS) {
      const localX = ox * spacing
      const localY = oy * spacing
      const px = cx + localX * cos - localY * sin
      const py = cy + localX * sin + localY * cos
      if (
        px < area.x ||
        px > area.x + area.w ||
        py < area.y ||
        py > area.y + area.h
      ) {
        continue
      }
      sum += tone((px - area.x) / area.w, (py - area.y) / area.h)
      count++
    }
  }

  return count ? clamp01(sum / count) : 0
}

function screenAngle(params) {
  const base = Number(params.angle) || 0
  let channelOffset = params._channel ? SCREEN_ANGLES[params._channel] ?? 0 : 0
  if (!params._channel && Number.isInteger(params._layerIndex)) {
    channelOffset =
      SPOT_SCREEN_ANGLES[params._layerIndex] ??
      (params._layerIndex * 180) / Math.max(1, params._layerCount)
  }
  return ((base + channelOffset) * Math.PI) / 180
}

export const dots = {
  id: 'dots',
  name: 'Halftone Dots',
  description: 'Spiral-filled dots sized by tone on a physical halftone grid.',
  preserveOrder: true,
  params: [
    { key: 'spacing', label: 'Grid spacing', type: 'range', min: 3, max: 12, step: 0.5, default: 5, unit: 'mm' },
    { key: 'dotScale', label: 'Max dot', type: 'range', min: 20, max: 95, step: 5, default: 80, unit: '%' },
    { key: 'angle', label: 'Grid angle', type: 'range', min: 0, max: 45, step: 5, default: 0, unit: '°' },
    { key: 'whitePoint', label: 'White point', type: 'range', min: 50, max: 100, step: 5, default: 100, unit: '%' },
    { key: 'invert', label: 'Invert', type: 'toggle', default: false },
  ],

  process(tone, params, area) {
    const spacing = Math.max(2, Number(params.spacing) || 5)
    const dotScale = Math.max(0.05, Math.min(0.95, Number(params.dotScale) / 100))
    const maxDiameter = spacing * dotScale
    const angle = screenAngle(params)
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    const centerX = area.x + area.w / 2
    const centerY = area.y + area.h / 2
    const gridRadius = Math.ceil(Math.hypot(area.w, area.h) / (2 * spacing)) + 1
    const paths = []

    // Rows run in alternating directions. Each spiral ends toward the next cell,
    // so the generated order is already efficient and avoids an O(n²) reorder.
    for (let row = -gridRadius; row <= gridRadius; row++) {
      const reverse = (row + gridRadius) % 2 === 1

      for (let step = -gridRadius; step <= gridRadius; step++) {
        const col = reverse ? -step : step
        const localX = col * spacing
        const localY = row * spacing
        const cx = centerX + localX * cos - localY * sin
        const cy = centerY + localX * sin + localY * cos

        if (
          cx < area.x ||
          cx > area.x + area.w ||
          cy < area.y ||
          cy > area.y + area.h
        ) {
          continue
        }

        const sampled = averageCellTone(tone, cx, cy, spacing, angle, area)
        const diameter = maxDiameter * Math.sqrt(sampled)

        // Below this point the physical result is just a nib-sized mark. Skipping
        // faint cells avoids turning highlights into a uniform field of dots.
        if (diameter < PEN_WIDTH) continue

        const radius = diameter / 2
        if (
          cx - radius < area.x ||
          cx + radius > area.x + area.w ||
          cy - radius < area.y ||
          cy + radius > area.y + area.h
        ) {
          continue
        }

        const travelAngle = angle + (reverse ? Math.PI : 0)
        const path = spiralDisk(cx, cy, diameter, PEN_WIDTH, {
          endAngle: travelAngle,
        })
        if (path.length > 1) paths.push(path)
      }
    }

    return paths
  },
}
