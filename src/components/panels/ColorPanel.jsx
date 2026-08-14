import { useEffect, useState } from 'react'
import Panel from './Panel.jsx'
import Toggle from '../controls/Toggle.jsx'
import SegmentedControl from '../controls/SegmentedControl.jsx'
import Select from '../controls/Select.jsx'
import {
  CUSTOM_RISO_PALETTE_ID,
  RISO_PALETTES,
} from '../../color/risoPalettes.js'

const HEX = /^#[0-9a-f]{6}$/i

/**
 * Hex field that lets you type freely. The value only reaches state once it
 * parses, so a half-typed "#00" never blanks the layer.
 */
function HexField({ value, onChange, label }) {
  const [draft, setDraft] = useState(value)
  useEffect(() => setDraft(value), [value])

  return (
    <input
      className="penrow__hex"
      type="text"
      value={draft}
      maxLength={7}
      spellCheck={false}
      autoComplete="off"
      aria-label={label}
      onChange={(e) => {
        const next = e.target.value.toUpperCase()
        setDraft(next)
        if (HEX.test(next)) onChange(next)
      }}
      onBlur={() => setDraft(value)}
    />
  )
}

/**
 * Two drawn states rather than one shape plus a slash. Closing moves the open
 * eye down as it fades while the shut lid arrives from above, so it reads as a
 * lid coming down rather than a crossfade.
 */
function EyeIcon() {
  return (
    <svg className="eye" viewBox="0 0 20 20" aria-hidden="true">
      <g className="eye__open">
        <path d="M1.5 10C4 5.5 7 3.5 10 3.5s6 2 8.5 6.5c-2.5 4.5-5.5 6.5-8.5 6.5S4 14.5 1.5 10Z" />
        <circle className="eye__iris" cx="10" cy="10" r="3.25" />
      </g>
      <g className="eye__closed">
        <path d="M2.5 9.5Q10 14.5 17.5 9.5" />
        <path d="M6.25 11.4 5.3 13.2" />
        <path d="M10 12 10 14.1" />
        <path d="M13.75 11.4 14.7 13.2" />
      </g>
    </svg>
  )
}

/**
 * `disabled` and hidden are different states and must not look alike.
 *
 * Hidden — the layer exists and is configured, you're just not drawing it.
 * Full strength throughout; the closed eye is the whole signal.
 *
 * Disabled — the channel isn't in the separation at all, so there's no layer
 * to show or hide and the eye is dropped entirely. The frame ghosts to
 * `--rule` and the swatch hatches over, print-convention style for "no plate".
 */
function PenRow({ letter, pen, onChange, disabled = false, label }) {
  const name = label || (letter ? `${letter} channel` : 'Pen')

  return (
    <div
      className={
        'penrow' +
        (letter ? '' : ' penrow--nochannel') +
        (disabled ? ' penrow--disabled' : '')
      }
      aria-disabled={disabled || undefined}
    >
      {letter ? <span className="penrow__channel">{letter}</span> : null}

      <div className="penrow__field">
        {disabled ? (
          <span className="penrow__picker penrow__picker--none" aria-hidden="true" />
        ) : (
          <input
            className="penrow__picker"
            type="color"
            value={pen.color}
            aria-label={`${name} colour`}
            onChange={(e) => onChange({ color: e.target.value.toUpperCase() })}
          />
        )}

        {disabled ? (
          <span className="penrow__hex penrow__hex--static">{pen.color}</span>
        ) : (
          <HexField
            value={pen.color}
            label={`${name} hex`}
            onChange={(color) => onChange({ color })}
          />
        )}
      </div>

      {disabled ? null : (
        <button
          type="button"
          className={'penrow__eye' + (pen.visible ? '' : ' penrow__eye--off')}
          aria-pressed={pen.visible}
          aria-label={`${pen.visible ? 'Hide' : 'Show'} ${name}`}
          title={pen.visible ? 'Hide layer' : 'Show layer'}
          onClick={() => onChange({ visible: !pen.visible })}
        >
          <EyeIcon />
        </button>
      )}
    </div>
  )
}

export default function ColorPanel({
  colorMode,
  onMode,
  monoPen,
  onMonoPen,
  useK,
  onUseK,
  channelPens,
  onChannelPen,
  risoPaletteId,
  onRisoPalette,
  risoPens,
  onRisoPen,
}) {
  const paletteOptions = RISO_PALETTES.map((palette) => ({
    value: palette.id,
    label: palette.name,
  }))
  if (risoPaletteId === CUSTOM_RISO_PALETTE_ID) {
    paletteOptions.push({ value: CUSTOM_RISO_PALETTE_ID, label: 'Custom' })
  }

  return (
    <Panel step={4} title="Color">
      <SegmentedControl
        value={colorMode}
        options={[
          { value: 'mono', label: 'Mono' },
          { value: 'cmyk', label: 'CMYK' },
          { value: 'riso', label: 'Riso' },
        ]}
        onChange={onMode}
      />

      {colorMode === 'mono' ? (
        <PenRow pen={monoPen} onChange={onMonoPen} />
      ) : colorMode === 'cmyk' ? (
        <>
          <PenRow letter="C" pen={channelPens.c} onChange={(p) => onChannelPen('c', p)} />
          <PenRow letter="M" pen={channelPens.m} onChange={(p) => onChannelPen('m', p)} />
          <PenRow letter="Y" pen={channelPens.y} onChange={(p) => onChannelPen('y', p)} />
          <PenRow
            letter="K"
            pen={channelPens.k}
            onChange={(p) => onChannelPen('k', p)}
            disabled={!useK}
          />
          {/* Not a visibility switch — this changes the separation itself, so
              black gets redistributed into C/M/Y rather than just going dark. */}
          <Toggle label="Black (K)" value={useK} onChange={onUseK} />
        </>
      ) : (
        <>
          <Select
            label="Palette"
            value={risoPaletteId}
            options={paletteOptions}
            onChange={onRisoPalette}
          />
          {risoPens.map((pen, index) => (
            <PenRow
              key={pen.id}
              letter={String(index + 1)}
              label={pen.name}
              pen={pen}
              onChange={(patch) => onRisoPen(index, patch)}
            />
          ))}
        </>
      )}
    </Panel>
  )
}
