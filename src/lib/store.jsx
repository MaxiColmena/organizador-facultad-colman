import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { EVENTOS_INICIALES } from '../data/materias'
import { supabase } from './supabase'
import { uid } from './dates'
import { borrarArchivo } from './files'

const KEY = 'organizador-v1'
const TABLE = 'user_state'

const estadoInicial = () => ({
  version: 1,
  updatedAt: 0, // 0 = nunca editado → si hay datos en la nube, ganan esos
  tareas: [],
  eventos: EVENTOS_INICIALES,
  materiasMeta: {}, // { [materiaId]: { evaluacion, notas, asistencia } }
  ajustes: { diasAviso: 3 },
  borrados: {}, // { [id]: timestamp } para que un borrado se propague
})

// Suma eventos predefinidos nuevos (ej. cierre de cuatrimestre) a datos ya existentes, salvo que se hayan borrado.
function agregarFaltantes(st) {
  const ids = new Set(st.eventos.map((e) => e.id))
  const faltan = EVENTOS_INICIALES.filter((e) => !ids.has(e.id) && !st.borrados?.[e.id])
  return faltan.length ? { ...st, eventos: [...st.eventos, ...faltan] } : st
}

function cargarLocal() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return agregarFaltantes({ ...estadoInicial(), ...JSON.parse(raw) })
  } catch {}
  return estadoInicial()
}

// Une dos estados ítem por ítem: gana la versión más nueva de cada tarea/evento.
function unirLista(a = [], b = [], borrados) {
  const map = new Map()
  for (const it of [...a, ...b]) {
    const prev = map.get(it.id)
    if (!prev || (it.upd || 0) > (prev.upd || 0)) map.set(it.id, it)
  }
  return [...map.values()].filter((it) => !(borrados[it.id] >= (it.upd || 0)))
}
export function combinar(local, remoto) {
  const r = { ...estadoInicial(), ...remoto }
  const borrados = { ...r.borrados }
  for (const [k, v] of Object.entries(local.borrados || {})) borrados[k] = Math.max(v, borrados[k] || 0)
  const meta = { ...r.materiasMeta }
  for (const [k, v] of Object.entries(local.materiasMeta || {})) if (!meta[k] || (v.upd || 0) >= (meta[k].upd || 0)) meta[k] = v
  return {
    ...r,
    updatedAt: Math.max(local.updatedAt || 0, r.updatedAt || 0),
    tareas: unirLista(r.tareas, local.tareas, borrados),
    eventos: unirLista(r.eventos, local.eventos, borrados),
    materiasMeta: meta,
    ajustes: (local.ajustes?.upd || 0) >= (r.ajustes?.upd || 0) ? local.ajustes : r.ajustes,
    borrados,
  }
}

const Ctx = createContext(null)
export const useStore = () => useContext(Ctx)

export function StoreProvider({ children }) {
  const [state, setState] = useState(cargarLocal)
  const [user, setUser] = useState(null)
  const [sync, setSync] = useState(supabase ? 'offline' : 'local') // local | offline | syncing | ok | error
  const pushTimer = useRef()
  const [syncError, setSyncError] = useState('')

  // Persistencia local
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state))
    } catch {}
  }, [state])

  // Sesión de Supabase
  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null))
    return () => sub.subscription.unsubscribe()
  }, [])

  // Sincronización: trae lo de la nube, lo COMBINA con lo local y sube el resultado.
  const stateRef = useRef(state)
  stateRef.current = state
  const syncing = useRef(false)
  const pendiente = useRef(false)

  const syncNow = useCallback(async () => {
    if (!supabase || !user) return
    if (syncing.current) return void (pendiente.current = true)
    syncing.current = true
    setSync('syncing')
    try {
      const { data, error } = await supabase.from(TABLE).select('data').eq('user_id', user.id).maybeSingle()
      if (error) throw error
      const local = stateRef.current
      const merged = data?.data ? combinar(local, data.data) : local
      if (JSON.stringify(merged) !== JSON.stringify(local)) setState(merged)
      if (!data?.data || JSON.stringify(merged) !== JSON.stringify(data.data)) {
        const { error: e2 } = await supabase.from(TABLE).upsert({ user_id: user.id, data: merged, updated_at: new Date().toISOString() })
        if (e2) throw e2
      }
      setSyncError('')
      setSync('ok')
    } catch (e) {
      console.error('Sync', e)
      setSyncError(e.message || String(e))
      setSync('error')
    } finally {
      syncing.current = false
      if (pendiente.current) {
        pendiente.current = false
        setTimeout(() => syncNowRef.current(), 300)
      }
    }
  }, [user])
  const syncNowRef = useRef(syncNow)
  syncNowRef.current = syncNow

  // Al iniciar sesión, al volver a la app y cada 20 s
  useEffect(() => {
    if (!supabase || !user) {
      setSync(supabase ? 'offline' : 'local')
      return
    }
    syncNow()
    const on = () => document.visibilityState === 'visible' && syncNow()
    document.addEventListener('visibilitychange', on)
    window.addEventListener('focus', on)
    window.addEventListener('online', on)
    const t = setInterval(on, 20000)
    return () => {
      document.removeEventListener('visibilitychange', on)
      window.removeEventListener('focus', on)
      window.removeEventListener('online', on)
      clearInterval(t)
    }
  }, [user, syncNow])

  // Tras cada cambio local (debounce)
  const primera = useRef(true)
  useEffect(() => {
    if (primera.current) return void (primera.current = false)
    if (!supabase || !user) return
    clearTimeout(pushTimer.current)
    pushTimer.current = setTimeout(() => syncNowRef.current(), 700)
  }, [state.updatedAt, user])

  const mutate = useCallback((fn) => setState((s) => ({ ...fn(s), updatedAt: Date.now() })), [])
  const now = () => Date.now()

  const actions = useMemo(
    () => ({
      guardarTarea: (t) =>
        mutate((s) => {
          if (t.id && s.tareas.some((x) => x.id === t.id)) return { ...s, tareas: s.tareas.map((x) => (x.id === t.id ? { ...x, ...t, upd: now() } : x)) }
          return { ...s, tareas: [...s.tareas, { estado: 'pendiente', adjuntos: [], links: [], ...t, id: t.id || uid(), creada: now(), upd: now() }] }
        }),
      toggleTarea: (id) =>
        mutate((s) => ({
          ...s,
          tareas: s.tareas.map((t) =>
            t.id === id ? { ...t, estado: t.estado === 'completada' ? 'pendiente' : 'completada', completada: t.estado === 'completada' ? null : now(), upd: now() } : t,
          ),
        })),
      borrarTarea: (id) =>
        mutate((s) => {
          const t = s.tareas.find((x) => x.id === id)
          t?.adjuntos?.forEach((a) => borrarArchivo(a, user?.id))
          return { ...s, tareas: s.tareas.filter((x) => x.id !== id), borrados: { ...s.borrados, [id]: now() } }
        }),
      guardarEvento: (e) =>
        mutate((s) => {
          if (e.id && s.eventos.some((x) => x.id === e.id)) return { ...s, eventos: s.eventos.map((x) => (x.id === e.id ? { ...x, ...e, upd: now() } : x)) }
          return { ...s, eventos: [...s.eventos, { ...e, id: uid(), upd: now() }] }
        }),
      toggleEvento: (id) => mutate((s) => ({ ...s, eventos: s.eventos.map((e) => (e.id === id ? { ...e, hecho: !e.hecho, upd: now() } : e)) })),
      borrarEvento: (id) => mutate((s) => ({ ...s, eventos: s.eventos.filter((e) => e.id !== id), borrados: { ...s.borrados, [id]: now() } })),
      guardarMeta: (materia, patch) =>
        mutate((s) => ({ ...s, materiasMeta: { ...s.materiasMeta, [materia]: { ...s.materiasMeta[materia], ...patch, upd: now() } } })),
      aprobarMateria: (materia, aprobada) =>
        mutate((s) => ({
          ...s,
          materiasMeta: { ...s.materiasMeta, [materia]: { ...s.materiasMeta[materia], estado: aprobada ? 'aprobada' : 'cursando', aprobadaEn: aprobada ? now() : null, upd: now() } },
        })),
      agregarDocMateria: (materia, doc) =>
        mutate((s) => {
          const m = s.materiasMeta[materia] || {}
          return { ...s, materiasMeta: { ...s.materiasMeta, [materia]: { ...m, docs: [...(m.docs || []), doc], upd: now() } } }
        }),
      quitarDocMateria: (materia, docId) =>
        mutate((s) => {
          const m = s.materiasMeta[materia] || {}
          const d = (m.docs || []).find((x) => x.id === docId)
          if (d && !d.url) borrarArchivo(d, user?.id)
          return { ...s, materiasMeta: { ...s.materiasMeta, [materia]: { ...m, docs: (m.docs || []).filter((x) => x.id !== docId), upd: now() } } }
        }),
      guardarAjustes: (patch) => mutate((s) => ({ ...s, ajustes: { ...s.ajustes, ...patch, upd: now() } })),
      importar: (data) => mutate(() => ({ ...estadoInicial(), ...data })),
    }),
    [mutate, user],
  )

  const value = useMemo(() => ({ state, ...actions, user, sync, syncError, syncNow }), [state, actions, user, sync, syncError, syncNow])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
