import { useEffect, useMemo, useState } from 'react'
import CanvasStage from './components/CanvasStage.jsx'
import SourcePanel from './components/panels/SourcePanel.jsx'
import AlgorithmPanel from './components/panels/AlgorithmPanel.jsx'
import ParametersPanel from './components/panels/ParametersPanel.jsx'
import ExportPanel, { PAPER_SIZES } from './components/panels/ExportPanel.jsx'
import { algorithmsById, defaultParams } from './algorithms/index.js'
import { prepareImage } from './image/prepareImage.js'
import { computeDrawArea, pathLength } from './geometry/layout.js'
import { optimizeTravel, penUpTravel } from './geometry/optimize.js'
import './styles/App.css'

export default function App() {
  const [source, setSource] = useState(null)
  const [image, setImage] = useState(null) // prepared grayscale sampler
  const [algorithmId, setAlgorithmId] = useState('serpentine')
  const [params, setParams] = useState(() =>
    defaultParams(algorithmsById['serpentine']),
  )
  const [view, setView] = useState('processed')
  const [paper, setPaper] = useState('a5')
  const [optimize, setOptimize] = useState(true)

  const paperSize = useMemo(
    () => PAPER_SIZES.find((p) => p.value === paper),
    [paper],
  )

  // Prepare the grayscale sampler whenever a new image is uploaded.
  useEffect(() => {
    if (!source) {
      setImage(null)
      return
    }
    let cancelled = false
    prepareImage(source.url).then((img) => {
      if (!cancelled) setImage(img)
    })
    return () => {
      cancelled = true
    }
  }, [source])

  const drawArea = useMemo(() => {
    if (!source) return null
    return computeDrawArea(paperSize, source.width / source.height)
  }, [source, paperSize])

  const polylines = useMemo(() => {
    const algorithm = algorithmsById[algorithmId]
    if (!image || !drawArea || !algorithm.process) return []
    return algorithm.process(image, params, drawArea)
  }, [image, drawArea, algorithmId, params])

  // Reorder strokes to cut pen-up travel (no-op for single-line algorithms).
  const plotLines = useMemo(
    () => (optimize ? optimizeTravel(polylines) : polylines),
    [polylines, optimize],
  )

  const pathLen = useMemo(() => pathLength(plotLines), [plotLines])
  const travelLen = useMemo(() => penUpTravel(plotLines), [plotLines])

  function handleAlgorithm(id) {
    setAlgorithmId(id)
    setParams(defaultParams(algorithmsById[id]))
  }

  function handleParam(key, value) {
    setParams((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="app">
      <div className="app__stage">
        <header className="app__brand">◆ Plotter App</header>
        <CanvasStage
          source={source}
          polylines={plotLines}
          drawArea={drawArea}
          paperSize={paperSize}
          pathLen={pathLen}
          travelLen={travelLen}
          view={view}
          onView={setView}
        />
      </div>

      <aside className="app__panels">
        <SourcePanel source={source} onSource={setSource} />
        <AlgorithmPanel algorithmId={algorithmId} onAlgorithm={handleAlgorithm} />
        <ParametersPanel
          algorithmId={algorithmId}
          params={params}
          onParam={handleParam}
        />
        <ExportPanel
          paper={paper}
          onPaper={setPaper}
          polylines={plotLines}
          paperSize={paperSize}
          sourceName={source?.name}
          optimize={optimize}
          onOptimize={setOptimize}
        />
      </aside>
    </div>
  )
}
