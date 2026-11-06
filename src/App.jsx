import { useCallback, useEffect, useState } from 'react'
import { useStore } from './lib/store'
import { alertas, notificar } from './lib/alertas'
import { Icon } from './components/ui'
import Inicio from './components/Inicio'
import Materias from './components/Materias'
import Tareas from './components/Tareas'
import Calendario from './components/Calendario'
import Horario from './components/Horario'
import Ajustes from './components/Ajustes'
import TareaForm from './components/TareaForm'
import EventoForm from './components/EventoForm'

const NAV = [
  ['inicio', 'Inicio', 'home'],
  ['materias', 'Materias', 'book'],
  ['tareas', 'Tareas', 'check'],
  ['calendario', 'Calendario', 'cal'],
  ['horario', 'Horario', 'clock'],
  ['ajustes', 'Ajustes', 'gear'],
]

const vistaDeHash = () => {
  const [v, sub] = location.hash.replace('#/', '').split('/')
  return { vista: NAV.some((n) => n[0] === v) ? v : 'inicio', sub: sub || null }
}

export default function App() {
  const { state, sync } = useStore()
  const [{ vista, sub }, setRuta] = useState(vistaDeHash)
  const [modal, setModal] = useState(null)

  useEffect(() => {
    const on = () => setRuta(vistaDeHash())
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])

  const ir = useCallback((v, s) => {
    location.hash = `/${v}${s ? '/' + s : ''}`
    window.scrollTo(0, 0)
  }, [])

  // Notificaciones al abrir y cada 30 min
  useEffect(() => {
    notificar(state)
    const t = setInterval(() => notificar(state), 30 * 60 * 1000)
    return () => clearInterval(t)
  }, [state])

  const abrirTarea = (t, init = {}) => setModal({ tipo: 'tarea', item: t || null, init })
  const abrirEvento = (e, init = {}) => setModal({ tipo: 'evento', item: e || null, init })
  const cerrar = useCallback(() => setModal(null), [])
  const nAlertas = alertas(state).length
  const props = { ir, abrirTarea, abrirEvento }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand" onClick={() => ir('inicio')}>
          <span className="logo">TS</span>
          <div>
            <strong>Organizador</strong>
            <small>DSM · 2º año</small>
          </div>
        </div>
        <nav>
          {NAV.map(([k, label, icon]) => (
            <button key={k} className={vista === k ? 'on' : ''} onClick={() => ir(k)}>
              <Icon name={icon} /> {label}
              {k === 'inicio' && nAlertas > 0 && <span className="badge">{nAlertas}</span>}
            </button>
          ))}
        </nav>
        <div className={`sync sync-${sync}`}>
          <i /> {{ local: 'Guardado en este dispositivo', offline: 'Sin sesión (local)', syncing: 'Sincronizando…', ok: 'Sincronizado', error: 'Error de sincronización' }[sync]}
        </div>
      </aside>

      <header className="topbar">
        <div className="brand" onClick={() => ir('inicio')}>
          <span className="logo">TS</span>
          <strong>Organizador</strong>
        </div>
        <button className={`top-sync sync-${sync}`} onClick={() => ir('ajustes')} aria-label="Ajustes y sincronización">
          <i /> {{ local: 'Local', offline: 'Sin sesión', syncing: 'Sync…', ok: 'Sincronizado', error: 'Error sync' }[sync]}
          <Icon name="gear" />
        </button>
      </header>

      <main>
        {vista === 'inicio' && <Inicio {...props} />}
        {vista === 'materias' && <Materias {...props} seleccion={sub} setSeleccion={(id) => ir('materias', id)} />}
        {vista === 'tareas' && <Tareas {...props} />}
        {vista === 'calendario' && <Calendario {...props} />}
        {vista === 'horario' && <Horario />}
        {vista === 'ajustes' && <Ajustes />}
      </main>

      <nav className="bottom-nav">
        {NAV.slice(0, 5).map(([k, label, icon]) => (
          <button key={k} className={vista === k ? 'on' : ''} onClick={() => ir(k)}>
            <span className="bn-icon"><Icon name={icon} size={20} />{k === 'inicio' && nAlertas > 0 && <i className="bn-dot" />}</span>
            {label}
          </button>
        ))}
      </nav>

      {vista !== 'ajustes' && <button className="fab" onClick={() => abrirTarea()} aria-label="Nueva tarea"><Icon name="plus" size={24} /></button>}

      {modal?.tipo === 'tarea' && <TareaForm tarea={modal.item} materiaInicial={modal.init.materia} fechaInicial={modal.init.fecha} onClose={cerrar} />}
      {modal?.tipo === 'evento' && <EventoForm evento={modal.item} materiaInicial={modal.init.materia} fechaInicial={modal.init.fecha} onClose={cerrar} />}
    </div>
  )
}
