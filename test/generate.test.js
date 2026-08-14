import test from 'node:test'
import assert from 'node:assert/strict'
import { generateLayers } from '../src/pipeline/generate.js'
import { algorithms, defaultParams } from '../src/algorithms/index.js'

const area = { x: 0, y: 0, w: 10, h: 10 }

function imageWithColor(rgb) {
  return {
    sample: () => 0.5,
    sampleRGB: () => rgb,
  }
}

function recordingAlgorithm(samples) {
  return {
    process(tone, params) {
      samples.push({ tone: tone(0.5, 0.5), params })
      return [[[0, 0], [1, 1]]]
    },
  }
}

test('Riso generates one algorithm layer for each spot ink', () => {
  const samples = []
  const pens = [
    { name: 'Cyan', color: '#00FFFF', width: 0.4, visible: true },
    { name: 'Magenta', color: '#FF00FF', width: 0.4, visible: true },
  ]

  const layers = generateLayers({
    image: imageWithColor([0, 0, 1]),
    algorithm: recordingAlgorithm(samples),
    params: { whitePoint: 100 },
    area,
    color: { mode: 'riso', spotPens: pens },
  })

  assert.deepEqual(layers.map((layer) => layer.pen.name), ['Cyan', 'Magenta'])
  assert.equal(samples.length, 2)
  assert.ok(samples.every((sample) => sample.tone > 0.99))
  assert.deepEqual(
    samples.map(({ params }) => [
      params._offset,
      params._layerIndex,
      params._layerCount,
    ]),
    [
      [0, 0, 2],
      [0.5, 1, 2],
    ],
  )
})

test('hidden Riso inks keep the geometry offset of their plate', () => {
  const samples = []
  const layers = generateLayers({
    image: imageWithColor([1, 0, 1]),
    algorithm: recordingAlgorithm(samples),
    params: { whitePoint: 100 },
    area,
    color: {
      mode: 'riso',
      spotPens: [
        { name: 'Cyan', color: '#00FFFF', width: 0.4, visible: false },
        { name: 'Magenta', color: '#FF00FF', width: 0.4, visible: true },
      ],
    },
  })

  assert.equal(layers.length, 1)
  assert.equal(layers[0].pen.name, 'Magenta')
  assert.equal(samples[0].tone, 1)
  assert.equal(samples[0].params._offset, 0.5)
  assert.equal(samples[0].params._layerIndex, 1)
  assert.equal(samples[0].params._layerCount, 2)
})

test('Riso runs every registered algorithm through both spot plates', () => {
  const pens = [
    { name: 'Cyan', color: '#00FFFF', width: 0.4, visible: true },
    { name: 'Magenta', color: '#FF00FF', width: 0.4, visible: true },
  ]

  for (const algorithm of algorithms) {
    const layers = generateLayers({
      image: imageWithColor([0, 0, 1]),
      algorithm,
      params: defaultParams(algorithm),
      area: { x: 0, y: 0, w: 20, h: 20 },
      color: { mode: 'riso', spotPens: pens },
    })

    assert.equal(layers.length, 2, algorithm.name)
    assert.ok(
      layers.every((layer) =>
        layer.polylines.flat().every(([x, y]) =>
          Number.isFinite(x) && Number.isFinite(y),
        ),
      ),
      algorithm.name,
    )
  }
})
