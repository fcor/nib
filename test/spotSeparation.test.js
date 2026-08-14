import test from 'node:test'
import assert from 'node:assert/strict'
import {
  createSpotSeparator,
  parseRgbColor,
  separateSpotColor,
} from '../src/color/spotSeparation.js'

function closeTo(actual, expected, tolerance = 1e-6) {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `${actual} is not within ${tolerance} of ${expected}`,
  )
}

test('parseRgbColor accepts common hex and RGB triplet forms', () => {
  assert.deepEqual(parseRgbColor('#0c8'), [0, 204 / 255, 136 / 255])
  assert.deepEqual(parseRgbColor('#ff8000'), [1, 128 / 255, 0])
  assert.deepEqual(parseRgbColor([255, 128, 0]), [1, 128 / 255, 0])
  assert.deepEqual(parseRgbColor([1, 0.5, 0]), [1, 0.5, 0])
  assert.deepEqual(
    parseRgbColor(new Uint8Array([20, 40, 60])),
    [20 / 255, 40 / 255, 60 / 255],
  )
  assert.equal(parseRgbColor('#xyz'), null)
  assert.equal(parseRgbColor([0, NaN, 0]), null)
})

test('white, malformed sources, and empty ink sets need no coverage', () => {
  assert.deepEqual(separateSpotColor([255, 255, 255], ['#f04', '#04f']), [0, 0])
  assert.deepEqual(separateSpotColor('not-rgb', ['#f04', '#04f']), [0, 0])
  assert.deepEqual(separateSpotColor([10, 20, 30], []), [])
  assert.deepEqual(separateSpotColor([10, 20, 30], null), [])
})

test('malformed and non-absorbing inks keep their plate positions at zero', () => {
  const coverages = separateSpotColor(
    '#cc2233',
    [null, '#cc2233', '#ffffff', [NaN, 0, 0]],
  )

  assert.deepEqual(coverages, [0, 1, 0, 0])
  assert.ok(coverages.every(
    (coverage) =>
      Number.isFinite(coverage) && coverage >= 0 && coverage <= 1,
  ))
})

test('an exact palette colour selects its direct ink deterministically', () => {
  const inks = ['#e94f37', '#2364aa', '#f2c14e']
  const separate = createSpotSeparator(inks)

  assert.deepEqual(separate('#e94f37'), [1, 0, 0])
  assert.deepEqual(separate('#2364aa'), [0, 1, 0])
  assert.deepEqual(separate('#f2c14e'), [0, 0, 1])
  assert.deepEqual(separate('#2364aa'), separate('#2364aa'))
})

test('subtractive overprints engage each ink needed by the source', () => {
  const separate = createSpotSeparator(['#00ffff', '#ff00ff'])
  const blue = separate('#0000ff')
  const paleBlue = separate('#1919ff')

  assert.ok(blue[0] > 0.99)
  assert.ok(blue[1] > 0.99)
  assert.ok(paleBlue[0] > 0 && paleBlue[0] < blue[0])
  assert.ok(paleBlue[1] > 0 && paleBlue[1] < blue[1])
  closeTo(paleBlue[0], paleBlue[1])
})

test('the same bounded solver scales beyond two inks', () => {
  const coverages = separateSpotColor(
    '#000000',
    ['#00ffff', '#ff00ff', '#ffff00'],
  )

  assert.equal(coverages.length, 3)
  assert.ok(coverages.every(
    (coverage) =>
      Number.isFinite(coverage) &&
      coverage >= 0 &&
      coverage <= 1 &&
      coverage > 0.99,
  ))
})

test('one-shot and precomputed APIs return the same bounded result', () => {
  const inks = ['#0078bf', '#f15060', '#ffd447', '#202020']
  const source = [73, 41, 92]
  const oneShot = separateSpotColor(source, inks)
  const precomputed = createSpotSeparator(inks)(source)

  assert.deepEqual(oneShot, precomputed)
  assert.equal(oneShot.length, inks.length)
  assert.ok(oneShot.every(
    (coverage) =>
      Number.isFinite(coverage) && coverage >= 0 && coverage <= 1,
  ))
})
