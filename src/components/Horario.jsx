import { useState } from 'react'
import { DIAS, HORARIO, materiaById } from '../data/materias'

const FRANJAS = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00']
const fila = (h) => FRANJAS.indexOf(h) + 2

export default function Horario() {
  const hoy = new Date().getDay()
  const [dia, setDia] = useState(hoy >= 1 && hoy <= 5 ? hoy : 1)
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Horario</h1>
          <p className="muted">2º cuatrimestre · Receso 13:00–13:55</p>
        </div>
      </div>

      {/* Escritorio: grilla semanal */}
      <div className="horario card">
        <div className="h-corner" />
        {[1, 2, 3, 4, 5].map((d) => <div key={d} className={`h-dia ${d === hoy ? 'hoy' : ''}`} style={{ gridColumn: d + 1 }}>{DIAS[d]}</div>)}
        {FRANJAS.slice(0, -1).map((f, i) => <div key={f} className="h-hora" style={{ gridRow: i + 2 }}>{f}</div>)}
        <div className="h-receso" style={{ gridRow: `${fila('13:00')} / ${fila('14:00')}` }}>Receso almuerzo</div>
        {HORARIO.map((h, i) => {
          const m = materiaById(h.materia)
          return (
            <div key={i} className="h-bloque" style={{ gridColumn: h.dia + 1, gridRow: `${fila(h.inicio)} / ${fila(h.fin)}`, '--c': m.color }}>
              <strong>{m.corto}</strong>
              <small>{h.inicio}–{h.fin}</small>
            </div>
          )
        })}
      </div>

      {/* Celular: por día */}
      <div className="horario-movil">
        <div className="seg seg-full">
          {[1, 2, 3, 4, 5].map((d) => <button key={d} className={dia === d ? 'on' : ''} onClick={() => setDia(d)}>{DIAS[d].slice(0, 3)}</button>)}
        </div>
        <ul className="lista">
          {HORARIO.filter((h) => h.dia === dia).map((h, i) => {
            const m = materiaById(h.materia)
            return (
              <li key={i} className="clase big" style={{ '--c': m.color }}>
                <span className="hora">{h.inicio}–{h.fin}</span>
                <span>{m.nombre}</span>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
