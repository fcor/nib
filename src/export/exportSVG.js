/**
 * SVG export for pen plotters.
 *
 * Polylines are already in millimetres, so the SVG's user units equal mm
 * (width/height carry "mm", viewBox is the raw paper size) and it plots at true
 * physical scale. Each pen becomes its own Inkscape-labelled layer group with
 * that pen's real stroke color and nib width — the format AxiDraw "layers" mode
 * plots pass-by-pass, pausing for pen swaps.
 */

// Compact number: up to 3 decimals, trailing zeros stripped.
function fmt(n) {
  return Number(n.toFixed(3)).toString()
}

function toSubpath(line) {
  let d = ''
  for (let i = 0; i < line.length; i++) {
    d += (i === 0 ? 'M' : 'L') + fmt(line[i][0]) + ' ' + fmt(line[i][1]) + ' '
  }
  return d.trim()
}

function layerGroup(layer, index) {
  const d = layer.polylines
    .filter((line) => line.length > 1)
    .map(toSubpath)
    .join(' ')
  const label = `${index + 1} ${layer.pen.name}`
  return `  <g inkscape:groupmode="layer" inkscape:label="${label}" fill="none" stroke="${layer.pen.color}" stroke-width="${layer.pen.width}" stroke-linecap="round" stroke-linejoin="round">
    <path d="${d}"/>
  </g>`
}

export function buildSVG(layers, paper) {
  const groups = layers
    .filter((l) => l.polylines.some((line) => line.length > 1))
    .map(layerGroup)
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" width="${paper.width}mm" height="${paper.height}mm" viewBox="0 0 ${paper.width} ${paper.height}">
${groups}
</svg>
`
}

export function downloadSVG(layers, paper, filename = 'plot.svg') {
  const svg = buildSVG(layers, paper)
  const blob = new Blob([svg], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
