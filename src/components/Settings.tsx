import { useState, type FormEvent } from 'react'
import { createApi, GitHubError } from '../github/api'
import { DEFAULT_SETTINGS, type RepoSettings } from '../github/settings'

interface Props {
  initial: RepoSettings | null
  onSave: (settings: RepoSettings) => void
  onCancel?: () => void
}

const TOKEN_URL = 'https://github.com/settings/personal-access-tokens/new'

function Settings({ initial, onSave, onCancel }: Props) {
  const [form, setForm] = useState<RepoSettings>(initial ?? DEFAULT_SETTINGS)
  const [error, setError] = useState<string | null>(null)
  const [testing, setTesting] = useState(false)

  const field = (key: keyof RepoSettings) => ({
    value: form[key],
    onChange: (e: { target: { value: string } }) => setForm({ ...form, [key]: e.target.value.trim() }),
  })

  async function submit(e: FormEvent) {
    e.preventDefault()
    setTesting(true)
    setError(null)
    try {
      await createApi(form).getTree()
      onSave(form)
    } catch (err) {
      setError(
        err instanceof GitHubError && (err.status === 401 || err.status === 404)
          ? 'No se pudo acceder al repo: revisá el nombre, la rama y que el token tenga acceso.'
          : 'No hay conexión con GitHub.',
      )
    } finally {
      setTesting(false)
    }
  }

  return (
    <form className="settings" onSubmit={submit}>
      <h2>Repo de contenido</h2>
      <label>
        Usuario <input {...field('owner')} required />
      </label>
      <label>
        Repo <input {...field('repo')} required />
      </label>
      <label>
        Rama <input {...field('branch')} required />
      </label>
      <label>
        Token <input type="password" autoComplete="off" {...field('token')} required />
      </label>
      <p className="hint">
        Creá un <a href={TOKEN_URL}>token fine-grained</a> con acceso solo a este repo y permiso{' '}
        <strong>Contents: Read and write</strong>. Queda guardado solo en este dispositivo.
      </p>
      {error && <p className="error">{error}</p>}
      <div className="actions">
        <button type="submit" disabled={testing}>
          {testing ? 'Probando…' : 'Probar y guardar'}
        </button>
        {onCancel && (
          <button type="button" className="secondary" onClick={onCancel}>
            Cancelar
          </button>
        )}
      </div>
    </form>
  )
}

export default Settings
