import { useCallback, useEffect, useRef, useState } from 'react'
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
import Fiesta from './components/Fiesta'
import { MATERIAS } from './data/materias'
import { bailar, lanzarConfeti, lluviaEmojis, setSonidos, sonidoFanfarria, vibrar } from './lib/fiesta'

const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a']

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
  const [fiesta, setFiesta] = useState(false)
  const [huevo, setHuevo] = useState('')
  const todasAprobadas = MATERIAS.every((m) => state.materiasMeta[m.id]?.estado === 'aprobada')

  useEffect(() => setSonidos(state.ajustes?.sonidos), [state.ajustes?.sonidos])

  // Fiesta total (8/8) — la dispara el botón Aprobada o el botón de volver a festejar
  useEffect(() => {
    const on = () => setFiesta(true)
    window.addEventListener('fiesta-total', on)
    return () => window.removeEventListener('fiesta-total', on)
  }, [])

  // Huevos de pascua: tocar el logo 7 veces o el código Konami (↑↑↓↓←→←→BA)
  const miniFiesta = useCallback((msg) => {
    lanzarConfeti()
    lluviaEmojis(['🥚', '🐣', '✨', '🎉'], 3)
    sonidoFanfarria()
    bailar()
    vibrar([60, 30, 60])
    setHuevo(msg)
    setTimeout(() => setHuevo(''), 4000)
  }, [])
  const logo = useRef({ n: 0, t: null })
  const toques = useCallback(() => {
    const r = logo.current
    r.n += 1
    clearTimeout(r.t)
    r.t = setTimeout(() => (r.n = 0), 1500)
    if (r.n >= 7) {
      r.n = 0
      miniFiesta('🥚 ¡Encontraste un huevo de pascua! Seguí así, Máximo.')
    }
  }, [miniFiesta])
  useEffect(() => {
    let pos = 0
    const k = (e) => {
      pos = e.key === KONAMI[pos] || e.key.toLowerCase() === KONAMI[pos] ? pos + 1 : e.key === KONAMI[0] ? 1 : 0
      if (pos === KONAMI.length) {
        pos = 0
        miniFiesta('🕹️ Código Konami activado: +30 vidas para la defensa.')
      }
    }
    document.addEventListener('keydown', k)
    return () => document.removeEventListener('keydown', k)
  }, [miniFiesta])

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
  const abrirEvento = useCallback((e, init = {}) => setModal({ tipo: 'evento', item: e || null, init }), [])
  const cerrar = useCallback(() => setModal(null), [])
  const nAlertas = alertas(state).length
  const props = { ir, abrirTarea, abrirEvento }

  return (
    <div className={`app ${todasAprobadas ? 'arcoiris' : ''}`}>
      <aside className="sidebar">
        <div className="brand" onClick={() => ir('inicio')}>
          <span className="logo" onClick={toques}>TS</span>
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
          <span className="logo" onClick={toques}>TS</span>
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

      {todasAprobadas && !fiesta && (
        <button className="btn-fiesta" onClick={() => setFiesta(true)} aria-label="Volver a festejar" title="Volver a festejar">🎉</button>
      )}
      {fiesta && <Fiesta onClose={() => setFiesta(false)} />}
      {huevo && <div className="toast huevo" role="status">{huevo}</div>}

      {modal?.tipo === 'tarea' && <TareaForm tarea={modal.item} materiaInicial={modal.init.materia} fechaInicial={modal.init.fecha} onClose={cerrar} />}
      {modal?.tipo === 'evento' && <EventoForm evento={modal.item} materiaInicial={modal.init.materia} fechaInicial={modal.init.fecha} fechaFinInicial={modal.init.fechaFin} tipoInicial={modal.init.tipo} onClose={cerrar} />}
    </div>
  )
}
