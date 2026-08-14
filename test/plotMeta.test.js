import test from 'node:test'
import assert from 'node:assert/strict'
import { plotFilename, plotSettings, plotSummary } from '../src/export/plotMeta.js'
import { buildSVG } from '../src/export/exportSVG.js'

const paperSize = {
  value: 'a5',
  name: 'A5',
  width: 148,
  height: 210,
}

test('Riso settings preserve palette and editable ink state', () => {
  const settings = plotSettings({
    sourceName: 'portrait.jpg',
    algorithmId: 'dots',
    params: { spacing: 5, invert: true },
    paperSize,
    colorMode: 'riso',
    useK: true,
    risoPaletteId: 'custom',
    risoPens: [
      {
        id: 'spot-1',
        name: 'Ink 1',
        color: '#123456',
        visible: true,
      },
      {
        id: 'spot-2',
        name: 'Ink 2',
        color: '#ABCDEF',
        visible: false,
      },
    ],
  })

  assert.deepEqual(settings.color, {
    mode: 'riso',
    palette: 'custom',
    inks: [
      {
        id: 'spot-1',
        name: 'Ink 1',
        color: '#123456',
        visible: true,
      },
      {
        id: 'spot-2',
        name: 'Ink 2',
        color: '#ABCDEF',
        visible: false,
      },
    ],
  })
  const summary = plotSummary(settings)
  assert.match(summary, /Riso \(Ink 1 \+ Ink 2\)/)
  assert.doesNotMatch(summary, /invert/)
  assert.match(
    plotFilename({ ...settings, exported: '2026-08-14T10:20:30.000Z' }),
    /^portrait-dots-a5-riso-\d{8}-\d{6}\.svg$/,
  )
})

test('Riso SVG export names each physical ink layer', () => {
  const svg = buildSVG(
    [
      {
        pen: { name: 'Blue', color: '#0078BF', width: 0.4 },
        polylines: [[[1, 2], [3, 4]]],
      },
      {
        pen: { name: 'Fluorescent Pink', color: '#FF48B0', width: 0.4 },
        polylines: [[[5, 6], [7, 8]]],
      },
    ],
    paperSize,
  )

  assert.match(svg, /inkscape:label="1 Blue"/)
  assert.match(svg, /inkscape:label="2 Fluorescent Pink"/)
})
