import { useEffect, useState } from 'react'
import type { TreeEntry } from '../github/api'
import type { ContentStore } from '../github/store'

interface Props {
  store: ContentStore
}

type State =
  | { status: 'loading' }
  | { status: 'ready'; tree: TreeEntry[]; fromCache: boolean }
  | { status: 'error'; message: string }

// Agrupa los resúmenes por carpeta de primer nivel (una por materia).
function summariesBySubject(tree: TreeEntry[]): [string, number][] {
  const counts = new Map<string, number>()
  for (const entry of tree) {
    if (entry.type !== 'blob' || !entry.path.endsWith('.md') || !entry.path.includes('/')) continue
    const subject = entry.path.split('/')[0]
    counts.set(subject, (counts.get(subject) ?? 0) + 1)
  }
  return [...counts].sort(([a], [b]) => a.localeCompare(b))
}

function Home({ store }: Props) {
  const [state, setState] = useState<State>({ status: 'loading' })

  useEffect(() => {
    let active = true
    store
      .loadTree()
      .then(({ tree, fromCache }) => active && setState({ status: 'ready', tree, fromCache }))
      .catch((e: unknown) => active && setState({ status: 'error', message: String(e) }))
    return () => {
      active = false
    }
  }, [store])

  if (state.status === 'loading') return <p>Cargando…</p>
  if (state.status === 'error') return <p className="error">No se pudo cargar el contenido: {state.message}</p>

  return (
    <section>
      {state.fromCache && <p className="hint">Sin conexión: mostrando la última copia guardada.</p>}
      <h2>Materias</h2>
      <ul className="subjects">
        {summariesBySubject(state.tree).map(([subject, count]) => (
          <li key={subject}>
            {subject} <span className="hint">{count} resúmenes</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default Home
