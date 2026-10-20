import type { RepoSettings } from './settings'

export class GitHubError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export interface TreeEntry {
  path: string
  type: 'blob' | 'tree'
  sha: string
  size?: number
}

export type GitHubApi = ReturnType<typeof createApi>

const encodePath = (path: string) => path.split('/').map(encodeURIComponent).join('/')

function toBase64(text: string): string {
  const bytes = new TextEncoder().encode(text)
  let binary = ''
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  }
  return btoa(binary)
}

export function createApi(settings: RepoSettings, fetchFn: typeof fetch = fetch.bind(globalThis)) {
  const base = `https://api.github.com/repos/${settings.owner}/${settings.repo}`
  const ref = encodeURIComponent(settings.branch)

  async function request(path: string, init: RequestInit = {}, accept = 'application/vnd.github+json') {
    const res = await fetchFn(base + path, {
      ...init,
      headers: {
        Accept: accept,
        Authorization: `Bearer ${settings.token}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
    })
    if (!res.ok) throw new GitHubError(res.status, `${res.status} ${await res.text()}`)
    return res
  }

  async function getFileSha(path: string): Promise<string | undefined> {
    try {
      const res = await request(`/contents/${encodePath(path)}?ref=${ref}`)
      return (await res.json()).sha
    } catch (e) {
      if (e instanceof GitHubError && e.status === 404) return undefined
      throw e
    }
  }

  return {
    async getTree(): Promise<TreeEntry[]> {
      const res = await request(`/git/trees/${ref}?recursive=1`)
      return (await res.json()).tree
    },

    // Los blobs se piden por sha: son inmutables y se pueden cachear para siempre.
    async getBlob(sha: string): Promise<ArrayBuffer> {
      const res = await request(`/git/blobs/${sha}`, {}, 'application/vnd.github.raw')
      return res.arrayBuffer()
    },

    // Crea o reemplaza un archivo con un commit en la rama configurada.
    async putFile(path: string, content: string, message: string): Promise<void> {
      const sha = await getFileSha(path)
      await request(`/contents/${encodePath(path)}`, {
        method: 'PUT',
        body: JSON.stringify({ message, content: toBase64(content), branch: settings.branch, sha }),
      })
    },
  }
}
