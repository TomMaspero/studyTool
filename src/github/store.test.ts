import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { clear, createStore } from 'idb-keyval'
import { GitHubError, type GitHubApi, type TreeEntry } from './api'
import { ContentStore } from './store'

const tree: TreeEntry[] = [{ path: 'SO/Clase 1/Resumen.md', type: 'blob', sha: 'abc' }]
const offline = () => Promise.reject(new TypeError('Failed to fetch'))

function fakeApi(overrides: Partial<GitHubApi> = {}): GitHubApi {
  return {
    getTree: vi.fn(async () => tree),
    getBlob: vi.fn(async () => new TextEncoder().encode('# Resumen').buffer),
    putFile: vi.fn(async () => {}),
    ...overrides,
  }
}

beforeEach(async () => {
  for (const [db, name] of [['studytool-meta', 'meta'], ['studytool-blobs', 'blobs'], ['studytool-queue', 'queue']]) {
    await clear(createStore(db, name))
  }
})

describe('ContentStore', () => {
  it('sin conexión devuelve el último árbol guardado', async () => {
    await new ContentStore(fakeApi()).loadTree()
    const result = await new ContentStore(fakeApi({ getTree: offline })).loadTree()
    expect(result).toEqual({ tree, fromCache: true })
  })

  it('no tapa los errores de autenticación con la caché', async () => {
    await new ContentStore(fakeApi()).loadTree()
    const store = new ContentStore(fakeApi({ getTree: () => Promise.reject(new GitHubError(401, 'Bad credentials')) }))
    await expect(store.loadTree()).rejects.toBeInstanceOf(GitHubError)
  })

  it('pide cada blob una sola vez', async () => {
    const api = fakeApi()
    const store = new ContentStore(api)
    expect(await store.readText(tree[0])).toBe('# Resumen')
    expect(await store.readText(tree[0])).toBe('# Resumen')
    expect(api.getBlob).toHaveBeenCalledTimes(1)
  })

  it('las escrituras sin conexión quedan en cola y se suben en orden después', async () => {
    const write = (n: number) => ({ path: `progreso/${n}.jsonl`, content: `${n}`, message: `intento ${n}` })
    const offlineStore = new ContentStore(fakeApi({ putFile: offline }))
    expect(await offlineStore.enqueueWrite(write(1))).toBe(1)
    expect(await offlineStore.enqueueWrite(write(2))).toBe(2)

    const api = fakeApi()
    expect(await new ContentStore(api).flush()).toBe(0)
    expect(vi.mocked(api.putFile).mock.calls.map(([path]) => path)).toEqual(['progreso/1.jsonl', 'progreso/2.jsonl'])
  })
})
