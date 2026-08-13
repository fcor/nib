import test from 'node:test'
import assert from 'node:assert/strict'
import {
  MAX_ZOOM,
  MIN_ZOOM,
  constrainViewport,
  createViewport,
  fitScale,
  panBy,
  paperToScreen,
  pinchViewport,
  screenToPaper,
  stepZoom,
  viewportFrame,
  wheelZoomFactor,
  zoomAt,
} from '../src/geometry/viewport.js'

const PAD = 56
const canvas = { width: 1000, height: 800 }
const paper = { width: 148, height: 210 }

function closeTo(actual, expected, tolerance = 1e-9) {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `${actual} is not within ${tolerance} of ${expected}`,
  )
}

test('fit scale centres portrait and landscape paper inside the padding', () => {
  const portrait = viewportFrame(createViewport(paper), canvas, paper, PAD)
  const landscapePaper = { width: 210, height: 148 }
  const landscape = viewportFrame(
    createViewport(landscapePaper),
    canvas,
    landscapePaper,
    PAD,
  )

  closeTo(portrait.scale, 688 / 210)
  closeTo(portrait.y, PAD)
  closeTo(portrait.x, (canvas.width - paper.width * portrait.scale) / 2)
  closeTo(landscape.scale, 888 / 210)
  closeTo(
    landscape.y,
    (canvas.height - landscapePaper.height * landscape.scale) / 2,
  )
})

test('fit scale stays finite in a tiny canvas', () => {
  const tiny = { width: 0, height: 20 }
  const scale = fitScale(tiny, paper, PAD)
  const frame = viewportFrame(createViewport(paper), tiny, paper, PAD)

  assert.ok(scale > 0)
  assert.ok(Number.isFinite(frame.x))
  assert.ok(Number.isFinite(frame.y))
  assert.ok(Number.isFinite(frame.scale))
})

test('paper and screen coordinates round-trip', () => {
  const viewport = { zoom: 3, centerX: 90, centerY: 80 }
  const point = { x: 41.25, y: 127.5 }
  const screen = paperToScreen(point, viewport, canvas, paper, PAD)
  const roundTrip = screenToPaper(screen, viewport, canvas, paper, PAD)

  closeTo(roundTrip.x, point.x)
  closeTo(roundTrip.y, point.y)
})

test('off-centre zoom keeps the same paper point under the anchor', () => {
  const viewport = createViewport(paper)
  const anchor = { x: 600, y: 250 }
  const before = screenToPaper(anchor, viewport, canvas, paper, PAD)
  const zoomed = zoomAt(viewport, 3, anchor, canvas, paper, PAD)
  const after = screenToPaper(anchor, zoomed, canvas, paper, PAD)

  closeTo(after.x, before.x)
  closeTo(after.y, before.y)
})

test('zoom and pan clamp to recoverable paper bounds', () => {
  const tooFar = constrainViewport(
    { zoom: 100, centerX: -1000, centerY: 1000 },
    canvas,
    paper,
    PAD,
  )
  const fitted = panBy(
    createViewport(paper),
    { x: 500, y: 500 },
    canvas,
    paper,
    PAD,
  )

  assert.equal(tooFar.zoom, MAX_ZOOM)
  assert.ok(tooFar.centerX >= 0 && tooFar.centerX <= paper.width)
  assert.ok(tooFar.centerY >= 0 && tooFar.centerY <= paper.height)
  assert.deepEqual(fitted, createViewport(paper))
})

test('dragging the paper changes its paper-space centre', () => {
  const zoomed = zoomAt(
    createViewport(paper),
    4,
    { x: 500, y: 400 },
    canvas,
    paper,
    PAD,
  )
  const panned = panBy(
    zoomed,
    { x: 80, y: -40 },
    canvas,
    paper,
    PAD,
  )
  const scale = fitScale(canvas, paper, PAD) * zoomed.zoom

  closeTo(panned.centerX, zoomed.centerX - 80 / scale)
  closeTo(panned.centerY, zoomed.centerY + 40 / scale)
})

test('pinch zoom preserves and translates the gesture midpoint', () => {
  const viewport = createViewport(paper)
  const previous = [{ x: 400, y: 400 }, { x: 600, y: 400 }]
  const next = [{ x: 320, y: 420 }, { x: 720, y: 420 }]
  const paperAnchor = screenToPaper(
    { x: 500, y: 400 },
    viewport,
    canvas,
    paper,
    PAD,
  )
  const pinched = pinchViewport(
    viewport,
    previous,
    next,
    canvas,
    paper,
    PAD,
  )
  const translatedAnchor = screenToPaper(
    { x: 520, y: 420 },
    pinched,
    canvas,
    paper,
    PAD,
  )

  assert.equal(pinched.zoom, 2)
  closeTo(translatedAnchor.x, paperAnchor.x)
  closeTo(translatedAnchor.y, paperAnchor.y)
})

test('zero-distance pinch is ignored without invalid state', () => {
  const viewport = createViewport(paper)
  const result = pinchViewport(
    viewport,
    [{ x: 10, y: 10 }, { x: 10, y: 10 }],
    [{ x: 5, y: 5 }, { x: 15, y: 15 }],
    canvas,
    paper,
    PAD,
  )

  assert.deepEqual(result, viewport)
})

test('zoom steps and wheel deltas respect the configured range', () => {
  assert.equal(stepZoom(MIN_ZOOM, -1), MIN_ZOOM)
  assert.equal(stepZoom(MIN_ZOOM, 1), 1.25)
  assert.equal(stepZoom(1.3, 1), 1.5)
  assert.equal(stepZoom(MAX_ZOOM, 1), MAX_ZOOM)
  assert.ok(wheelZoomFactor(-100) > 1)
  assert.ok(wheelZoomFactor(100) < 1)
  closeTo(wheelZoomFactor(1, 1), wheelZoomFactor(16, 0))
})
