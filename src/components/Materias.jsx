import { useState } from 'react'
import confetti from 'canvas-confetti'
import { DIAS, HORARIO, MATERIAS, TIPOS_EVENTO, materiaById } from '../data/materias'
import { useStore } from '../lib/store'
import { todayISO } from '../lib/dates'
import { Fecha, Icon, Modal, Progreso, Vacio } from './ui'
import TareaItem from './TareaItem'
import Documentacion from './Documentacion'

const ESTADOS = { cursando: 'Cursando', regular: 'En riesgo' }

export function lanzarConfeti() {
  const colores = ['#8b5cf6', '#38bdf8', '#22c55e', '#a78bfa', '#f0abfc']
  const fin = Date.now() + 1200
  confetti({ particleCount: 140, spread: 90, origin: { y: 0.65 }, colors: colores })
  ;(function frame() {
    confetti({ particleCount: 4, angle: 60, spread: 60, origin: { x: 0 }, colors: colores })
    confetti({ particleCount: 4, angle: 120, spread: 60, origin: { x: 1 }, colors: colores })
    if (Date.now() < fin) requestAnimationFrame(frame)
  })()
}

// Botón "Aprobada" + cartel de felicitaciones. Se usa en la lista y en el detalle.
export function useAprobar() {
  const { state, aprobarMateria } = useStore()
  const [festejo, setFestejo] = useState(null)
  const aprobar = (id) => {
    aprobarMateria(id, true)
    const aprobadas = MATERIAS.filter((m) => m.id === id || state.materiasMeta[m.id]?.estado === 'aprobada').length
    setFestejo({ materia: materiaById(id), faltan: MATERIAS.length - aprobadas })
    lanzarConfeti()
  }
  const cartel = festejo && (
    <Modal titulo="🎉 ¡Felicidades!" onClose={() => setFestejo(null)}>
      <div className="festejo">
        <p className="festejo-materia">Aprobaste <strong>{festejo.materia.nombre}</strong></p>
        {festejo.faltan > 0 ? (
          <p className="festejo-num">
            Solo te {festejo.faltan === 1 ? 'falta' : 'faltan'} <strong>{festejo.faltan}</strong> {festejo.faltan === 1 ? 'materia' : 'materias'} para recibirte
          </p>
        ) : (
          <p className="festejo-num">¡Aprobaste las 8! Solo queda la <strong>defensa pública</strong> 🎓</p>
        )}
        <Progreso valor={MATERIAS.length - festejo.faltan} total={MATERIAS.length} color="var(--ok)" />
        <button className="btn btn-primary" onClick={() => setFestejo(null)}>¡Vamos!</button>
      </div>
    </Modal>
  )
  return { aprobar, cartel }
}

export function MateriaAprobada({ m, onRevertir }) {
  return (
    <article className="materia-aprobada">
      <span className="checkbox on"><Icon name="check" size={14} /></span>
      <div className="grow">
        <div className="ma-title">{m.nombre}</div>
        <div className="muted small">Aprobada</div>
      </div>
      <button className="btn btn-ghost btn-sm" onClick={onRevertir} title="Volver a cursando">Revertir</button>
    </article>
  )
}

export default function Materias({ seleccion, setSeleccion, abrirTarea, abrirEvento }) {
  const { state, aprobarMateria } = useStore()
  const { aprobar, cartel } = useAprobar()
  const esAprobada = (id) => state.materiasMeta[id]?.estado === 'aprobada'

  if (seleccion && !esAprobada(seleccion))
    return (
      <>
        <Detalle id={seleccion} volver={() => setSeleccion(null)} abrirTarea={abrirTarea} abrirEvento={abrirEvento} aprobar={aprobar} />
        {cartel}
      </>
    )

  const cursando = MATERIAS.filter((m) => !esAprobada(m.id))
  const aprobadas = MATERIAS.filter((m) => esAprobada(m.id))
  const revertir = (m) => confirm(`¿Volver "${m.corto}" a cursando?`) && aprobarMateria(m.id, false)

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Materias</h1>
          <p className="muted">{aprobadas.length}/8 aprobadas · {cursando.length > 0 ? `faltan ${cursando.length}` : 'solo queda la defensa 🎓'}</p>
        </div>
      </div>
      <Progreso valor={aprobadas.length} total={8} color="var(--ok)" />

      {cursando.length > 0 && (
        <div className="materias-grid">
          {cursando.map((m) => {
            const ts = state.tareas.filter((t) => t.materia === m.id)
            const ok = ts.filter((t) => t.estado === 'completada').length
            const meta = state.materiasMeta[m.id] || {}
            const prox = state.eventos
              .filter((e) => e.materia === m.id && !e.hecho && (e.fechaFin || e.fecha) >= todayISO())
              .sort((a, b) => a.fecha.localeCompare(b.fecha))[0]
            return (
              <article key={m.id} className="materia-card" style={{ '--c': m.color }} onClick={() => setSeleccion(m.id)}>
                <div className="mc-top">
                  <span className={`pill pill-${meta.estado || 'cursando'}`}>{ESTADOS[meta.estado] || 'Cursando'}</span>
                  <span className="muted small">{ok}/{ts.length} tareas{meta.docs?.length ? ` · ${meta.docs.length} docs` : ''}</span>
                </div>
                <h3>{m.nombre}</h3>
                <p className="muted small">{meta.evaluacion || m.evaluacion}</p>
                {prox && <div className="mc-prox"><Fecha fecha={prox.fecha} fechaFin={prox.fechaFin} /> <span>{prox.titulo}</span></div>}
                <Progreso valor={ok} total={ts.length} color={m.color} />
                <div className="mc-actions" onClick={(e) => e.stopPropagation()}>
                  <button className="btn btn-ghost btn-sm" onClick={() => abrirTarea(null, { materia: m.id })}><Icon name="plus" size={14} /> Tarea</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => abrirEvento(null, { materia: m.id })}><Icon name="cal" size={14} /> Fecha</button>
                  <button className="btn btn-ok btn-sm push-right" onClick={() => aprobar(m.id)}><Icon name="check" size={14} /> Aprobada</button>
                </div>
              </article>
            )
          })}
        </div>
      )}

      {aprobadas.length > 0 && (
        <section className="aprobadas">
          <h3 className="muted small up">Aprobadas</h3>
          <div className="aprobadas-list">
            {aprobadas.map((m) => <MateriaAprobada key={m.id} m={m} onRevertir={() => revertir(m)} />)}
          </div>
        </section>
      )}
      {cartel}
    </div>
  )
}

function Detalle({ id, volver, abrirTarea, abrirEvento, aprobar }) {
  const { state, guardarMeta, toggleEvento } = useStore()
  const m = materiaById(id)
  const meta = state.materiasMeta[id] || {}
  const ts = state.tareas
    .filter((t) => t.materia === id)
    .sort((a, b) => (a.estado === b.estado ? (a.fecha || '9').localeCompare(b.fecha || '9') : a.estado === 'completada' ? 1 : -1))
  const ok = ts.filter((t) => t.estado === 'completada').length
  const evs = state.eventos.filter((e) => e.materia === id).sort((a, b) => a.fecha.localeCompare(b.fecha))
  const horas = HORARIO.filter((h) => h.materia === id)

  return (
    <div className="page" style={{ '--c': m.color }}>
      <button className="link back" onClick={volver}><Icon name="left" size={16} /> Materias</button>
      <div className="detalle-head">
        <i className="bar" />
        <div className="grow">
          <h1>{m.nombre}</h1>
          <p className="muted">{horas.map((h) => `${DIAS[h.dia]} ${h.inicio}–${h.fin}`).join(' · ')}</p>
        </div>
        <button className="btn btn-ok" onClick={() => aprobar(id)}><Icon name="check" size={16} /> Aprobada</button>
      </div>

      <div className="grid-2">
        <section className="card">
          <h3>Situación</h3>
          <div className="form">
            <div className="row2">
              <label>
                Estado
                <select value={meta.estado || 'cursando'} onChange={(e) => guardarMeta(id, { estado: e.target.value })}>
                  {Object.entries(ESTADOS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </label>
              <label>
                Asistencia %
                <input type="number" min="0" max="100" value={meta.asistencia ?? ''} placeholder="—" onChange={(e) => guardarMeta(id, { asistencia: e.target.value })} />
              </label>
            </div>
            <label>
              Forma de evaluación
              <input value={meta.evaluacion ?? m.evaluacion} onChange={(e) => guardarMeta(id, { evaluacion: e.target.value })} />
            </label>
            <label>
              Notas / requisitos
              <textarea rows={3} value={meta.notas || ''} placeholder="Notas de parciales, lo que pide el profe, etc." onChange={(e) => guardarMeta(id, { notas: e.target.value })} />
            </label>
          </div>
        </section>

        <section className="card">
          <div className="card-head">
            <h3>Fechas</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => abrirEvento(null, { materia: id })}><Icon name="plus" size={14} /> Fecha</button>
          </div>
          {evs.length === 0 ? <Vacio>Sin fechas.</Vacio> : (
            <ul className="lista">
              {evs.map((e) => (
                <li key={e.id} className={`evento ${e.hecho ? 'done' : ''}`}>
                  <button className={`checkbox ${e.hecho ? 'on' : ''}`} onClick={() => toggleEvento(e.id)} aria-label="Marcar rendido">{e.hecho && <Icon name="check" size={14} />}</button>
                  <div onClick={() => abrirEvento(e)} className="grow">
                    <div className="li-title">{e.titulo}{e.tentativo && <em> (a confirmar)</em>}</div>
                    <div className="li-meta"><span className="muted small">{TIPOS_EVENTO[e.tipo]}</span> <Fecha fecha={e.fecha} fechaFin={e.fechaFin} /></div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <Documentacion materia={id} />

      <section className="card">
        <div className="card-head">
          <h3>Tareas <span className="muted small">{ok}/{ts.length}</span></h3>
          <button className="btn btn-primary btn-sm" onClick={() => abrirTarea(null, { materia: id })}><Icon name="plus" size={14} /> Nueva tarea</button>
        </div>
        <Progreso valor={ok} total={ts.length} color={m.color} />
        {ts.length === 0 ? <Vacio>Todavía no cargaste tareas para esta materia.</Vacio> : (
          <ul className="tareas">{ts.map((t) => <TareaItem key={t.id} t={t} onEdit={abrirTarea} mostrarMateria={false} />)}</ul>
        )}
      </section>
    </div>
  )
}
