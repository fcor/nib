import { Minus, Plus, Scan } from 'lucide-react'

function IconButton({ label, disabled, onClick, children }) {
  return (
    <button
      type="button"
      className="zoom-controls__button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

export default function ZoomControls({
  zoom,
  canZoomOut,
  canZoomIn,
  canFit,
  onZoomOut,
  onZoomIn,
  onFit,
}) {
  return (
    <div className="zoom-controls" role="group" aria-label="Zoom controls">
      <IconButton
        label="Zoom out"
        disabled={!canZoomOut}
        onClick={onZoomOut}
      >
        <Minus aria-hidden="true" />
      </IconButton>
      <output className="zoom-controls__value" aria-label="Zoom level">
        {Math.round(zoom * 100)}%
      </output>
      <IconButton
        label="Zoom in"
        disabled={!canZoomIn}
        onClick={onZoomIn}
      >
        <Plus aria-hidden="true" />
      </IconButton>
      <IconButton label="Fit sheet" disabled={!canFit} onClick={onFit}>
        <Scan aria-hidden="true" />
      </IconButton>
    </div>
  )
}
