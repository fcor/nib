import { useEffect, useMemo, useState } from 'react'
import CanvasStage from './components/CanvasStage.jsx'
import SourcePanel from './components/panels/SourcePanel.jsx'
import AlgorithmPanel from './components/panels/AlgorithmPanel.jsx'
import ParametersPanel from './components/panels/ParametersPanel.jsx'
import ColorPanel from './components/panels/ColorPanel.jsx'
import ExportPanel, { PAPER_SIZES } from './components/panels/ExportPanel.jsx'
import { algorithmsById, defaultParams } from './algorithms/index.js'
import { PEN_WIDTH, DEFAULT_COLORS } from './pens/pens.js'
import { prepareImage } from './image/prepareImage.js'
import { computeDrawArea, pathLength } from './geometry/layout.js'
import { optimizeTravel, penUpTravel } from './geometry/optimize.js'
import { generateLayers } from './pipeline/generate.js'
import { plotSettings } from './export/plotMeta.js'
import './styles/App.css'

const SAMPLE_ALGORITHM_ID = 'crosshatch'
const SAMPLE_PARAMS = {
  ...defaultParams(algorithmsById[SAMPLE_ALGORITHM_ID]),
  whitePoint: 85,
}

function defaultChannelPens() {
  return {
    c: { color: DEFAULT_COLORS.c, visible: true },
    m: { color: DEFAULT_COLORS.m, visible: true },
    y: { color: DEFAULT_COLORS.y, visible: true },
    k: { color: DEFAULT_COLORS.k, visible: true },
  }
}

export default function App() {
  const [source, setSource] = useState(null)
  const [image, setImage] = useState(null) // prepared samplers
  const [algorithmId, setAlgorithmId] = useState('serpentine')
  const [params, setParams] = useState(() =>
    defaultParams(algorithmsById['serpentine']),
  )
  const [view, setView] = useState('processed')
  const [paper, setPaper] = useState('a5')

  // Color state. Each pen is { color, visible }; nib width is shared and fixed.
  const [colorMode, setColorMode] = useState('mono')
  const [useK, setUseK] = useState(true)
  const [monoPen, setMonoPen] = useState({
    color: DEFAULT_COLORS.mono,
    visible: true,
  })
  const [channelPens, setChannelPens] = useState(defaultChannelPens)

  const paperSize = useMemo(
    () => PAPER_SIZES.find((p) => p.value === paper),
    [paper],
  )

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

  // `name` becomes the SVG layer label, so keep the channel letter on it —
  // that's what makes layers pickable by name in Inkscape.
  const color = useMemo(
    () => ({
      mode: colorMode,
      useK,
      activePen: { ...monoPen, name: 'Pen', width: PEN_WIDTH },
      channelPens: {
        c: { ...channelPens.c, name: 'C', width: PEN_WIDTH },
        m: { ...channelPens.m, name: 'M', width: PEN_WIDTH },
        y: { ...channelPens.y, name: 'Y', width: PEN_WIDTH },
        k: { ...channelPens.k, name: 'K', width: PEN_WIDTH },
      },
    }),
    [colorMode, useK, monoPen, channelPens],
  )

  const layers = useMemo(
    () =>
      generateLayers({
        image,
        algorithm: algorithmsById[algorithmId],
        params,
        area: drawArea,
        color,
      }),
    [image, algorithmId, params, drawArea, color],
  )

  // Reorder each layer's strokes to cut pen-up travel. Always on: it can't
  // change the artwork, only the order strokes are drawn in, and it saves the
  // overwhelming majority of wasted movement. Media that wants a different
  // draw order (wet ink, directional nibs) is a property of the pen, not a
  // question to put to the user — see BACKLOG.md.
  const plotLayers = useMemo(
    () =>
      layers.map((l) => ({
        ...l,
        polylines: optimizeTravel(l.polylines),
      })),
    [layers],
  )

  const pathLen = useMemo(
    () => plotLayers.reduce((sum, l) => sum + pathLength(l.polylines), 0),
    [plotLayers],
  )
  const travelLen = useMemo(
    () => plotLayers.reduce((sum, l) => sum + penUpTravel(l.polylines), 0),
    [plotLayers],
  )

  // What produced this plot: baked into the exported SVG and used to name it.
  const settings = useMemo(
    () =>
      plotSettings({
        sourceName: source?.name,
        algorithmId,
        params,
        paperSize,
        colorMode,
        useK,
      }),
    [source, algorithmId, params, paperSize, colorMode, useK],
  )

  function handleAlgorithm(id) {
    setAlgorithmId(id)
    setParams(defaultParams(algorithmsById[id]))
  }

  function handleParam(key, value) {
    setParams((prev) => ({ ...prev, [key]: value }))
  }

  function handleChannelPen(ch, patch) {
    setChannelPens((prev) => ({ ...prev, [ch]: { ...prev[ch], ...patch } }))
  }

  function handleMonoPen(patch) {
    setMonoPen((prev) => ({ ...prev, ...patch }))
  }

  function handleExample(nextSource) {
    setAlgorithmId(SAMPLE_ALGORITHM_ID)
    setParams({ ...SAMPLE_PARAMS })
    setView('processed')
    setColorMode('cmyk')
    setUseK(true)
    setChannelPens(defaultChannelPens())
    setSource(nextSource)
  }

  return (
    <div className="app">
      <div className="app__stage">
        <header className="app__brand">◆ Nib</header>
        <CanvasStage
          source={source}
          layers={plotLayers}
          drawArea={drawArea}
          paperSize={paperSize}
          pathLen={pathLen}
          travelLen={travelLen}
          view={view}
          onView={setView}
        />
      </div>

      <aside className="app__panels">
        <SourcePanel
          source={source}
          onSource={setSource}
          onExample={handleExample}
        />
        <AlgorithmPanel algorithmId={algorithmId} onAlgorithm={handleAlgorithm} />
        <ParametersPanel
          algorithmId={algorithmId}
          params={params}
          onParam={handleParam}
          colorMode={colorMode}
        />
        <ColorPanel
          colorMode={colorMode}
          onMode={setColorMode}
          monoPen={monoPen}
          onMonoPen={handleMonoPen}
          useK={useK}
          onUseK={setUseK}
          channelPens={channelPens}
          onChannelPen={handleChannelPen}
        />
        <ExportPanel
          paper={paper}
          onPaper={setPaper}
          layers={plotLayers}
          paperSize={paperSize}
          settings={settings}
        />
      </aside>
    </div>
  )
}
