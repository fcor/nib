import { useCallback, useEffect, useState } from 'react'
import P5Canvas from './P5Canvas.jsx'
import SegmentedControl from './controls/SegmentedControl.jsx'
import ZoomControls from './controls/ZoomControls.jsx'
import { canvasTheme as T } from '../styles/canvasTheme.js'
import {
  MAX_ZOOM,
  MIN_ZOOM,
  constrainViewport,
  createViewport,
  isFitViewport,
  stepZoom,
  zoomAt,
} from '../geometry/viewport.js'

const VIEW_OPTIONS = [
  { value: 'original', label: 'Source image' },
  { value: 'processed', label: 'Plot preview' },
]

/** Millimetres get long fast — switch to metres once a line passes 1 m. */
function formatLength(mm) {
  if (mm >= 1000) return `${(mm / 1000).toFixed(1)} m`
  return `${Math.round(mm)} mm`
}

function formatDuration(seconds) {
  if (seconds < 60) return `~${Math.max(5, Math.round(seconds / 5) * 5)} sec`

  const minutes = Math.max(1, Math.round(seconds / 60))
  if (minutes < 60) return `~${minutes} min`

  const hours = Math.floor(minutes / 60)
  const remainder = minutes % 60
  return `~${hours} h${remainder ? ` ${remainder} min` : ''}`
}

function Readout({ label, value }) {
  return (
    <div className="readout__row">
      <span className="readout__label">{label}</span>
      <span className="readout__value">{value}</span>
    </div>
  )
}

export default function CanvasStage({
  source,
  layers,
  drawArea,
  paperSize,
  pathLen,
  travelLen,
  plotEstimate,
  view,
  onView,
}) {
  const [viewport, setViewport] = useState(() => createViewport(paperSize))
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 })
  const canNavigate = Boolean(source && paperSize)

  useEffect(() => {
    setViewport(createViewport(paperSize))
  }, [source?.url, paperSize?.width, paperSize?.height])

  useEffect(() => {
    if (!canvasSize.width || !canvasSize.height) return
    setViewport((current) =>
      constrainViewport(current, canvasSize, paperSize, T.pad),
    )
  }, [canvasSize, paperSize])

  const handleCanvasSize = useCallback((size) => {
    setCanvasSize((current) =>
      current.width === size.width && current.height === size.height
        ? current
        : size,
    )
  }, [])

  function changeZoom(direction) {
    setViewport((current) => {
      const nextZoom = stepZoom(current.zoom, direction)
      return zoomAt(
        current,
        nextZoom,
        { x: canvasSize.width / 2, y: canvasSize.height / 2 },
        canvasSize,
        paperSize,
        T.pad,
      )
    })
  }

  function fitSheet() {
    setViewport(createViewport(paperSize))
  }

  return (
    <div className="stage">
      <div className="stage__canvas">
        <P5Canvas
          source={source}
          layers={layers}
          drawArea={drawArea}
          paperSize={paperSize}
          view={view}
          viewport={viewport}
          interactive={canNavigate}
          onViewportChange={setViewport}
          onCanvasSize={handleCanvasSize}
        />
      </div>

      <div className="stage__view">
        <SegmentedControl value={view} options={VIEW_OPTIONS} onChange={onView} />
      </div>

      {canNavigate ? (
        <div className="stage__zoom">
          <ZoomControls
            zoom={viewport.zoom}
            canZoomOut={viewport.zoom > MIN_ZOOM}
            canZoomIn={viewport.zoom < MAX_ZOOM}
            canFit={!isFitViewport(viewport, paperSize)}
            onZoomOut={() => changeZoom(-1)}
            onZoomIn={() => changeZoom(1)}
            onFit={fitSheet}
          />
        </div>
      ) : null}

      <div className="stage__readout readout">
        <Readout
          label="Paper"
          value={
            paperSize
              ? `${paperSize.name} — ${paperSize.width} × ${paperSize.height} mm`
              : 'none selected'
          }
        />
        {drawArea ? (
          <Readout
            label="Artwork"
            value={`${Math.round(drawArea.w)} × ${Math.round(drawArea.h)} mm`}
          />
        ) : null}
        <Readout
          label="Line to draw"
          value={pathLen ? formatLength(pathLen) : 'nothing yet'}
        />
        {travelLen ? (
          <Readout label="Travel moves" value={formatLength(travelLen)} />
        ) : null}
        {plotEstimate?.seconds ? (
          <Readout
            label="Plot time"
            value={
              formatDuration(plotEstimate.seconds) +
              (plotEstimate.penChanges
                ? ` + ${plotEstimate.penChanges} pen swap${plotEstimate.penChanges > 1 ? 's' : ''}`
                : '')
            }
          />
        ) : null}
      </div>
    </div>
  )
}
