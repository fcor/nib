/**
 * SVG export for pen plotters.
 *
 * Polylines are already in millimetres, so the SVG's user units equal mm
 * (width/height carry "mm", viewBox is the raw paper size) and it plots at true
 * physical scale. Each pen becomes its own Inkscape-labelled layer group with
 * that pen's real stroke color and nib width — the format AxiDraw "layers" mode
 * plots pass-by-pass, pausing for pen swaps.
 *
 * The settings that produced the plot ride along in <metadata>, with a plain
 * <title>/<desc> summary for anything that shows document properties.
 */

import {
  SETTINGS_NS,
  SETTINGS_VERSION,
  plotFilename,
  plotSummary,
  plotTitle,
} from './plotMeta.js'

// Compact number: up to 3 decimals, trailing zeros stripped.
function fmt(n) {
  return Number(n.toFixed(3)).toString()
}

// Text content only needs the markup delimiters escaped; quotes are literal.
function escText(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function escAttr(s) {
  return escText(s).replace(/"/g, '&quot;')
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
  const label = escAttr(`${index + 1} ${layer.pen.name}`)
  return `  <g inkscape:groupmode="layer" inkscape:label="${label}" fill="none" stroke="${layer.pen.color}" stroke-width="${layer.pen.width}" stroke-linecap="round" stroke-linejoin="round">
    <path d="${d}"/>
  </g>`
}

/**
 * Records the pens that actually made it into the file, not the ones that were
 * configured — hidden layers are already gone by here, and so are any that
 * generated no strokes.
 */
function metadataBlock(settings, drawn) {
  const full = {
    ...settings,
    pens: drawn.map((l) => ({
      name: l.pen.name,
      color: l.pen.color,
      width: l.pen.width,
    })),
  }
  return `  <title>${escText(plotTitle(settings))}</title>
  <desc>${escText(plotSummary(settings))}</desc>
  <metadata>
    <plot:settings version="${SETTINGS_VERSION}">${escText(JSON.stringify(full, null, 2))}</plot:settings>
  </metadata>`
}

export function buildSVG(layers, paper, settings) {
  const drawn = layers.filter((l) => l.polylines.some((line) => line.length > 1))
  const groups = drawn.map(layerGroup).join('\n')
  const meta = settings ? metadataBlock(settings, drawn) + '\n' : ''

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" xmlns:plot="${SETTINGS_NS}" width="${paper.width}mm" height="${paper.height}mm" viewBox="0 0 ${paper.width} ${paper.height}">
${meta}${groups}
</svg>
`
}

export function downloadSVG(layers, paper, settings) {
  // One timestamp for both the metadata and the filename, so a file and its
  // record always agree on when it was made.
  const stamped = { ...settings, exported: new Date().toISOString() }
  const filename = plotFilename(stamped)
  const svg = buildSVG(layers, paper, stamped)
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
