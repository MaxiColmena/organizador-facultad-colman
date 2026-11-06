import { DIAS, GRADUACION, HORARIO, MATERIAS, materiaById } from '../data/materias'
import { useStore } from '../lib/store'
import { alertas, vencimientos, nivel } from '../lib/alertas'
import { daysUntil } from '../lib/dates'
import { Fecha, Icon, MateriaTag, Progreso, Vacio } from './ui'

export default function Inicio({ ir, abrirTarea, abrirEvento }) {
  const { state } = useStore()
  const diasGrad = daysUntil(GRADUACION.inicio)
  const urg = alertas(state)
  const prox = vencimientos(state).filter((v) => daysUntil(v.fecha) > (state.ajustes?.diasAviso ?? 3)).slice(0, 6)
  const total = state.tareas.length
  const hechas = state.tareas.filter((t) => t.estado === 'completada').length
  const aprobadas = MATERIAS.filter((m) => state.materiasMeta[m.id]?.estado === 'aprobada').length

  const hoy = new Date()
  const dia = hoy.getDay()
  const ahora = `${String(hoy.getHours()).padStart(2, '0')}:${String(hoy.getMinutes()).padStart(2, '0')}`
  const clases = HORARIO.filter((h) => h.dia === dia)
  const diaMostrado = clases.length ? dia : dia === 6 || dia === 0 ? 1 : dia + 1
  const clasesMostradas = clases.length ? clases : HORARIO.filter((h) => h.dia === diaMostrado)

  const abrir = (v) => (v.clase === 'tarea' ? abrirTarea(state.tareas.find((t) => t.id === v.id)) : abrirEvento(state.eventos.find((e) => e.id === v.id)))

  return (
    <div className="page">
      <section className="hero">
        <div>
          <p className="eyebrow">TS en Desarrollo de Software Multiplataforma · 2º año</p>
          <h1>
            Hola, Máximo. <span className="grad">{diasGrad > 0 ? `Faltan ${diasGrad} días` : diasGrad >= -3 ? 'Es la semana de la defensa' : '¡Recibido!'}</span>
          </h1>
          <p className="muted">Defensa pública del 1 al 4 de diciembre. Objetivo: 8 materias aprobadas, todo entregado, asistencia al día.</p>
          <div className="hero-actions">
            <button className="btn btn-primary" onClick={() => abrirTarea()}><Icon name="plus" size={16} /> Nueva tarea</button>
            <button className="btn btn-ghost" onClick={() => abrirEvento()}><Icon name="cal" size={16} /> Anotar fecha</button>
          </div>
        </div>
        <div className="countdown">
          <Icon name="cap" size={28} />
          <strong>{Math.max(diasGrad, 0)}</strong>
          <span>días para recibirte</span>
          <Progreso valor={aprobadas} total={8} color="var(--ok)" />
          <small>{aprobadas}/8 materias aprobadas · {hechas}/{total} tareas</small>
        </div>
      </section>

      <div className="grid-2">
        <section className="card">
          <div className="card-head">
            <h3><Icon name="bell" /> Alertas <span className="badge">{urg.length}</span></h3>
            <small className="muted">vencidas o en ≤ {state.ajustes?.diasAviso ?? 3} días</small>
          </div>
          {urg.length === 0 ? <Vacio>Nada urgente. 🎯</Vacio> : (
            <ul className="lista">
              {urg.map((v) => (
                <li key={v.id} className={`alerta alerta-${nivel(v.fecha, v.fechaFin)}`} onClick={() => abrir(v)}>
                  <Icon name="alert" size={16} />
                  <div>
                    <div className="li-title">{v.titulo}{v.tentativo && <em> (a confirmar)</em>}</div>
                    <div className="li-meta"><MateriaTag id={v.materia} /> <Fecha fecha={v.fecha} fechaFin={v.fechaFin} /></div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card">
          <div className="card-head">
            <h3><Icon name="clock" /> {clases.length ? 'Hoy' : DIAS[diaMostrado]} en el instituto</h3>
            <button className="link" onClick={() => ir('horario')}>Ver horario</button>
          </div>
          <ul className="lista">
            {clasesMostradas.map((h, i) => {
              const m = materiaById(h.materia)
              const activa = clases.length && ahora >= h.inicio && ahora < h.fin
              return (
                <li key={i} className={`clase ${activa ? 'activa' : ''}`} style={{ '--c': m.color }}>
                  <span className="hora">{h.inicio}–{h.fin}</span>
                  <span>{m.corto}</span>
                  {activa && <span className="live">ahora</span>}
                </li>
              )
            })}
          </ul>
        </section>
      </div>

      <section className="card">
        <div className="card-head">
          <h3><Icon name="cal" /> Próximas fechas</h3>
          <button className="link" onClick={() => ir('calendario')}>Calendario</button>
        </div>
        {prox.length === 0 ? <Vacio>Sin más fechas cargadas.</Vacio> : (
          <ul className="timeline">
            {prox.map((v) => (
              <li key={v.id} onClick={() => abrir(v)}>
                <Fecha fecha={v.fecha} fechaFin={v.fechaFin} />
                <span className="li-title">{v.titulo}{v.tentativo && <em> (a confirmar)</em>}</span>
                <MateriaTag id={v.materia} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <div className="section-head">
          <h3>Materias</h3>
          <button className="link" onClick={() => ir('materias')}>Ver todas</button>
        </div>
        <div className="mini-materias">
          {MATERIAS.map((m) => {
            const ts = state.tareas.filter((t) => t.materia === m.id)
            const ok = ts.filter((t) => t.estado === 'completada').length
            if (state.materiasMeta[m.id]?.estado === 'aprobada')
              return (
                <div key={m.id} className="mini-materia aprobada">
                  <span className="mm-name">{m.corto}</span>
                  <span className="mm-ok"><Icon name="check" size={14} /></span>
                </div>
              )
            return (
              <button key={m.id} className="mini-materia" style={{ '--c': m.color }} onClick={() => ir('materias', m.id)}>
                <span className="mm-name">{m.corto}</span>
                <span className="mm-count">{ok}/{ts.length}</span>
                <Progreso valor={ok} total={ts.length} color={m.color} />
              </button>
            )
          })}
        </div>
      </section>
    </div>
  )
}
