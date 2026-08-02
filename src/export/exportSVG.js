/**
 * SVG export for pen plotters.
 *
 * The polylines are already in millimetres, so we emit an SVG whose user units
 * equal millimetres: width/height carry the "mm" unit and the viewBox is the
 * raw paper size. Plotter toolchains (axicli, saxi, InkScape) then plot at true
 * physical scale with no rescaling. Y is downward, matching both our geometry
 * and the SVG coordinate system.
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

export function buildSVG(polylines, paper, { strokeWidth = 0.3 } = {}) {
  const d = polylines
    .filter((line) => line.length > 1)
    .map(toSubpath)
    .join(' ')

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${paper.width}mm" height="${paper.height}mm" viewBox="0 0 ${paper.width} ${paper.height}">
  <g fill="none" stroke="black" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">
    <path d="${d}"/>
  </g>
</svg>
`
}

export function downloadSVG(polylines, paper, filename = 'plot.svg') {
  const svg = buildSVG(polylines, paper)
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
