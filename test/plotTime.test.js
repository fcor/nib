import test from 'node:test'
import assert from 'node:assert/strict'
import {
  AXIDRAW_V3_DEFAULT,
  estimateAxiDrawV3,
} from '../src/geometry/plotTime.js'

function layer(polylines) {
  return { pen: {}, polylines }
}

test('estimateAxiDrawV3 reports empty plots as zero', () => {
  assert.deepEqual(estimateAxiDrawV3([]), {
    profile: 'AxiDraw V3 default',
    seconds: 0,
    penDownMm: 0,
    penUpMm: 0,
    penLifts: 0,
    penChanges: 0,
  })
})

test('estimateAxiDrawV3 includes drawing, home travel, and a servo cycle', () => {
  const result = estimateAxiDrawV3([
    layer([[[10, 0], [30, 0]]]),
  ])

  assert.equal(result.penDownMm, 20)
  assert.equal(result.penUpMm, 40)
  assert.equal(result.penLifts, 1)
  assert.equal(result.penChanges, 0)
  assert.ok(result.seconds > 0)
})

test('estimateAxiDrawV3 joins subpaths only within one layer', () => {
  const threshold = AXIDRAW_V3_DEFAULT.pathJoinThresholdMm
  const joined = estimateAxiDrawV3([
    layer([
      [[0, 0], [10, 0]],
      [[10 + threshold / 2, 0], [20, 0]],
    ]),
  ])
  const separateLayers = estimateAxiDrawV3([
    layer([[[0, 0], [10, 0]]]),
    layer([[[10 + threshold / 2, 0], [20, 0]]]),
  ])

  assert.equal(joined.penLifts, 1)
  assert.equal(separateLayers.penLifts, 2)
  assert.equal(separateLayers.penChanges, 1)
  assert.ok(separateLayers.seconds > joined.seconds)
})

test('estimateAxiDrawV3 accounts for corners within a path', () => {
  const straight = estimateAxiDrawV3([
    layer([[[0, 0], [10, 0], [20, 0]]]),
  ])
  const cornered = estimateAxiDrawV3([
    layer([[[0, 0], [10, 0], [10, 10], [20, 0]]]),
  ])

  assert.ok(cornered.seconds > straight.seconds)
})

test('estimateAxiDrawV3 applies the default portrait auto-rotation', () => {
  const result = estimateAxiDrawV3(
    [layer([[[10, 0], [30, 0]]])],
    { width: 148, height: 210 },
  )

  // Counterclockwise rotation maps the endpoints to (0, 138) and (0, 118).
  assert.equal(result.penUpMm, 256)
  assert.equal(result.seconds, 2.703)
})
