import { useRef, useState } from 'react'
import Panel from './Panel.jsx'

export default function SourcePanel({ source, onSource }) {
  const inputRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)

  function loadFile(file) {
    if (!file || !file.type.startsWith('image/')) return
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      onSource({ name: file.name, url, width: img.width, height: img.height })
    }
    img.src = url
  }

  return (
    <Panel step={1} title="Source">
      <div
        className={'dropzone' + (dragOver ? ' dropzone--over' : '')}
        onClick={() => inputRef.current?.click()}
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
      {source ? (
        <p className="source__meta">
          {source.name} · {source.width}×{source.height}
        </p>
      ) : null}
    </Panel>
  )
}
