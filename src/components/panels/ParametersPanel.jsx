import Panel from './Panel.jsx'
import Slider from '../controls/Slider.jsx'
import Toggle from '../controls/Toggle.jsx'
import Select from '../controls/Select.jsx'
import { algorithmsById } from '../../algorithms/index.js'

export default function ParametersPanel({ algorithmId, params, onParam, colorMode }) {
  const algorithm = algorithmsById[algorithmId]

  // In separated modes each layer's tone is an ink amount, not brightness, so the
  // separation already decides what's dark — `generate.js` passes `false` for
  // invert there and the control has nothing to act on.
  const visible = algorithm.params.filter(
    (p) => !(p.key === 'invert' && colorMode !== 'mono'),
  )

  return (
    <Panel step={3} title="Parameters">
      {visible.map((p) => {
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
        if (p.type === 'select') {
          return (
            <Select
              key={p.key}
              label={p.label}
              value={params[p.key]}
              options={p.options}
              onChange={(v) => onParam(p.key, v)}
            />
          )
        }
        return null
      })}
    </Panel>
  )
}
