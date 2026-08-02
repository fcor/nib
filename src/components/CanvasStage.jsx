import P5Canvas from './P5Canvas.jsx'
import SegmentedControl from './controls/SegmentedControl.jsx'

const VIEW_OPTIONS = [
  { value: 'original', label: 'Original' },
  { value: 'processed', label: 'Processed' },
  { value: 'both', label: 'Both' },
]

export default function CanvasStage({
  source,
  polylines,
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
          polylines={polylines}
          drawArea={drawArea}
          paperSize={paperSize}
          view={view}
        />
      </div>

      <p className="stage__readout">
        {paperSize ? `${paperSize.width} × ${paperSize.height} mm` : '— mm'}
        {drawArea ? (
          <>
            <span className="stage__dot">·</span>
            <span className="stage__dim">
              art {Math.round(drawArea.w)} × {Math.round(drawArea.h)} mm
            </span>
          </>
        ) : null}
        <span className="stage__dot">·</span>
        <span className="stage__dim">
          {pathLen ? `~${Math.round(pathLen).toLocaleString()} mm path` : 'no path'}
        </span>
        {travelLen ? (
          <>
            <span className="stage__dot">·</span>
            <span className="stage__dim">
              ↑ {Math.round(travelLen).toLocaleString()} mm travel
            </span>
          </>
        ) : null}
      </p>

      <div className="stage__toggle">
        <SegmentedControl value={view} options={VIEW_OPTIONS} onChange={onView} />
      </div>
    </div>
  )
}
