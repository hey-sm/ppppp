import colors from 'tailwindcss/colors'

export const COLOR_SCALES = [
  'orange',
  'lime',
  'sky',
  'blue',
  'indigo',
  'violet',
  'slate',
  'gray',
  'stone',
  'taupe',
] as const

export type ColorScale = (typeof COLOR_SCALES)[number]

const CUSTOM_COLORS: Record<string, Record<number, string>> = {
  taupe: {
    50: '#f9f8f6',
    100: '#f2efe9',
    200: '#e1dcd1',
    300: '#cbc4b5',
    400: '#b2a795',
    500: '#9a8d7a',
    600: '#847665',
    700: '#6d6054',
    800: '#5a4f47',
    900: '#4b433d',
    950: '#272320',
  },
}

export const SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const
export const SHADES_LIGHT = [50, 100, 200, 300, 400, 500, 600]
export const SHADES_DARK = [950, 900, 800, 700, 600, 500, 400]

export function getThemeShade(baseColor: string, shade: number): string {
  if (CUSTOM_COLORS[baseColor]) return CUSTOM_COLORS[baseColor][shade] || '#ffffff'
  return (colors as any)[baseColor]?.[shade] || '#ffffff'
}
