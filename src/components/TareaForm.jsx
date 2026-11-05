import { useState } from 'react'
import { MATERIAS } from '../data/materias'
import { useStore } from '../lib/store'
import { uid } from '../lib/dates'
import { guardarArchivo, borrarArchivo, abrirArchivo, fmtTamano } from '../lib/files'
import { Icon, Modal } from './ui'

const MAX_MB = 25

export default function TareaForm({ tarea, materiaInicial, fechaInicial, onClose }) {
  const { guardarTarea, user } = useStore()
  const [f, setF] = useState(() => ({
    titulo: '',
    materia: materiaInicial || MATERIAS[0].id,
    descripcion: '',
    fecha: fechaInicial || '',
    estado: 'pendiente',
    adjuntos: [],
    links: [],
    ...tarea,
  }))
  const [subiendo, setSubiendo] = useState(false)
  const [error, setError] = useState('')
  const [link, setLink] = useState({ label: '', url: '' })
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }))

  async function onFiles(e) {
    const files = [...e.target.files]
    e.target.value = ''
    setError('')
    setSubiendo(true)
    try {
      for (const file of files) {
        if (file.size > MAX_MB * 1048576) {
          setError(`"${file.name}" supera ${MAX_MB} MB`)
          continue
        }
        const att = { id: uid(), nombre: file.name, tamano: file.size, tipo: file.type }
        const saved = await guardarArchivo(file, att, user?.id)
        setF((x) => ({ ...x, adjuntos: [...x.adjuntos, saved] }))
      }
    } catch (err) {
      setError('Error al guardar archivo: ' + err.message)
    } finally {
      setSubiendo(false)
    }
  }

  function quitarAdjunto(a) {
    borrarArchivo(a, user?.id)
    setF((x) => ({ ...x, adjuntos: x.adjuntos.filter((y) => y.id !== a.id) }))
  }

  function agregarLink() {
    let url = link.url.trim()
    if (!url) return
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url
    setF((x) => ({ ...x, links: [...x.links, { id: uid(), label: link.label.trim() || url, url }] }))
    setLink({ label: '', url: '' })
  }

  function submit(e) {
    e.preventDefault()
    if (!f.titulo.trim()) return setError('Poné un título')
    guardarTarea({ ...f, titulo: f.titulo.trim() })
    onClose()
  }

  return (
    <Modal titulo={tarea ? 'Editar tarea' : 'Nueva tarea'} onClose={onClose}>
      <form className="form" onSubmit={submit}>
        <label>
          Título
          <input autoFocus value={f.titulo} onChange={set('titulo')} placeholder='Ej: "TP1 – API REST"' />
        </label>
        <div className="row2">
          <label>
            Materia
            <select value={f.materia} onChange={set('materia')}>
              {MATERIAS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.corto}
                </option>
              ))}
            </select>
          </label>
          <label>
            Fecha límite
            <input type="date" value={f.fecha} onChange={set('fecha')} />
          </label>
        </div>
        <label>
          Consigna / notas
          <textarea rows={3} value={f.descripcion} onChange={set('descripcion')} placeholder="Qué hay que hacer, criterios, etc." />
        </label>

        <fieldset>
          <legend>Documentación para esta tarea</legend>
          <ul className="adj-list">
            {f.adjuntos.map((a) => (
              <li key={a.id}>
                <button type="button" className="adj" onClick={() => abrirArchivo(a, user?.id).catch((e) => setError(e.message))}>
                  <Icon name="file" size={16} /> {a.nombre} <small>{fmtTamano(a.tamano)}</small>
                </button>
                <button type="button" className="icon-btn" onClick={() => quitarAdjunto(a)} aria-label="Quitar">
                  <Icon name="x" size={16} />
                </button>
              </li>
            ))}
            {f.links.map((l) => (
              <li key={l.id}>
                <a className="adj" href={l.url} target="_blank" rel="noreferrer">
                  <Icon name="link" size={16} /> {l.label}
                </a>
                <button type="button" className="icon-btn" onClick={() => setF((x) => ({ ...x, links: x.links.filter((y) => y.id !== l.id) }))} aria-label="Quitar">
                  <Icon name="x" size={16} />
                </button>
              </li>
            ))}
          </ul>
          <label className="btn btn-ghost file-btn">
            <Icon name="file" size={16} /> {subiendo ? 'Guardando…' : 'Adjuntar archivos (PDF, docx, zip, imágenes…)'}
            <input type="file" multiple onChange={onFiles} disabled={subiendo} hidden />
          </label>
          <div className="link-row">
            <input placeholder="Nombre (opcional)" value={link.label} onChange={(e) => setLink((x) => ({ ...x, label: e.target.value }))} />
            <input
              placeholder="URL (Drive, Classroom, repo…)"
              value={link.url}
              onChange={(e) => setLink((x) => ({ ...x, url: e.target.value }))}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), agregarLink())}
            />
            <button type="button" className="btn btn-ghost" onClick={agregarLink}>
              <Icon name="plus" size={16} />
            </button>
          </div>
        </fieldset>

        <label className="check">
          <input type="checkbox" checked={f.estado === 'completada'} onChange={(e) => setF((x) => ({ ...x, estado: e.target.checked ? 'completada' : 'pendiente' }))} />
          Completada
        </label>

        {error && <p className="error">{error}</p>}
        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn btn-primary" disabled={subiendo}>
            Guardar
          </button>
        </div>
      </form>
    </Modal>
  )
}
