import { useState } from 'react'
import { MATERIAS, TIPOS_EVENTO } from '../data/materias'
import { useStore } from '../lib/store'
import { Modal } from './ui'

export default function EventoForm({ evento, fechaInicial, fechaFinInicial, materiaInicial, tipoInicial, onClose }) {
  const { guardarEvento, borrarEvento } = useStore()
  const [f, setF] = useState(() => ({ titulo: '', materia: materiaInicial || '', fecha: fechaInicial || '', fechaFin: fechaFinInicial || '', tipo: tipoInicial || (materiaInicial ? 'examen' : 'institucional'), tentativo: false, nota: '', ...evento }))
  const [error, setError] = useState('')
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }))

  function submit(e) {
    e.preventDefault()
    if (!f.titulo.trim() || !f.fecha) return setError('Título y fecha son obligatorios')
    if (f.fechaFin && f.fechaFin < f.fecha) return setError('La fecha fin no puede ser anterior')
    guardarEvento({ ...f, titulo: f.titulo.trim(), materia: f.materia || null, fechaFin: f.fechaFin || null })
    onClose()
  }

  return (
    <Modal titulo={evento ? 'Editar fecha' : 'Nueva fecha importante'} onClose={onClose}>
      <form className="form" onSubmit={submit}>
        <label>
          Título
          <input autoFocus value={f.titulo} onChange={set('titulo')} placeholder='Ej: "Parcial 2 de TLP" o "Semana de recuperación"' />
        </label>
        <div className="row2">
          <label>
            Tipo
            <select value={f.tipo} onChange={set('tipo')}>
              {Object.entries(TIPOS_EVENTO).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </label>
          <label>
            Pertenece a
            <select value={f.materia || ''} onChange={set('materia')}>
              <option value="">General (toda la carrera)</option>
              {MATERIAS.map((m) => (
                <option key={m.id} value={m.id}>{m.corto}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="row2">
          <label>
            Fecha
            <input type="date" value={f.fecha} onChange={set('fecha')} />
          </label>
          <label>
            Hasta (si dura varios días)
            <input type="date" value={f.fechaFin || ''} onChange={set('fechaFin')} />
          </label>
        </div>
        <label>
          Nota
          <textarea rows={2} value={f.nota || ''} onChange={set('nota')} placeholder="Temas, aula, horario…" />
        </label>
        <label className="check">
          <input type="checkbox" checked={!!f.tentativo} onChange={(e) => setF((x) => ({ ...x, tentativo: e.target.checked }))} />
          Fecha a confirmar
        </label>
        {error && <p className="error">{error}</p>}
        <div className="form-actions">
          {evento && (
            <button type="button" className="btn btn-danger" onClick={() => confirm('¿Borrar esta fecha?') && (borrarEvento(evento.id), onClose())}>
              Borrar
            </button>
          )}
          <span className="spacer" />
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary">Guardar</button>
        </div>
      </form>
    </Modal>
  )
}
