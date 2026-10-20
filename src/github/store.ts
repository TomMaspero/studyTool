import { createStore, del, entries, get, keys, set } from 'idb-keyval'
import { GitHubError, type GitHubApi, type TreeEntry } from './api'

export interface PendingWrite {
  path: string
  content: string
  message: string
}

const metaDb = createStore('studytool-meta', 'meta')
const blobDb = createStore('studytool-blobs', 'blobs')
const queueDb = createStore('studytool-queue', 'queue')

// fetch tira TypeError cuando no hay red; los errores HTTP (token vencido, 404) son GitHubError.
const isOffline = (e: unknown) => !(e instanceof GitHubError)

export class ContentStore {
  private readonly api: GitHubApi

  constructor(api: GitHubApi) {
    this.api = api
  }

  async loadTree(): Promise<{ tree: TreeEntry[]; fromCache: boolean }> {
    try {
      const tree = await this.api.getTree()
      await set('tree', tree, metaDb)
      return { tree, fromCache: false }
    } catch (e) {
      const cached = isOffline(e) ? await get<TreeEntry[]>('tree', metaDb) : undefined
      if (!cached) throw e
      return { tree: cached, fromCache: true }
    }
  }

  async readBytes(entry: TreeEntry): Promise<ArrayBuffer> {
    const cached = await get<ArrayBuffer>(entry.sha, blobDb)
    if (cached) return cached
    const data = await this.api.getBlob(entry.sha)
    await set(entry.sha, data, blobDb)
    return data
  }

  async readText(entry: TreeEntry): Promise<string> {
    return new TextDecoder().decode(await this.readBytes(entry))
  }

  async enqueueWrite(write: PendingWrite): Promise<number> {
    await set(`${Date.now()}-${Math.random().toString(36).slice(2)}`, write, queueDb)
    return this.flush()
  }

  async pendingCount(): Promise<number> {
    return (await keys(queueDb)).length
  }

  // Sube las escrituras en orden. Si se corta la red, las que faltan quedan para el próximo intento.
  async flush(): Promise<number> {
    const pending = (await entries<string, PendingWrite>(queueDb)).sort(([a], [b]) => a.localeCompare(b))
    for (const [key, write] of pending) {
      try {
        await this.api.putFile(write.path, write.content, write.message)
        await del(key, queueDb)
      } catch (e) {
        if (isOffline(e)) break
        throw e
      }
    }
    return this.pendingCount()
  }
}
