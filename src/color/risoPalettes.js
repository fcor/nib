export const DEFAULT_RISO_PALETTE_ID = 'blue-pink'
export const CUSTOM_RISO_PALETTE_ID = 'custom'

export const RISO_PALETTES = [
  {
    id: DEFAULT_RISO_PALETTE_ID,
    name: 'Blue + Fluorescent Pink',
    inks: [
      { name: 'Blue', color: '#0078BF' },
      { name: 'Fluorescent Pink', color: '#FF48B0' },
    ],
  },
  {
    id: 'teal-scarlet',
    name: 'Teal + Scarlet',
    inks: [
      { name: 'Teal', color: '#00838A' },
      { name: 'Scarlet', color: '#F65058' },
    ],
  },
  {
    id: 'sunflower-federal-blue',
    name: 'Sunflower + Federal Blue',
    inks: [
      { name: 'Sunflower', color: '#FFB511' },
      { name: 'Federal Blue', color: '#3D5588' },
    ],
  },
  {
    id: 'black-bright-red',
    name: 'Black + Bright Red',
    inks: [
      { name: 'Black', color: '#1A1A1A' },
      { name: 'Bright Red', color: '#FF665E' },
    ],
  },
]

export function risoPaletteById(id) {
  return RISO_PALETTES.find((palette) => palette.id === id) || RISO_PALETTES[0]
}

export function risoPensForPalette(id = DEFAULT_RISO_PALETTE_ID) {
  return risoPaletteById(id).inks.map((ink, index) => ({
    id: `spot-${index + 1}`,
    name: ink.name,
    color: ink.color,
    visible: true,
  }))
}
