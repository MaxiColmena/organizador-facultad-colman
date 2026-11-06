import { useState } from 'react'
import { MATERIAS, TIPOS_EVENTO, materiaById } from '../data/materias'
import { useStore } from '../lib/store'
import { MESES_LARGO, fmtFecha, inRange, parseISO, toISO, todayISO } from '../lib/dates'
import { Icon, Modal } from './ui'

export const IMPORTANCIA = {
  baja: { label: 'Baja', icono: '○', color: '#38bdf8' },
  media: { label: 'Media', icono: '◆', color: '#a78bfa' },
  alta: { label: 'Alta', icono: '⚠', color: '#f59e0b' },
  critica: { label: 'Crítica', icono: '🔥', color: '#ef4444' },
}
export const COLORES = ['#8b5cf6', '#38bdf8', '#22d3ee', '#34d399', '#f472b6', '#f59e0b', '#fb923c', '#94a3b8']

// Color con el que se pinta un evento: el elegido, o el de la materia, o celeste si es general.
export const colorEvento = (e) => e.color || materiaById(e.materia)?.color || 'var(--cyan)'
export const iconoEvento = (e) => (e.importancia && e.importancia !== 'media' ? IMPORTANCIA[e.importancia]?.icono + ' ' : '')

const SEM = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

// Paso 1: elegir día o rango en un calendario
function SelectorFechas({ a, b, onChange }) {
  const { state } = useStore()
  const base = a ? parseISO(a) : new Date()
  const [mes, setMes] = useState({ y: base.getFullYear(), m: base.getMonth() })
  const offset = (new Date(mes.y, mes.m, 1).getDay() + 6) % 7
  const dias = new Date(mes.y, mes.m + 1, 0).getDate()
  const celdas = [...Array(offset).fill(null), ...Array.from({ length: dias }, (_, i) => toISO(new Date(mes.y, mes.m, i + 1)))]
  const mover = (n) => setMes(({ y, m }) => { const d = new Date(y, m + n, 1); return { y: d.getFullYear(), m: d.getMonth() } })

  const tocar = (iso) => {
    if (!a || b) return onChange(iso, null) // empezar selección nueva
    if (iso === a) return onChange(a, null)
    return iso < a ? onChange(iso, a) : onChange(a, iso)
  }
  const ocupado = (iso) => state.eventos.some((e) => inRange(iso, e.fecha, e.fechaFin)) || state.tareas.some((t) => t.fecha === iso)

  return (
    <div className="picker">
      <div className="cal-nav">
        <button type="button" className="icon-btn" onClick={() => mover(-1)} aria-label="Mes anterior"><Icon name="left" /></button>
        <strong>{MESES_LARGO[mes.m]} {mes.y}</strong>
        <button type="button" className="icon-btn" onClick={() => mover(1)} aria-label="Mes siguiente"><Icon name="right" /></button>
      </div>
      <div className="picker-grid">
        {SEM.map((d, i) => <span key={i} className="cal-dow">{d}</span>)}
        {celdas.map((iso, i) =>
          iso ? (
            <button
              type="button"
              key={iso}
              onClick={() => tocar(iso)}
              className={[
                'picker-day',
                iso === todayISO() && 'hoy',
                a && inRange(iso, a, b || a) && 'en',
                iso === a && 'ini',
                iso === (b || a) && 'fin',
                iso < todayISO() && 'past',
              ].filter(Boolean).join(' ')}
            >
              {Number(iso.slice(8))}
              {ocupado(iso) && <i />}
            </button>
          ) : <span key={i} />,
        )}
      </div>
      <p className="picker-sel">
        {!a ? 'Tocá un día. Para un período, tocá el primer y el último día.' : b ? <>Del <strong>{fmtFecha(a)}</strong> al <strong>{fmtFecha(b)}</strong></> : <><strong>{fmtFecha(a)}</strong> · tocá otro día si dura varios</>}
      </p>
    </div>
  )
}

export default function EventoForm({ evento, fechaInicial, fechaFinInicial, materiaInicial, tipoInicial, onClose }) {
  const { guardarEvento, borrarEvento } = useStore()
  const [f, setF] = useState(() => ({
    titulo: '',
    materia: materiaInicial || '',
    fecha: fechaInicial || '',
    fechaFin: fechaFinInicial || '',
    tipo: tipoInicial || (materiaInicial ? 'examen' : 'institucional'),
    importancia: 'media',
    color: '',
    tentativo: false,
    nota: '',
    ...evento,
  }))
  const [paso, setPaso] = useState(evento || fechaInicial ? 2 : 1)
  const [error, setError] = useState('')
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }))

  function submit(e) {
    e.preventDefault()
    if (!f.titulo.trim()) return setError('Poné un título')
    guardarEvento({ ...f, titulo: f.titulo.trim(), materia: f.materia || null, fechaFin: f.fechaFin && f.fechaFin !== f.fecha ? f.fechaFin : null, color: f.color || null })
    onClose()
  }

  if (paso === 1)
    return (
      <Modal titulo="¿Qué día?" onClose={onClose}>
        <SelectorFechas a={f.fecha} b={f.fechaFin} onChange={(a, b) => setF((x) => ({ ...x, fecha: a, fechaFin: b || '', tipo: b && !evento ? 'periodo' : x.tipo }))} />
        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button type="button" className="btn btn-primary" disabled={!f.fecha} onClick={() => setPaso(2)}>Continuar <Icon name="right" size={16} /></button>
        </div>
      </Modal>
    )

  const previewColor = f.color || materiaById(f.materia)?.color || '#38bdf8'

  return (
    <Modal titulo={evento ? 'Editar evento' : 'Nuevo evento'} onClose={onClose}>
      <form className="form" onSubmit={submit}>
        <button type="button" className="fecha-elegida" onClick={() => setPaso(1)} style={{ '--c': previewColor }}>
          <Icon name="cal" size={16} />
          <span>{f.fechaFin && f.fechaFin !== f.fecha ? `${fmtFecha(f.fecha)} → ${fmtFecha(f.fechaFin)}` : fmtFecha(f.fecha)}</span>
          <small>cambiar</small>
        </button>

        <label>
          Título
          <input autoFocus value={f.titulo} onChange={set('titulo')} placeholder='Ej: "Parcial 2 de TLP" o "Semana de recuperación"' />
        </label>
        <label>
          Descripción
          <textarea rows={2} value={f.nota || ''} onChange={set('nota')} placeholder="Temas, aula, horario, qué llevar…" />
        </label>
        <div className="row2">
          <label>
            Pertenece a
            <select value={f.materia || ''} onChange={set('materia')}>
              <option value="">General (toda la carrera)</option>
              {MATERIAS.map((m) => <option key={m.id} value={m.id}>{m.corto}</option>)}
            </select>
          </label>
          <label>
            Tipo
            <select value={f.tipo} onChange={set('tipo')}>
              {Object.entries(TIPOS_EVENTO).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
        </div>

        <div className="campo">
          <span className="campo-label">Importancia</span>
          <div className="importancia">
            {Object.entries(IMPORTANCIA).map(([k, v]) => (
              <button type="button" key={k} className={f.importancia === k ? 'on' : ''} style={{ '--c': v.color }} onClick={() => setF((x) => ({ ...x, importancia: k }))}>
                <span className="imp-icon">{v.icono}</span> {v.label}
              </button>
            ))}
          </div>
        </div>

        <div className="campo">
          <span className="campo-label">Color</span>
          <div className="swatches">
            <button type="button" className={`swatch auto ${!f.color ? 'on' : ''}`} onClick={() => setF((x) => ({ ...x, color: '' }))} title="Automático (color de la materia)">A</button>
            {COLORES.map((c) => (
              <button type="button" key={c} className={`swatch ${f.color === c ? 'on' : ''}`} style={{ background: c }} onClick={() => setF((x) => ({ ...x, color: c }))} aria-label={`Color ${c}`} />
            ))}
          </div>
        </div>

        <label className="check">
          <input type="checkbox" checked={!!f.tentativo} onChange={(e) => setF((x) => ({ ...x, tentativo: e.target.checked }))} />
          Fecha a confirmar
        </label>
        {error && <p className="error">{error}</p>}
        <div className="form-actions">
          {evento && (
            <button type="button" className="btn btn-danger" onClick={() => confirm('¿Borrar este evento?') && (borrarEvento(evento.id), onClose())}>Borrar</button>
          )}
          <span className="spacer" />
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary">Guardar</button>
        </div>
      </form>
    </Modal>
  )
}
