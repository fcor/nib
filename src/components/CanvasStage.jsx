import P5Canvas from './P5Canvas.jsx'
import SegmentedControl from './controls/SegmentedControl.jsx'

const VIEW_OPTIONS = [
  { value: 'original', label: 'Source image' },
  { value: 'processed', label: 'Plot preview' },
]

/** Millimetres get long fast — switch to metres once a line passes 1 m. */
function formatLength(mm) {
  if (mm >= 1000) return `${(mm / 1000).toFixed(1)} m`
  return `${Math.round(mm)} mm`
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
  view,
  onView,
}) {
  return (
    <div className="stage">
      <div className="stage__canvas">
        <P5Canvas
          source={source}
          layers={layers}
          drawArea={drawArea}
          paperSize={paperSize}
          view={view}
        />
      </div>

      <div className="stage__view">
        <SegmentedControl value={view} options={VIEW_OPTIONS} onChange={onView} />
      </div>

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
      </div>
    </div>
  )
}
