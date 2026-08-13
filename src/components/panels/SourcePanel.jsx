import { useRef, useState } from 'react'
import Panel from './Panel.jsx'
import sampleImageUrl from '../../assets/examples/sample.jpg'

const SAMPLE_IMAGE = {
  name: 'sample.jpg',
  label: 'Geometric study',
  url: sampleImageUrl,
}

export default function SourcePanel({ source, onSource, onExample }) {
  const inputRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)

  function loadImage({ name, url }, onLoad = onSource) {
    const img = new Image()
    img.onload = () => {
      onLoad({ name, url, width: img.width, height: img.height })
    }
    img.src = url
  }

  function loadFile(file) {
    if (!file || !file.type.startsWith('image/')) return
    loadImage({ name: file.name, url: URL.createObjectURL(file) })
  }

  return (
    <Panel step={1} title="Source">
      <div
        className={'dropzone' + (dragOver ? ' dropzone--over' : '')}
        role="button"
        tabIndex={0}
        aria-label={source ? `Source image: ${source.name}` : 'Choose an image'}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            inputRef.current?.click()
          }
        }}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          loadFile(e.dataTransfer.files[0])
        }}
      >
        {source ? (
          <img className="dropzone__thumb" src={source.url} alt={source.name} />
        ) : (
          <p className="dropzone__hint">
            Drop image here
            <br />or <span className="dropzone__browse">browse…</span>
          </p>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => loadFile(e.target.files[0])}
        />
      </div>
      {!source ? (
        <div className="source-example">
          <p className="source-example__label">Or try an example</p>
          <button
            type="button"
            className="source-example__action"
            onClick={() => loadImage(SAMPLE_IMAGE, onExample)}
          >
            <img
              className="source-example__thumb"
              src={SAMPLE_IMAGE.url}
              alt=""
            />
            <span className="source-example__copy">
              <span className="source-example__name">{SAMPLE_IMAGE.label}</span>
              <span className="source-example__command">Use example</span>
            </span>
          </button>
        </div>
      ) : null}
      {source ? (
        <p className="source__meta">
          {source.name} · {source.width}×{source.height}
        </p>
      ) : null}
    </Panel>
  )
}
