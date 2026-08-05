import { toneFromBrightness } from '../image/tone.js'
import { rgbToCMYK } from '../color/separate.js'

/**
 * Produce plot layers from the current inputs.
 *
 * A layer is { pen, polylines }. Mono mode returns one layer (brightness →
 * tone) drawn with the active pen. CMYK mode returns one layer per ink channel:
 * each runs the same algorithm, but its tone comes from that channel's ink
 * amount, and `_offset` interleaves the layers so overlapping colors mix.
 */
export function generateLayers({ image, algorithm, params, area, color }) {
  if (!image || !area || !algorithm.process) return []

  if (color.mode === 'mono') {
    if (!color.activePen.visible) return []
    const tone = (nx, ny) =>
      toneFromBrightness(image.sample(nx, ny), params.whitePoint, params.invert)
    return [{ pen: color.activePen, polylines: algorithm.process(tone, params, area) }]
  }

  // CMYK: one layer per active channel.
  //
  // `useK` and per-layer visibility are different things. `useK` changes the
  // separation itself — with it off, black is redistributed into C/M/Y — so it
  // decides which channels exist. Visibility only decides which of those get
  // drawn, and is applied after `_offset` is fixed so hiding one layer never
  // shifts the others.
  const channels = color.useK ? ['c', 'm', 'y', 'k'] : ['c', 'm', 'y']
  const layers = []
  channels.forEach((ch, i) => {
    const pen = color.channelPens[ch]
    if (!pen || !pen.visible) return
    const tone = (nx, ny) => {
      const [r, g, b] = image.sampleRGB(nx, ny)
      const ink = rgbToCMYK(r, g, b, color.useK)[ch]
      // Reuse the tonal white-point remap by treating ink amount as darkness.
      return toneFromBrightness(1 - ink, params.whitePoint, false)
    }
    const layerParams = { ...params, _offset: i / channels.length }
    layers.push({ pen, polylines: algorithm.process(tone, layerParams, area) })
  })
  return layers
}
