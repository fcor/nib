import Panel from './Panel.jsx'
import Select from '../controls/Select.jsx'
import { algorithms, algorithmsById } from '../../algorithms/index.js'

export default function AlgorithmPanel({ algorithmId, onAlgorithm }) {
  const algorithm = algorithmsById[algorithmId]
  return (
    <Panel step={2} title="Algorithm">
      <Select
        value={algorithmId}
        options={algorithms.map((a) => ({ value: a.id, label: a.name }))}
        onChange={onAlgorithm}
      />
      <p className="algorithm__desc">{algorithm.description}</p>
    </Panel>
  )
}
