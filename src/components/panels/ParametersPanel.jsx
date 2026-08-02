import Panel from './Panel.jsx'
import Slider from '../controls/Slider.jsx'
import Toggle from '../controls/Toggle.jsx'
import { algorithmsById } from '../../algorithms/index.js'

export default function ParametersPanel({ algorithmId, params, onParam }) {
  const algorithm = algorithmsById[algorithmId]

  return (
    <Panel step={3} title="Parameters">
      {algorithm.params.map((p) => {
        if (p.type === 'range') {
          return (
            <Slider
              key={p.key}
              label={p.label}
              value={params[p.key]}
              min={p.min}
              max={p.max}
              step={p.step}
              unit={p.unit}
              onChange={(v) => onParam(p.key, v)}
            />
          )
        }
        if (p.type === 'toggle') {
          return (
            <Toggle
              key={p.key}
              label={p.label}
              value={params[p.key]}
              onChange={(v) => onParam(p.key, v)}
            />
          )
        }
        return null
      })}
    </Panel>
  )
}
