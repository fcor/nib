/**
 * The settings that produced a plot, as a plain serializable object.
 *
 * This is what gets baked into the exported SVG and what names the file. It is
 * deliberately self-contained — ids rather than object references, no image
 * data — so that reading it back can restore the app to the state that made
 * the plot. See "Restore settings from an exported SVG" in BACKLOG.md.
 */

import { algorithmsById } from '../algorithms/index.js'

export const SETTINGS_NS = 'urn:nib:settings'
export const SETTINGS_VERSION = 1

/** Filename-safe fragment: lowercase, runs of anything else become one dash. */
function slug(s) {
  return String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Local-time YYYYMMDD-HHMMSS — sorts chronologically, unique per second. */
function stamp(date) {
  const p = (n) => String(n).padStart(2, '0')
  return (
    `${date.getFullYear()}${p(date.getMonth() + 1)}${p(date.getDate())}` +
    `-${p(date.getHours())}${p(date.getMinutes())}${p(date.getSeconds())}`
  )
}

/** "mm" reads better spaced; "°" and "%" sit tight against the number. */
function withUnit(value, unit) {
  if (!unit) return `${value}`
  return /^[a-z]/i.test(unit) ? `${value} ${unit}` : `${value}${unit}`
}

function sourceBase(settings) {
  return settings.source ? settings.source.replace(/\.[^.]+$/, '') : ''
}

export function plotSettings({
  sourceName,
  algorithmId,
  params,
  paperSize,
  colorMode,
  useK,
  risoPaletteId,
  risoPens = [],
}) {
  return {
    app: 'nib',
    version: SETTINGS_VERSION,
    source: sourceName || null,
    algorithm: algorithmId,
    params: { ...params },
    paper: {
      id: paperSize.value,
      name: paperSize.name,
      width: paperSize.width,
      height: paperSize.height,
    },
    // Keep mode-specific state together so a future SVG import can restore it.
    color:
      colorMode === 'cmyk'
        ? { mode: 'cmyk', useK }
        : colorMode === 'riso'
          ? {
              mode: 'riso',
              palette: risoPaletteId,
              inks: risoPens.map(({ id, name, color, visible }) => ({
                id,
                name,
                color,
                visible,
              })),
            }
          : { mode: 'mono' },
  }
}

/**
 * e.g. `portrait-crosshatch-a5-cmyk-20260809-143211.svg`
 *
 * Readable at the level that distinguishes variations (image, algorithm,
 * paper, colour mode) and unique to the second, so repeated exports never
 * collide into "portrait (1).svg". The params live in the metadata, not here.
 */
export function plotFilename(settings) {
  const base = slug(sourceBase(settings)) || 'plot'
  const date = settings.exported ? new Date(settings.exported) : new Date()
  return (
    [base, settings.algorithm, settings.paper.id, settings.color.mode, stamp(date)]
      .filter(Boolean)
      .join('-') + '.svg'
  )
}

/** Short human label for the SVG's <title>. */
export function plotTitle(settings) {
  const algo = algorithmsById[settings.algorithm]
  const name = algo ? algo.name : settings.algorithm
  return `${sourceBase(settings) || 'Plot'} — ${name} on ${settings.paper.name}`
}

/** One-line prose summary for <desc>, built from the algorithm's own labels. */
export function plotSummary(settings) {
  const algo = algorithmsById[settings.algorithm]
  const bits = [algo ? algo.name : settings.algorithm]

  bits.push(`${settings.paper.name} ${settings.paper.width}×${settings.paper.height} mm`)
  if (settings.color.mode === 'cmyk') {
    bits.push(settings.color.useK ? 'CMYK' : 'CMY')
  } else if (settings.color.mode === 'riso') {
    const inks = settings.color.inks.map((ink) => ink.name).join(' + ')
    bits.push(inks ? `Riso (${inks})` : 'Riso')
  } else {
    bits.push('Mono')
  }

  if (algo) {
    const shown = algo.params
      .map((p) => {
        const v = settings.params[p.key]
        if (v === undefined) return null
        if (p.key === 'invert' && settings.color.mode !== 'mono') return null
        // A toggle reads as its label when on, and says nothing when off.
        if (p.type === 'toggle') return v ? p.label.toLowerCase() : null
        return `${p.label.toLowerCase()} ${withUnit(v, p.unit)}`
      })
      .filter(Boolean)
    if (shown.length) bits.push(shown.join(', '))
  }

  return bits.join(' · ')
}
