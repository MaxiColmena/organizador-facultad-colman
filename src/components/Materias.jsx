import { useState } from 'react'
import { DIAS, HORARIO, MATERIAS, TIPOS_EVENTO, materiaById } from '../data/materias'
import { useStore } from '../lib/store'
import { todayISO } from '../lib/dates'
import { Bailarin, Fecha, Icon, Modal, Progreso, Vacio } from './ui'
import { bailar, confetiSuave, frase, lanzarConfeti, lluviaEmojis, sonidoCampanita, sonidoFanfarria, vibrar } from '../lib/fiesta'
import TareaItem from './TareaItem'
import Documentacion from './Documentacion'
import { iconoEvento } from './EventoForm'

const ESTADOS = { cursando: 'Cursando', regular: 'En riesgo' }

// Canciones según cuántas materias falten (la de 0 está en la fiesta total)
const CANCION = { 2: 'EjySxo57o8I', 1: 'ADGFuE7T8Qc' }

// Botón "Aprobada" + cartel de felicitaciones. La intensidad crece a medida que faltan menos:
// 7-3 suave · 2 medio + música · 1 fuerte + música · 0 fiesta total (Fiesta.jsx).
export function useAprobar() {
  const { state, aprobarMateria } = useStore()
  const [festejo, setFestejo] = useState(null)
  const aprobar = (id) => {
    aprobarMateria(id, true)
    const aprobadas = MATERIAS.filter((m) => m.id === id || state.materiasMeta[m.id]?.estado === 'aprobada').length
    const faltan = MATERIAS.length - aprobadas
    if (faltan === 0) return window.dispatchEvent(new Event('fiesta-total'))
    const nivel = faltan >= 3 ? 1 : faltan === 2 ? 2 : 3
    setFestejo({ materia: materiaById(id), faltan, aprobadas, frase: frase(), nivel })
    if (nivel === 1) {
      confetiSuave()
      sonidoCampanita()
      vibrar(50)
    } else {
      lanzarConfeti()
      sonidoFanfarria()
      bailar(nivel === 3 ? 2400 : 1400)
      vibrar(nivel === 3 ? [100, 50, 100, 50, 250] : [80, 40, 120])
      if (nivel === 3) setTimeout(() => lluviaEmojis(['🎉', '⭐', '💜', '🚀', '🔥'], 3), 400)
    }
  }
  const barra = (n) => '█'.repeat(n) + '░'.repeat(MATERIAS.length - n)
  const f = festejo
  const cartel = f && (
    <Modal titulo={f.nivel === 1 ? '✅' : f.nivel === 2 ? '🎉' : '🔥'} onClose={() => setFestejo(null)}>
      <div className={`festejo festejo-n${f.nivel}`}>
        <h2 className="festejo-titulo">
          {f.nivel === 1 ? '¡Aprobada!' : f.nivel === 2 ? <Bailarin texto="¡FELICIDADES!" /> : <Bailarin texto="¡ÚLTIMA RECTA!" arcoiris />}
        </h2>
        <p className="festejo-materia">Aprobaste <strong>{f.materia.nombre}</strong></p>
        <p className="festejo-num">
          {f.faltan === 1 ? <>¡Te falta <strong>1</strong> sola materia para recibirte!</> : <>Te faltan <strong>{f.faltan}</strong> materias para recibirte</>}
        </p>
        <pre className="festejo-npm">
          <span className="muted">$</span> npm install tecnico-superior{'\n'}
          [{barra(f.aprobadas)}] {f.aprobadas}/8{'\n'}
          <span className="ok">{f.frase}</span>
        </pre>
        {CANCION[f.faltan] && (
          <>
            <div className="festejo-video">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${CANCION[f.faltan]}?autoplay=1&rel=0&playsinline=1`}
                title="Canción del festejo"
                allow="autoplay; encrypted-media"
              />
            </div>
            <a className="link small" href={`https://youtu.be/${CANCION[f.faltan]}`} target="_blank" rel="noreferrer">¿No suena? Abrir en YouTube ↗</a>
          </>
        )}
        <button className="btn btn-primary" onClick={() => setFestejo(null)}>{f.nivel === 1 ? 'Seguir' : '¡Vamos! 💪'}</button>
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
                  <button className="btn btn-ok btn-sm" onClick={() => aprobar(m.id)}><Icon name="check" size={14} /> Aprobada</button>
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
                    <div className="li-title">{iconoEvento(e)}{e.titulo}{e.tentativo && <em> (a confirmar)</em>}</div>
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
