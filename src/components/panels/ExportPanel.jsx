import Panel from './Panel.jsx'
import Select from '../controls/Select.jsx'
import Toggle from '../controls/Toggle.jsx'
import { downloadSVG } from '../../export/exportSVG.js'

/** Common plotter paper sizes (mm). Landscape/portrait handled later. */
export const PAPER_SIZES = [
  { value: 'a3', label: 'A3 (297×420)', width: 297, height: 420 },
  { value: 'a4', label: 'A4 (210×297)', width: 210, height: 297 },
  { value: 'a5', label: 'A5 (148×210)', width: 148, height: 210 },
]

function svgFilename(sourceName) {
  const base = sourceName ? sourceName.replace(/\.[^.]+$/, '') : 'plot'
  return `${base}.svg`
}

export default function ExportPanel({
  paper,
  onPaper,
  polylines,
  paperSize,
  sourceName,
  optimize,
  onOptimize,
}) {
  const canExport = polylines && polylines.length > 0

  return (
    <Panel step={4} title="Export">
      <Select
        label="Paper"
        value={paper}
        options={PAPER_SIZES.map((p) => ({ value: p.value, label: p.label }))}
        onChange={onPaper}
      />
      <Toggle label="Optimize travel" value={optimize} onChange={onOptimize} />
      <div className="export__actions">
        <button
          type="button"
          className="btn btn--primary"
          disabled={!canExport}
          onClick={() => downloadSVG(polylines, paperSize, svgFilename(sourceName))}
        >
          ↧ Export SVG
        </button>
        <button type="button" className="btn" disabled>
          ↧ Export PDF
        </button>
      </div>
      <p className="export__note">
        {canExport ? 'SVG is in mm — plots at true scale.' : 'Upload an image to export.'}
      </p>
    </Panel>
  )
}
