import test from 'node:test'
import assert from 'node:assert/strict'
import { dots } from '../src/algorithms/dots.js'
import { algorithmsById } from '../src/algorithms/index.js'
import { PEN_WIDTH } from '../src/pens/pens.js'

const area = { x: 0, y: 0, w: 20, h: 20 }
const params = {
  spacing: 5,
  dotScale: 80,
  angle: 0,
  whitePoint: 100,
  invert: false,
}

function renderedDiameter(path) {
  const center = path[0]
  return Math.hypot(
    path.at(-1)[0] - center[0],
    path.at(-1)[1] - center[1],
  ) * 2 + PEN_WIDTH
}

function normalizedScreenAngle(path) {
  const center = path[0]
  const end = path.at(-1)
  const angle = Math.atan2(end[1] - center[1], end[0] - center[0])
  return ((angle % Math.PI) + Math.PI) % Math.PI
}

test('Halftone Dots is registered and preserves its generated travel order', () => {
  assert.equal(algorithmsById.dots, dots)
  assert.equal(dots.preserveOrder, true)
})

test('Halftone Dots omits paper-white cells', () => {
  assert.deepEqual(dots.process(() => 0, params, area), [])
})

test('Halftone Dots creates bounded, filled marks on the grid', () => {
  const paths = dots.process(() => 1, params, area)

  assert.equal(paths.length, 9)
  for (const path of paths) {
    assert.ok(path.length > 2)
    assert.ok(Math.abs(renderedDiameter(path) - 4) < 1e-9)
    assert.ok(
      path.every(
        ([x, y]) =>
          x >= area.x &&
          x <= area.x + area.w &&
          y >= area.y &&
          y <= area.y + area.h,
      ),
    )
  }
})

test('Halftone Dots maps tone to dot area', () => {
  const full = dots.process(() => 1, params, area)
  const quarter = dots.process(() => 0.25, params, area)

  assert.equal(quarter.length, full.length)
  assert.ok(Math.abs(renderedDiameter(quarter[0]) / renderedDiameter(full[0]) - 0.5) < 1e-9)
})

test('Halftone Dots uses conventional CMYK screen angles', () => {
  const expected = { c: 15, m: 75, y: 0, k: 45 }

  for (const [channel, degrees] of Object.entries(expected)) {
    const paths = dots.process(
      () => 1,
      { ...params, _channel: channel },
      area,
    )
    const actual = normalizedScreenAngle(paths[0])
    assert.ok(Math.abs(actual - (degrees * Math.PI) / 180) < 1e-9)
  }
})

test('Halftone Dots separates generic spot-colour layers', () => {
  const expected = [15, 75, 0]

  for (const [index, degrees] of expected.entries()) {
    const paths = dots.process(
      () => 1,
      { ...params, _layerIndex: index, _layerCount: expected.length },
      area,
    )
    const actual = normalizedScreenAngle(paths[0])
    assert.ok(Math.abs(actual - (degrees * Math.PI) / 180) < 1e-9)
  }
})

test('Halftone Dots only samples normalized image coordinates', () => {
  const samples = []
  dots.process((x, y) => {
    samples.push([x, y])
    return 0.5
  }, { ...params, angle: 35, _channel: 'm' }, area)

  assert.ok(samples.length > 0)
  assert.ok(samples.every(([x, y]) => x >= 0 && x <= 1 && y >= 0 && y <= 1))
})
