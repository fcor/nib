export const MIN_ZOOM = 1
export const MAX_ZOOM = 8
export const ZOOM_LEVELS = Object.freeze([1, 1.25, 1.5, 2, 3, 4, 6, 8])

const EPSILON = 1e-9

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function midpoint(a, b) {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
}

function pointerDistance(a, b) {
  return Math.hypot(b.x - a.x, b.y - a.y)
}

export function createViewport(paperSize) {
  return {
    zoom: MIN_ZOOM,
    centerX: (paperSize?.width || 0) / 2,
    centerY: (paperSize?.height || 0) / 2,
  }
}

export function fitScale(canvasSize, paperSize, pad) {
  if (!paperSize?.width || !paperSize?.height) return 1

  const innerWidth = Math.max(1, (canvasSize?.width || 0) - pad * 2)
  const innerHeight = Math.max(1, (canvasSize?.height || 0) - pad * 2)
  return Math.min(
    innerWidth / paperSize.width,
    innerHeight / paperSize.height,
  )
}

function constrainAxis(center, paperLength, canvasLength, scale, pad) {
  const paperMidpoint = paperLength / 2
  const visibleHalf = Math.max(0, (canvasLength / 2 - pad) / scale)

  if (visibleHalf * 2 >= paperLength) return paperMidpoint
  return clamp(center, visibleHalf, paperLength - visibleHalf)
}

export function constrainViewport(viewport, canvasSize, paperSize, pad) {
  if (!paperSize?.width || !paperSize?.height) return createViewport(paperSize)

  const zoom = clamp(
    Number.isFinite(viewport?.zoom) ? viewport.zoom : MIN_ZOOM,
    MIN_ZOOM,
    MAX_ZOOM,
  )
  const scale = fitScale(canvasSize, paperSize, pad) * zoom
  const centerX = Number.isFinite(viewport?.centerX)
    ? viewport.centerX
    : paperSize.width / 2
  const centerY = Number.isFinite(viewport?.centerY)
    ? viewport.centerY
    : paperSize.height / 2

  return {
    zoom,
    centerX: constrainAxis(
      centerX,
      paperSize.width,
      canvasSize?.width || 0,
      scale,
      pad,
    ),
    centerY: constrainAxis(
      centerY,
      paperSize.height,
      canvasSize?.height || 0,
      scale,
      pad,
    ),
  }
}

export function viewportFrame(viewport, canvasSize, paperSize, pad) {
  const constrained = constrainViewport(
    viewport,
    canvasSize,
    paperSize,
    pad,
  )
  const scale = fitScale(canvasSize, paperSize, pad) * constrained.zoom
  const canvasCenterX = (canvasSize?.width || 0) / 2
  const canvasCenterY = (canvasSize?.height || 0) / 2

  return {
    ...constrained,
    scale,
    x: canvasCenterX - constrained.centerX * scale,
    y: canvasCenterY - constrained.centerY * scale,
    width: (paperSize?.width || 0) * scale,
    height: (paperSize?.height || 0) * scale,
  }
}

export function paperToScreen(point, viewport, canvasSize, paperSize, pad) {
  const frame = viewportFrame(viewport, canvasSize, paperSize, pad)
  return {
    x: frame.x + point.x * frame.scale,
    y: frame.y + point.y * frame.scale,
  }
}

export function screenToPaper(point, viewport, canvasSize, paperSize, pad) {
  const frame = viewportFrame(viewport, canvasSize, paperSize, pad)
  return {
    x: (point.x - frame.x) / frame.scale,
    y: (point.y - frame.y) / frame.scale,
  }
}

export function zoomAt(
  viewport,
  nextZoom,
  anchor,
  canvasSize,
  paperSize,
  pad,
) {
  const current = constrainViewport(
    viewport,
    canvasSize,
    paperSize,
    pad,
  )
  const paperAnchor = screenToPaper(
    anchor,
    current,
    canvasSize,
    paperSize,
    pad,
  )
  const zoom = clamp(nextZoom, MIN_ZOOM, MAX_ZOOM)
  const scale = fitScale(canvasSize, paperSize, pad) * zoom
  const canvasCenterX = (canvasSize?.width || 0) / 2
  const canvasCenterY = (canvasSize?.height || 0) / 2

  return constrainViewport(
    {
      zoom,
      centerX: paperAnchor.x - (anchor.x - canvasCenterX) / scale,
      centerY: paperAnchor.y - (anchor.y - canvasCenterY) / scale,
    },
    canvasSize,
    paperSize,
    pad,
  )
}

export function panBy(
  viewport,
  delta,
  canvasSize,
  paperSize,
  pad,
) {
  const current = constrainViewport(
    viewport,
    canvasSize,
    paperSize,
    pad,
  )
  const scale = fitScale(canvasSize, paperSize, pad) * current.zoom

  return constrainViewport(
    {
      ...current,
      centerX: current.centerX - delta.x / scale,
      centerY: current.centerY - delta.y / scale,
    },
    canvasSize,
    paperSize,
    pad,
  )
}

export function pinchViewport(
  viewport,
  previousPointers,
  nextPointers,
  canvasSize,
  paperSize,
  pad,
) {
  if (previousPointers.length < 2 || nextPointers.length < 2) {
    return constrainViewport(viewport, canvasSize, paperSize, pad)
  }

  const previousDistance = pointerDistance(
    previousPointers[0],
    previousPointers[1],
  )
  if (previousDistance < EPSILON) {
    return constrainViewport(viewport, canvasSize, paperSize, pad)
  }

  const current = constrainViewport(
    viewport,
    canvasSize,
    paperSize,
    pad,
  )
  const previousMidpoint = midpoint(
    previousPointers[0],
    previousPointers[1],
  )
  const nextMidpoint = midpoint(nextPointers[0], nextPointers[1])
  const paperAnchor = screenToPaper(
    previousMidpoint,
    current,
    canvasSize,
    paperSize,
    pad,
  )
  const nextDistance = pointerDistance(nextPointers[0], nextPointers[1])
  const zoom = clamp(
    current.zoom * (nextDistance / previousDistance),
    MIN_ZOOM,
    MAX_ZOOM,
  )
  const scale = fitScale(canvasSize, paperSize, pad) * zoom
  const canvasCenterX = (canvasSize?.width || 0) / 2
  const canvasCenterY = (canvasSize?.height || 0) / 2

  return constrainViewport(
    {
      zoom,
      centerX:
        paperAnchor.x - (nextMidpoint.x - canvasCenterX) / scale,
      centerY:
        paperAnchor.y - (nextMidpoint.y - canvasCenterY) / scale,
    },
    canvasSize,
    paperSize,
    pad,
  )
}

export function stepZoom(zoom, direction) {
  if (direction > 0) {
    return (
      ZOOM_LEVELS.find((level) => level > zoom + EPSILON) || MAX_ZOOM
    )
  }

  return (
    [...ZOOM_LEVELS].reverse().find((level) => level < zoom - EPSILON) ||
    MIN_ZOOM
  )
}

export function wheelZoomFactor(deltaY, deltaMode = 0, pageHeight = 800) {
  const pixels =
    deltaMode === 1
      ? deltaY * 16
      : deltaMode === 2
        ? deltaY * pageHeight
        : deltaY
  return Math.exp(-pixels * 0.0015)
}

export function isFitViewport(viewport, paperSize) {
  const fitted = createViewport(paperSize)
  return (
    Math.abs(viewport.zoom - fitted.zoom) < EPSILON &&
    Math.abs(viewport.centerX - fitted.centerX) < EPSILON &&
    Math.abs(viewport.centerY - fitted.centerY) < EPSILON
  )
}
