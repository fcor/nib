import { useEffect, useRef } from 'react'
import p5 from 'p5'
import { canvasTheme as T } from '../styles/canvasTheme.js'

const PAD = T.pad

/**
 * Renders the paper (in mm) and the generated layers, fit to the canvas.
 * - "original": source image drawn into the draw area
 * - "processed": each layer's polylines, in the pen's real color + width
 *
 * The canvas fills its container and follows it on resize.
 * Layers are drawn with MULTIPLY blending so overlapping colors mix like ink.
 */
export default function P5Canvas({ source, layers, drawArea, paperSize, view }) {
  const containerRef = useRef(null)
  const instanceRef = useRef(null)
  const stateRef = useRef({ source, layers, drawArea, paperSize, view, img: null })

  useEffect(() => {
    const el = containerRef.current

    const sketch = (p) => {
      p.setup = () => {
        const { width, height } = el.getBoundingClientRect()
        p.createCanvas(Math.max(1, Math.floor(width)), Math.max(1, Math.floor(height)))
        p.noLoop()
      }

      p.draw = () => {
        const { source, layers, drawArea, paperSize, view, img } = stateRef.current
        p.background(T.desk)
        if (!paperSize) return

        const sc = Math.min(
          (p.width - PAD * 2) / paperSize.width,
          (p.height - PAD * 2) / paperSize.height,
        )
        const pw = paperSize.width * sc
        const ph = paperSize.height * sc
        const ox = (p.width - pw) / 2
        const oy = (p.height - ph) / 2
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

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      instance.resizeCanvas(Math.max(1, Math.floor(width)), Math.max(1, Math.floor(height)))
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
      observer.disconnect()
      instance.remove()
    }
  }, [])

  useEffect(() => {
    stateRef.current.source = source
    const inst = instanceRef.current
    if (!inst) return
    if (source) {
      inst.loadImage(source.url, (img) => {
        stateRef.current.img = img
        inst.redraw()
      })
    } else {
      stateRef.current.img = null
      inst.redraw()
    }
  }, [source])

  useEffect(() => {
    Object.assign(stateRef.current, { layers, drawArea, paperSize, view })
    instanceRef.current?.redraw()
  }, [layers, drawArea, paperSize, view])

  return <div className="p5-canvas" ref={containerRef} />
}
