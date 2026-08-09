import Panel from './Panel.jsx'
import Select from '../controls/Select.jsx'
import { downloadSVG } from '../../export/exportSVG.js'

/** Flip when PDF export actually exists — see BACKLOG.md. */
const SHOW_PDF_EXPORT = false

/** Common plotter paper sizes (mm). Landscape/portrait handled later. */
export const PAPER_SIZES = [
  { value: 'a3', name: 'A3', label: 'A3 — 297 × 420 mm', width: 297, height: 420 },
  { value: 'a4', name: 'A4', label: 'A4 — 210 × 297 mm', width: 210, height: 297 },
  { value: 'a5', name: 'A5', label: 'A5 — 148 × 210 mm', width: 148, height: 210 },
]

export default function ExportPanel({
  paper,
  onPaper,
  layers,
  paperSize,
  settings,
}) {
  const canExport =
    layers && layers.some((l) => l.polylines.some((line) => line.length > 1))

  return (
    <Panel step={5} title="Export">
      <Select
        label="Paper size"
        value={paper}
        options={PAPER_SIZES.map((p) => ({ value: p.value, label: p.label }))}
        onChange={onPaper}
      />
      <div className="export__actions">
        <button
          type="button"
          className="btn btn--primary"
          disabled={!canExport}
          onClick={() => downloadSVG(layers, paperSize, settings)}
        >
          ↧ Export SVG
        </button>
        {SHOW_PDF_EXPORT ? (
          <button type="button" className="btn" disabled>
            ↧ Export PDF
          </button>
        ) : null}
      </div>
      <p className="export__note">
        {canExport
          ? 'The SVG is measured in millimetres, so it plots at real size — no scaling needed.'
          : 'Upload an image first — there are no paths to export yet.'}
      </p>
    </Panel>
  )
}
