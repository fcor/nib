import { useEffect, useRef } from 'react'
import p5 from 'p5'

const CANVAS_W = 620
const CANVAS_H = 460
const PAD = 24

/**
 * Renders the paper (in mm) and the generated polylines, fit to the canvas.
 * - "original": source image drawn into the draw area
 * - "processed": polylines
 * - "both": faint image under the polylines
 */
export default function P5Canvas({ source, polylines, drawArea, paperSize, view }) {
  const containerRef = useRef(null)
  const instanceRef = useRef(null)
  const stateRef = useRef({ source, polylines, drawArea, paperSize, view, img: null })

  // Mount the sketch once.
  useEffect(() => {
    const sketch = (p) => {
      p.setup = () => {
        p.createCanvas(CANVAS_W, CANVAS_H)
        p.noLoop()
      }

      p.draw = () => {
        const { source, polylines, drawArea, paperSize, view, img } = stateRef.current
        p.background(38)

        if (!paperSize) return

        // Paper -> canvas transform (mm to px).
        const sc = Math.min(
          (CANVAS_W - PAD * 2) / paperSize.width,
          (CANVAS_H - PAD * 2) / paperSize.height,
        )
        const pw = paperSize.width * sc
        const ph = paperSize.height * sc
        const ox = (CANVAS_W - pw) / 2
        const oy = (CANVAS_H - ph) / 2
        const mx = (mm) => ox + mm * sc
        const my = (mm) => oy + mm * sc

        // Page.
        p.noStroke()
        p.fill(255)
        p.rect(ox, oy, pw, ph)

        const showOriginal = view === 'original' || view === 'both'
        const showProcessed = view === 'processed' || view === 'both'

        if (showOriginal && img && drawArea) {
          p.push()
          if (view === 'both') p.tint(255, 70)
          p.image(img, mx(drawArea.x), my(drawArea.y), drawArea.w * sc, drawArea.h * sc)
          p.pop()
        }

        if (showProcessed && polylines && polylines.length) {
          p.noFill()
          p.stroke(20)
          p.strokeWeight(0.8)
          for (const line of polylines) {
            p.beginShape()
            for (const [px, py] of line) p.vertex(mx(px), my(py))
            p.endShape()
          }
        }

        if (!source) {
          p.noStroke()
          p.fill(170)
          p.textAlign(p.CENTER, p.CENTER)
          p.textSize(14)
          p.text('Upload an image to begin', CANVAS_W / 2, CANVAS_H / 2)
        }
      }
    }

    const instance = new p5(sketch, containerRef.current)
    instanceRef.current = instance
    return () => instance.remove()
  }, [])

  // Load the source image into p5 whenever it changes.
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

  // Redraw whenever geometry or view settings change.
  useEffect(() => {
    Object.assign(stateRef.current, { polylines, drawArea, paperSize, view })
    instanceRef.current?.redraw()
  }, [polylines, drawArea, paperSize, view])

  return <div className="p5-canvas" ref={containerRef} />
}
