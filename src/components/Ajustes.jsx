import { useState } from 'react'
import { useStore } from '../lib/store'
import { supabase } from '../lib/supabase'
import { notificar } from '../lib/alertas'
import { Icon } from './ui'

export default function Ajustes() {
  const { state, importar, guardarAjustes, user, sync } = useStore()
  const [perm, setPerm] = useState(() => ('Notification' in window ? Notification.permission : 'unsupported'))
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [msg, setMsg] = useState('')

  async function pedirPermiso() {
    const p = await Notification.requestPermission()
    setPerm(p)
    if (p === 'granted') notificar(state)
  }

  function exportar() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `organizador-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
  }

  function onImport(e) {
    const file = e.target.files[0]
    if (!file) return
    file.text().then((txt) => {
      try {
        const data = JSON.parse(txt)
        if (!Array.isArray(data.tareas) || !Array.isArray(data.eventos)) throw new Error('Formato inválido')
        if (confirm('Esto reemplaza tus datos actuales. ¿Seguir?')) importar(data)
        setMsg('Datos importados ✔ (los archivos adjuntos locales no viajan en el backup)')
      } catch (err) {
        setMsg('Error: ' + err.message)
      }
    })
    e.target.value = ''
  }

  async function auth(tipo) {
    setMsg('')
    const fn = tipo === 'in' ? supabase.auth.signInWithPassword : supabase.auth.signUp
    const { error } = await fn.call(supabase.auth, { email, password: pass })
    if (error) setMsg(error.message)
    else if (tipo === 'up') setMsg('Cuenta creada. Si Supabase pide confirmación, revisá tu mail.')
  }

  return (
    <div className="page narrow">
      <h1>Ajustes</h1>

      <section className="card">
        <h3><Icon name="bell" /> Recordatorios</h3>
        <label className="form">
          Avisarme con anticipación de
          <select value={state.ajustes?.diasAviso ?? 3} onChange={(e) => guardarAjustes({ diasAviso: Number(e.target.value) })}>
            {[1, 2, 3, 5, 7].map((n) => <option key={n} value={n}>{n} día{n > 1 ? 's' : ''}</option>)}
          </select>
        </label>
        {perm === 'unsupported' ? <p className="muted small">Este navegador no soporta notificaciones.</p>
          : perm === 'granted' ? <p className="ok small">✔ Notificaciones activadas. Saltan al abrir la app cuando algo vence pronto.</p>
          : perm === 'denied' ? <p className="error small">Notificaciones bloqueadas: habilitalas desde la configuración del navegador.</p>
          : <button className="btn btn-primary" onClick={pedirPermiso}>Activar notificaciones</button>}
      </section>

      <section className="card">
        <h3>Sincronizar PC ↔ celular</h3>
        {!supabase ? (
          <p className="muted small">Modo local: tus datos viven en este navegador. Para sincronizar entre dispositivos hay que configurar Supabase (ver README). Mientras tanto podés usar exportar/importar.</p>
        ) : user ? (
          <>
            <p className="small">Conectado como <strong>{user.email}</strong> · estado: <span className={sync === 'error' ? 'error' : 'ok'}>{{ ok: 'sincronizado', syncing: 'sincronizando…', error: 'error de sync' }[sync] || sync}</span></p>
            <button className="btn btn-ghost" onClick={() => supabase.auth.signOut()}>Cerrar sesión</button>
          </>
        ) : (
          <div className="form">
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input type="password" placeholder="Contraseña (mín. 6)" value={pass} onChange={(e) => setPass(e.target.value)} />
            <div className="row-gap">
              <button className="btn btn-primary" onClick={() => auth('in')}>Ingresar</button>
              <button className="btn btn-ghost" onClick={() => auth('up')}>Crear cuenta</button>
            </div>
          </div>
        )}
      </section>

      <section className="card">
        <h3>Backup</h3>
        <div className="row-gap">
          <button className="btn btn-ghost" onClick={exportar}>Exportar JSON</button>
          <label className="btn btn-ghost">Importar JSON<input type="file" accept="application/json" hidden onChange={onImport} /></label>
        </div>
      </section>
      {msg && <p className="small">{msg}</p>}
      <p className="muted small center">Colman Máximo · TS-DSM · Instituto Politécnico Formosa</p>
    </div>
  )
}
