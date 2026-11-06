import { useState } from 'react'
import { useStore } from '../lib/store'
import { uid } from '../lib/dates'
import { guardarArchivo, abrirArchivo, fmtTamano } from '../lib/files'
import { Icon, Vacio } from './ui'

const MAX_MB = 25

// Documentación general de la materia (programa, apuntes, PDFs, links), no atada a una tarea.
export default function Documentacion({ materia }) {
  const { state, user, agregarDocMateria, quitarDocMateria } = useStore()
  const docs = state.materiasMeta[materia]?.docs || []
  const [subiendo, setSubiendo] = useState(0)
  const [error, setError] = useState('')
  const [drag, setDrag] = useState(false)
  const [link, setLink] = useState({ label: '', url: '' })

  async function subir(files) {
    setError('')
    for (const file of files) {
      if (file.size > MAX_MB * 1048576) {
        setError(`"${file.name}" supera ${MAX_MB} MB`)
        continue
      }
      setSubiendo((n) => n + 1)
      try {
        const att = { id: uid(), nombre: file.name, tamano: file.size, tipo: file.type, subido: Date.now() }
        agregarDocMateria(materia, await guardarArchivo(file, att, user?.id))
      } catch (e) {
        setError(`Error con "${file.name}": ${e.message}`)
      } finally {
        setSubiendo((n) => n - 1)
      }
    }
  }

  function agregarLink() {
    let url = link.url.trim()
    if (!url) return
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url
    agregarDocMateria(materia, { id: uid(), nombre: link.label.trim() || url, url, subido: Date.now() })
    setLink({ label: '', url: '' })
  }

  return (
    <section className="card">
      <div className="card-head">
        <h3><Icon name="file" /> Documentación de la materia <span className="muted small">{docs.length}</span></h3>
      </div>
      <label
        className={`dropzone ${drag ? 'drag' : ''}`}
        onDragOver={(e) => (e.preventDefault(), setDrag(true))}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => (e.preventDefault(), setDrag(false), subir([...e.dataTransfer.files]))}
      >
        <Icon name="plus" size={20} />
        <span>{subiendo ? `Subiendo ${subiendo} archivo(s)…` : 'Arrastrá archivos acá o tocá para elegir'}</span>
        <small className="muted">PDF, Word, PowerPoint, imágenes, zip… (máx. {MAX_MB} MB c/u)</small>
        <input type="file" multiple hidden onChange={(e) => (subir([...e.target.files]), (e.target.value = ''))} />
      </label>
      <div className="link-row">
        <input placeholder="Nombre (opcional)" value={link.label} onChange={(e) => setLink((x) => ({ ...x, label: e.target.value }))} />
        <input
          placeholder="Link (Drive, Classroom, YouTube…)"
          value={link.url}
          onChange={(e) => setLink((x) => ({ ...x, url: e.target.value }))}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), agregarLink())}
        />
        <button type="button" className="btn btn-ghost" onClick={agregarLink} aria-label="Agregar link"><Icon name="link" size={16} /></button>
      </div>
      {error && <p className="error small">{error}</p>}
      {docs.length === 0 ? <Vacio>Sin documentación todavía: programa, apuntes, consignas generales…</Vacio> : (
        <ul className="adj-list">
          {docs.map((d) => (
            <li key={d.id}>
              {d.url ? (
                <a className="adj" href={d.url} target="_blank" rel="noreferrer"><Icon name="link" size={16} /> {d.nombre}</a>
              ) : (
                <button className="adj" onClick={() => abrirArchivo(d, user?.id).catch((e) => setError(e.message))}>
                  <Icon name="file" size={16} /> {d.nombre} <small>{fmtTamano(d.tamano)}{!d.remoto ? ' · solo este dispositivo' : ''}</small>
                </button>
              )}
              <button className="icon-btn" onClick={() => confirm(`¿Quitar "${d.nombre}"?`) && quitarDocMateria(materia, d.id)} aria-label="Quitar"><Icon name="trash" size={16} /></button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
