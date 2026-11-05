import { useState } from 'react'
import { MATERIAS } from '../data/materias'
import { useStore } from '../lib/store'
import { Icon, Vacio } from './ui'
import TareaItem from './TareaItem'

export default function Tareas({ abrirTarea }) {
  const { state } = useStore()
  const [materia, setMateria] = useState('')
  const [estado, setEstado] = useState('pendiente')
  const [q, setQ] = useState('')

  const lista = state.tareas
    .filter((t) => (!materia || t.materia === materia) && (!estado || t.estado === estado) && (!q || t.titulo.toLowerCase().includes(q.toLowerCase())))
    .sort((a, b) => (a.fecha || '9999').localeCompare(b.fecha || '9999'))

  const cuenta = (e) => state.tareas.filter((t) => (!materia || t.materia === materia) && (!e || t.estado === e)).length

  return (
    <div className="page">
      <div className="page-head">
        <h1>Tareas</h1>
        <button className="btn btn-primary" onClick={() => abrirTarea(null, { materia })}><Icon name="plus" size={16} /> Nueva</button>
      </div>
      <div className="filtros">
        <div className="seg">
          {[['pendiente', 'Pendientes'], ['completada', 'Completadas'], ['', 'Todas']].map(([k, v]) => (
            <button key={k} className={estado === k ? 'on' : ''} onClick={() => setEstado(k)}>{v} <small>{cuenta(k)}</small></button>
          ))}
        </div>
        <select value={materia} onChange={(e) => setMateria(e.target.value)}>
          <option value="">Todas las materias</option>
          {MATERIAS.map((m) => <option key={m.id} value={m.id}>{m.corto}</option>)}
        </select>
        <input type="search" placeholder="Buscar…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      {lista.length === 0 ? <Vacio>{estado === 'pendiente' ? 'No hay pendientes acá. Cargá una tarea con "Nueva".' : 'Sin resultados.'}</Vacio> : (
        <ul className="tareas">{lista.map((t) => <TareaItem key={t.id} t={t} onEdit={abrirTarea} />)}</ul>
      )}
    </div>
  )
}
