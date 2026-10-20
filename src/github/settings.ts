export interface RepoSettings {
  owner: string
  repo: string
  branch: string
  token: string
}

export const DEFAULT_SETTINGS: RepoSettings = {
  owner: 'TomMaspero',
  repo: 'atlantida-contenido',
  branch: 'main',
  token: '',
}

const KEY = 'studytool.repo'

// El token queda solo en este dispositivo; nunca sale del navegador salvo hacia api.github.com.
export function loadSettings(): RepoSettings | null {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : null
  } catch {
    return null
  }
}

export function saveSettings(settings: RepoSettings): void {
  localStorage.setItem(KEY, JSON.stringify(settings))
}

export function clearSettings(): void {
  localStorage.removeItem(KEY)
}
