import { useState } from 'react'
import { GRADUACION, HORARIO, TIPOS_EVENTO, materiaById } from '../data/materias'
import { useStore } from '../lib/store'
import { MESES_LARGO, fmtFecha, inRange, toISO, todayISO } from '../lib/dates'
import { Icon, MateriaTag, Vacio } from './ui'
import TareaItem from './TareaItem'

const SEM = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

export default function Calendario({ abrirTarea, abrirEvento }) {
  const { state } = useStore()
  const hoy = new Date()
  const [mes, setMes] = useState({ y: hoy.getFullYear(), m: hoy.getMonth() })
  const [sel, setSel] = useState(todayISO())

  const primero = new Date(mes.y, mes.m, 1)
  const offset = (primero.getDay() + 6) % 7 // lunes primero
  const diasMes = new Date(mes.y, mes.m + 1, 0).getDate()
  const celdas = []
  for (let i = 0; i < offset; i++) celdas.push(null)
  for (let d = 1; d <= diasMes; d++) celdas.push(toISO(new Date(mes.y, mes.m, d)))
  while (celdas.length % 7) celdas.push(null)

  const itemsDe = (iso) => [
    ...state.eventos.filter((e) => inRange(iso, e.fecha, e.fechaFin)).map((e) => ({ ...e, clase: 'evento' })),
    ...state.tareas.filter((t) => t.fecha === iso).map((t) => ({ ...t, clase: 'tarea' })),
  ]
  const mover = (n) => setMes(({ y, m }) => { const d = new Date(y, m + n, 1); return { y: d.getFullYear(), m: d.getMonth() } })

  const selEventos = state.eventos.filter((e) => inRange(sel, e.fecha, e.fechaFin))
  const selTareas = state.tareas.filter((t) => t.fecha === sel)
  const dow = new Date(sel + 'T12:00').getDay()
  const selClases = HORARIO.filter((h) => h.dia === dow)

  return (
    <div className="page">
      <div className="page-head">
        <h1>Calendario</h1>
        <div className="row-gap">
          <button className="btn btn-ghost" onClick={() => abrirEvento(null, { fecha: sel })}><Icon name="cal" size={16} /> Fecha</button>
          <button className="btn btn-primary" onClick={() => abrirTarea(null, { fecha: sel })}><Icon name="plus" size={16} /> Tarea</button>
        </div>
      </div>

      <div className="cal-layout">
        <section className="card cal">
          <div className="cal-nav">
            <button className="icon-btn" onClick={() => mover(-1)} aria-label="Mes anterior"><Icon name="left" /></button>
            <h3>{MESES_LARGO[mes.m]} {mes.y}</h3>
            <button className="icon-btn" onClick={() => mover(1)} aria-label="Mes siguiente"><Icon name="right" /></button>
          </div>
          <div className="cal-grid">
            {SEM.map((d) => <div key={d} className="cal-dow">{d}</div>)}
            {celdas.map((iso, i) => {
              if (!iso) return <div key={i} className="cal-cell empty" />
              const its = itemsDe(iso)
              const grad = inRange(iso, GRADUACION.inicio, GRADUACION.fin)
              return (
                <button key={iso} className={`cal-cell ${iso === todayISO() ? 'today' : ''} ${iso === sel ? 'sel' : ''} ${grad ? 'grad' : ''} ${iso < todayISO() ? 'past' : ''}`} onClick={() => setSel(iso)}>
                  <span className="cal-num">{Number(iso.slice(8))}</span>
                  <div className="cal-items">
                    {its.slice(0, 3).map((it) => {
                      const c = materiaById(it.materia)?.color || 'var(--accent)'
                      const done = it.estado === 'completada' || it.hecho
                      return <span key={it.id} className={`cal-chip ${it.clase} ${done ? 'done' : ''}`} style={{ '--c': c }}>{it.titulo}</span>
                    })}
                    {its.length > 3 && <span className="cal-more">+{its.length - 3}</span>}
                  </div>
                  <span className="cal-dots">{its.slice(0, 4).map((it) => <i key={it.id} style={{ background: materiaById(it.materia)?.color || 'var(--accent)' }} />)}</span>
                </button>
              )
            })}
          </div>
        </section>

        <section className="card">
          <h3 className="cap">{fmtFecha(sel)}</h3>
          {selEventos.length + selTareas.length === 0 && <Vacio>Nada anotado este día.</Vacio>}
          {selEventos.length > 0 && (
            <ul className="lista">
              {selEventos.map((e) => (
                <li key={e.id} className={`evento ${e.hecho ? 'done' : ''}`} onClick={() => abrirEvento(e)}>
                  <Icon name="alert" size={16} />
                  <div>
                    <div className="li-title">{e.titulo}{e.tentativo && <em> (a confirmar)</em>}</div>
                    <div className="li-meta"><MateriaTag id={e.materia} /> <span className="muted small">{TIPOS_EVENTO[e.tipo]}</span></div>
                    {e.nota && <p className="muted small">{e.nota}</p>}
                  </div>
                </li>
              ))}
            </ul>
          )}
          {selTareas.length > 0 && <ul className="tareas">{selTareas.map((t) => <TareaItem key={t.id} t={t} onEdit={abrirTarea} />)}</ul>}
          {selClases.length > 0 && (
            <>
              <h4 className="muted small up">Clases</h4>
              <ul className="lista">
                {selClases.map((h, i) => <li key={i} className="clase" style={{ '--c': materiaById(h.materia).color }}><span className="hora">{h.inicio}–{h.fin}</span> {materiaById(h.materia).corto}</li>)}
              </ul>
            </>
          )}
        </section>
      </div>
    </div>
  )
}
