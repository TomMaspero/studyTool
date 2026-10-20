import { useEffect, useMemo, useState } from 'react'
import Home from './components/Home'
import Settings from './components/Settings'
import { createApi } from './github/api'
import { loadSettings, saveSettings, type RepoSettings } from './github/settings'
import { ContentStore } from './github/store'

function useOnline(): boolean {
  const [online, setOnline] = useState(navigator.onLine)
  useEffect(() => {
    const update = () => setOnline(navigator.onLine)
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
    return () => {
      window.removeEventListener('online', update)
      window.removeEventListener('offline', update)
    }
  }, [])
  return online
}

function App() {
  const [settings, setSettings] = useState<RepoSettings | null>(loadSettings)
  const [editing, setEditing] = useState(false)
  const [pending, setPending] = useState(0)
  const online = useOnline()
  const store = useMemo(() => (settings ? new ContentStore(createApi(settings)) : null), [settings])

  // Al recuperar la conexión se suben las escrituras que quedaron en cola.
  useEffect(() => {
    if (!store) return
    const sync = online ? store.flush() : store.pendingCount()
    sync.then(setPending).catch(() => store.pendingCount().then(setPending))
  }, [store, online])

  function save(next: RepoSettings) {
    saveSettings(next)
    setSettings(next)
    setEditing(false)
  }

  return (
    <main>
      <header className="topbar">
        <h1>studyTool</h1>
        <span className="hint">
          {online ? 'En línea' : 'Sin conexión'}
          {pending > 0 && ` · ${pending} cambios sin subir`}
        </span>
        {settings && !editing && (
          <button type="button" className="secondary" onClick={() => setEditing(true)}>
            Configuración
          </button>
        )}
      </header>
      {!settings || editing ? (
        <Settings initial={settings} onSave={save} onCancel={settings ? () => setEditing(false) : undefined} />
      ) : (
        store && <Home store={store} />
      )}
    </main>
  )
}

export default App
