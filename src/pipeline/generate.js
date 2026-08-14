import { toneFromBrightness } from '../image/tone.js'
import { rgbToCMYK } from '../color/separate.js'
import { createSpotSeparator } from '../color/spotSeparation.js'

/**
 * Produce plot layers from the current inputs.
 *
 * A layer is { pen, polylines, preserveOrder }. Mono mode returns one layer
 * (brightness → tone) drawn with the active pen. Separated modes return one
 * layer per ink: each runs the same algorithm, but its tone comes from that
 * ink's coverage. `_offset` interleaves compatible algorithms, `_channel` keeps
 * CMYK screen conventions, and generic layer indices support arbitrary inks.
 */
export function generateLayers({ image, algorithm, params, area, color }) {
  if (!image || !area || !algorithm.process) return []

  if (color.mode === 'mono') {
    if (!color.activePen.visible) return []
    const tone = (nx, ny) =>
      toneFromBrightness(image.sample(nx, ny), params.whitePoint, params.invert)
    return [{
      pen: color.activePen,
      polylines: algorithm.process(tone, params, area),
      preserveOrder: algorithm.preserveOrder === true,
    }]
  }

  if (color.mode === 'riso') {
    const pens = Array.isArray(color.spotPens) ? color.spotPens : []
    const separate = createSpotSeparator(pens.map((pen) => pen.color))
    const layers = []

    pens.forEach((pen, index) => {
      if (!pen?.visible) return
      const tone = (nx, ny) => {
        const coverage = separate(image.sampleRGB(nx, ny))[index] || 0
        return toneFromBrightness(1 - coverage, params.whitePoint, false)
      }
      layers.push({
        pen,
        polylines: algorithm.process(
          tone,
          {
            ...params,
            _offset: index / pens.length,
            _layerIndex: index,
            _layerCount: pens.length,
          },
          area,
        ),
        preserveOrder: algorithm.preserveOrder === true,
      })
    })

    return layers
  }

  if (color.mode !== 'cmyk') return []

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
    const layerParams = {
      ...params,
      _offset: i / channels.length,
      _channel: ch,
      _layerIndex: i,
      _layerCount: channels.length,
    }
    layers.push({
      pen,
      polylines: algorithm.process(tone, layerParams, area),
      preserveOrder: algorithm.preserveOrder === true,
    })
  })
  return layers
}
