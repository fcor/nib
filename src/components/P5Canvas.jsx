import { useEffect, useRef } from 'react'
import p5 from 'p5'
import { canvasTheme as T } from '../styles/canvasTheme.js'
import {
  MIN_ZOOM,
  panBy,
  pinchViewport,
  stepZoom,
  viewportFrame,
  wheelZoomFactor,
  zoomAt,
} from '../geometry/viewport.js'

const PAD = T.pad

function buildPathCache(layers) {
  if (typeof Path2D === 'undefined') return null

  return (layers || []).map((layer) => {
    const path = new Path2D()
    for (const line of layer.polylines) {
      if (!line.length) continue
      path.moveTo(line[0][0], line[0][1])
      for (let i = 1; i < line.length; i++) {
        path.lineTo(line[i][0], line[i][1])
      }
    }
    return { pen: layer.pen, path }
  })
}

/**
 * Renders the paper (in mm) and the generated layers, fit to the canvas.
 * - "original": source image drawn into the draw area
 * - "processed": each layer's polylines, in the pen's real color + width
 *
 * The canvas fills its container and follows it on resize.
 * Layers are drawn with MULTIPLY blending so overlapping colors mix like ink.
 */
export default function P5Canvas({
  source,
  layers,
  drawArea,
  paperSize,
  view,
  viewport,
  interactive,
  onViewportChange,
  onCanvasSize,
}) {
  const containerRef = useRef(null)
  const instanceRef = useRef(null)
  const imageRequestRef = useRef(0)
  const stateRef = useRef({
    source,
    layers,
    drawArea,
    paperSize,
    view,
    viewport,
    interactive,
    onViewportChange,
    onCanvasSize,
    img: null,
    pathCache: null,
  })

  useEffect(() => {
    const el = containerRef.current
    const pointers = new Map()
    let redrawFrame = 0

    const sketch = (p) => {
      p.setup = () => {
        const { width, height } = el.getBoundingClientRect()
        const canvasWidth = Math.max(1, Math.floor(width))
        const canvasHeight = Math.max(1, Math.floor(height))
        p.createCanvas(canvasWidth, canvasHeight)
        p.noLoop()
        stateRef.current.onCanvasSize?.({
          width: canvasWidth,
          height: canvasHeight,
        })
      }

      p.draw = () => {
        const {
          source,
          layers,
          drawArea,
          paperSize,
          view,
          viewport,
          img,
          pathCache,
        } = stateRef.current
        p.background(T.desk)
        if (!paperSize) return

        const frame = viewportFrame(
          viewport,
          { width: p.width, height: p.height },
          paperSize,
          PAD,
        )
        const { scale: sc, width: pw, height: ph, x: ox, y: oy } = frame
        const mx = (mm) => ox + mm * sc
        const my = (mm) => oy + mm * sc

        // White sheet on a white desk — the shadow is what separates them.
        const ctx = p.drawingContext
        ctx.save()
        ctx.shadowColor = T.shadowColor
        ctx.shadowBlur = T.shadowBlur
        ctx.shadowOffsetY = T.shadowOffsetY
        p.noStroke()
        p.fill(T.sheet)
        p.rect(ox, oy, pw, ph)
        ctx.restore()

        if (view === 'original' && img && drawArea) {
          p.image(img, mx(drawArea.x), my(drawArea.y), drawArea.w * sc, drawArea.h * sc)
        }

        if (view === 'processed' && layers && layers.length) {
          if (pathCache) {
            ctx.save()
            ctx.globalCompositeOperation = 'multiply'
            ctx.translate(ox, oy)
            ctx.scale(sc, sc)
            ctx.lineCap = 'round'
            ctx.lineJoin = 'round'
            for (const cached of pathCache) {
              ctx.strokeStyle = cached.pen.color
              ctx.lineWidth = Math.max(0.5 / sc, cached.pen.width)
              ctx.stroke(cached.path)
            }
            ctx.restore()
          } else {
            p.push()
            p.blendMode(p.MULTIPLY)
            p.noFill()
            for (const layer of layers) {
              p.stroke(layer.pen.color)
              p.strokeWeight(Math.max(0.5, layer.pen.width * sc))
              for (const line of layer.polylines) {
                p.beginShape()
                for (const [px, py] of line) p.vertex(mx(px), my(py))
                p.endShape()
              }
            }
            p.pop()
          }
        }

        if (!source) {
          // Drawn on the raw context so the font weight can be stated — p5's
          // text state can't express a variable-font axis or weight.
          ctx.save()
          ctx.fillStyle = T.emptyText
          ctx.font = T.emptyFont
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(
            'Drop an image in the panel to start plotting',
            p.width / 2,
            p.height / 2,
          )
          ctx.restore()
        }
      }
    }

    const instance = new p5(sketch, el)
    instanceRef.current = instance
    const canvas = instance.canvas

    function canvasSize() {
      return { width: instance.width, height: instance.height }
    }

    function localPoint(event) {
      const rect = canvas.getBoundingClientRect()
      return {
        x: ((event.clientX - rect.left) / rect.width) * instance.width,
        y: ((event.clientY - rect.top) / rect.height) * instance.height,
      }
    }

    function requestRedraw() {
      if (redrawFrame) return
      redrawFrame = requestAnimationFrame(() => {
        redrawFrame = 0
        instance.redraw()
      })
    }

    function commitViewport(next) {
      stateRef.current.viewport = next
      stateRef.current.onViewportChange?.(next)
      requestRedraw()
    }

    function zoomAroundCenter(nextZoom) {
      const size = canvasSize()
      commitViewport(
        zoomAt(
          stateRef.current.viewport,
          nextZoom,
          { x: size.width / 2, y: size.height / 2 },
          size,
          stateRef.current.paperSize,
          PAD,
        ),
      )
    }

    function handleWheel(event) {
      if (!stateRef.current.interactive) return
      event.preventDefault()
      const size = canvasSize()
      const factor = wheelZoomFactor(
        event.deltaY,
        event.deltaMode,
        size.height,
      )
      commitViewport(
        zoomAt(
          stateRef.current.viewport,
          stateRef.current.viewport.zoom * factor,
          localPoint(event),
          size,
          stateRef.current.paperSize,
          PAD,
        ),
      )
    }

    function handlePointerDown(event) {
      if (
        !stateRef.current.interactive ||
        (event.pointerType === 'mouse' && event.button !== 0)
      ) {
        return
      }

      event.preventDefault()
      el.focus({ preventScroll: true })
      canvas.setPointerCapture(event.pointerId)
      pointers.set(event.pointerId, localPoint(event))
      el.classList.add('p5-canvas--dragging')
    }

    function handlePointerMove(event) {
      if (!pointers.has(event.pointerId)) return
      event.preventDefault()

      const previous = [...pointers.values()]
      const previousPoint = pointers.get(event.pointerId)
      const nextPoint = localPoint(event)
      pointers.set(event.pointerId, nextPoint)
      const next = [...pointers.values()]
      const size = canvasSize()

      commitViewport(
        previous.length >= 2 && next.length >= 2
          ? pinchViewport(
              stateRef.current.viewport,
              previous,
              next,
              size,
              stateRef.current.paperSize,
              PAD,
            )
          : panBy(
              stateRef.current.viewport,
              {
                x: nextPoint.x - previousPoint.x,
                y: nextPoint.y - previousPoint.y,
              },
              size,
              stateRef.current.paperSize,
              PAD,
            ),
      )
    }

    function finishPointer(event) {
      if (!pointers.has(event.pointerId)) return
      pointers.delete(event.pointerId)
      if (canvas.hasPointerCapture(event.pointerId)) {
        canvas.releasePointerCapture(event.pointerId)
      }
      if (!pointers.size) el.classList.remove('p5-canvas--dragging')
    }

    function handleKeyDown(event) {
      if (!stateRef.current.interactive) return

      if (event.key === '+' || event.key === '=') {
        event.preventDefault()
        zoomAroundCenter(stepZoom(stateRef.current.viewport.zoom, 1))
        return
      }
      if (event.key === '-') {
        event.preventDefault()
        zoomAroundCenter(stepZoom(stateRef.current.viewport.zoom, -1))
        return
      }
      if (event.key === '0') {
        event.preventDefault()
        commitViewport({
          zoom: MIN_ZOOM,
          centerX: stateRef.current.paperSize.width / 2,
          centerY: stateRef.current.paperSize.height / 2,
        })
        return
      }

      const distance = event.shiftKey ? 120 : 40
      const deltas = {
        ArrowLeft: { x: distance, y: 0 },
        ArrowRight: { x: -distance, y: 0 },
        ArrowUp: { x: 0, y: distance },
        ArrowDown: { x: 0, y: -distance },
      }
      const delta = deltas[event.key]
      if (!delta) return

      event.preventDefault()
      commitViewport(
        panBy(
          stateRef.current.viewport,
          delta,
          canvasSize(),
          stateRef.current.paperSize,
          PAD,
        ),
      )
    }

    canvas.addEventListener('wheel', handleWheel, { passive: false })
    canvas.addEventListener('pointerdown', handlePointerDown)
    canvas.addEventListener('pointermove', handlePointerMove)
    canvas.addEventListener('pointerup', finishPointer)
    canvas.addEventListener('pointercancel', finishPointer)
    el.addEventListener('keydown', handleKeyDown)

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      const canvasWidth = Math.max(1, Math.floor(width))
      const canvasHeight = Math.max(1, Math.floor(height))
      instance.resizeCanvas(canvasWidth, canvasHeight)
      stateRef.current.onCanvasSize?.({
        width: canvasWidth,
        height: canvasHeight,
      })
      instance.redraw()
    })
    observer.observe(el)

    // Canvas text doesn't reflow when a webfont arrives the way DOM text does,
    // so the empty state would keep the fallback face. Redraw once it's ready.
    let live = true
    document.fonts?.ready.then(() => {
      if (live) instance.redraw()
    })

    return () => {
      live = false
      if (redrawFrame) cancelAnimationFrame(redrawFrame)
      pointers.clear()
      canvas.removeEventListener('wheel', handleWheel)
      canvas.removeEventListener('pointerdown', handlePointerDown)
      canvas.removeEventListener('pointermove', handlePointerMove)
      canvas.removeEventListener('pointerup', finishPointer)
      canvas.removeEventListener('pointercancel', finishPointer)
      el.removeEventListener('keydown', handleKeyDown)
      observer.disconnect()
      instance.remove()
    }
  }, [])

  useEffect(() => {
    const request = ++imageRequestRef.current
    stateRef.current.source = source
    const inst = instanceRef.current
    if (!inst) return
    if (source) {
      inst.loadImage(source.url, (img) => {
        if (request !== imageRequestRef.current) return
        stateRef.current.img = img
        inst.redraw()
      })
    } else {
      stateRef.current.img = null
      inst.redraw()
    }
  }, [source])

  useEffect(() => {
    stateRef.current.layers = layers
    stateRef.current.pathCache = buildPathCache(layers)
    instanceRef.current?.redraw()
  }, [layers])

  useEffect(() => {
    Object.assign(stateRef.current, {
      drawArea,
      paperSize,
      view,
      viewport,
      interactive,
      onViewportChange,
      onCanvasSize,
    })
    instanceRef.current?.redraw()
  }, [
    drawArea,
    paperSize,
    view,
    viewport,
    interactive,
    onViewportChange,
    onCanvasSize,
  ])

  return (
    <div
      className="p5-canvas"
      ref={containerRef}
      role="region"
      tabIndex={interactive ? 0 : -1}
      aria-label={`${view === 'original' ? 'Source image' : 'Plot preview'} viewport`}
      data-zoom={viewport.zoom}
      data-center-x={viewport.centerX}
      data-center-y={viewport.centerY}
      data-can-pan={interactive && viewport.zoom > MIN_ZOOM}
    />
  )
}
