export type ZifuTheme = 'ink' | 'purple' | 'xuan'

export const THEME_STORAGE_KEY = 'zifu-theme'

export const THEME_ORDER: ZifuTheme[] = ['ink', 'purple', 'xuan']

export const THEMES: { id: ZifuTheme; name: string; hint: string; swatch: string }[] = [
  { id: 'ink', name: '墨青', hint: '深墨青底 · 绢米', swatch: '#0B3B39' },
  { id: 'purple', name: '紫檀', hint: '紫檀夜色 · 绢米', swatch: '#241537' },
  { id: 'xuan', name: '玄墨', hint: '玄墨如夜 · 绢米', swatch: '#101418' },
]

export function getTheme(): ZifuTheme {
  try {
    const t = localStorage.getItem(THEME_STORAGE_KEY)
    if (t === 'ink' || t === 'purple' || t === 'xuan') return t
  } catch {
    /* ignore */
  }
  return 'ink'
}

export function applyTheme(theme: ZifuTheme) {
  document.documentElement.setAttribute('data-theme', theme)
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    /* ignore */
  }
}

export function nextTheme(current: ZifuTheme): ZifuTheme {
  const i = THEME_ORDER.indexOf(current)
  return THEME_ORDER[(i + 1) % THEME_ORDER.length]
}
