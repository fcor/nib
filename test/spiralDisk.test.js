import test from 'node:test'
import assert from 'node:assert/strict'
import { spiralDisk } from '../src/fills/spiralDisk.js'

function distance(a, b) {
  return Math.hypot(a[0] - b[0], a[1] - b[1])
}

test('spiralDisk keeps invalid geometry out of the plot', () => {
  assert.deepEqual(spiralDisk(0, 0, 0, 0.4), [])
  assert.deepEqual(spiralDisk(0, 0, 2, 0), [])
  assert.deepEqual(spiralDisk(NaN, 0, 2, 0.4), [])
})

test('spiralDisk turns a sub-nib dot into a real plotter movement', () => {
  const path = spiralDisk(10, 20, 0.2, 0.4, { endAngle: Math.PI / 2 })

  assert.equal(path.length, 2)
  assert.deepEqual(path[0], [10, 20])
  assert.ok(distance(path[0], path[1]) >= 0.02 - 1e-9)
  assert.ok(Math.abs(path[1][0] - 10) < 1e-9)
  assert.ok(path[1][1] > 20)
})

test('spiralDisk reaches the requested ink diameter with bounded segments', () => {
  const diameter = 4
  const nibWidth = 0.4
  const endAngle = Math.PI / 3
  const path = spiralDisk(3, 7, diameter, nibWidth, { endAngle })
  const last = path.at(-1)
  const centerlineRadius = distance([3, 7], last)
  const renderedDiameter = centerlineRadius * 2 + nibWidth
  const lastAngle = Math.atan2(last[1] - 7, last[0] - 3)
  const maxSegment = Math.max(
    ...path.slice(1).map((point, i) => distance(path[i], point)),
  )

  assert.deepEqual(path[0], [3, 7])
  assert.ok(path.length > 20)
  assert.ok(Math.abs(renderedDiameter - diameter) < 1e-9)
  assert.ok(Math.abs(lastAngle - endAngle) < 1e-9)
  assert.ok(maxSegment <= 0.31)
  assert.ok(path.every(([x, y]) => Number.isFinite(x) && Number.isFinite(y)))
})
