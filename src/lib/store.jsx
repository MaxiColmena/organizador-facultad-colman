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
})

function cargarLocal() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return { ...estadoInicial(), ...JSON.parse(raw) }
  } catch {}
  return estadoInicial()
}

const Ctx = createContext(null)
export const useStore = () => useContext(Ctx)

export function StoreProvider({ children }) {
  const [state, setState] = useState(cargarLocal)
  const [user, setUser] = useState(null)
  const [sync, setSync] = useState(supabase ? 'offline' : 'local') // local | offline | syncing | ok | error
  const pushTimer = useRef()
  const remoteReady = useRef(false)

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

  // Al iniciar sesión: traer datos de la nube y quedarse con lo más nuevo
  useEffect(() => {
    remoteReady.current = false
    if (!supabase || !user) {
      setSync(supabase ? 'offline' : 'local')
      return
    }
    let cancel = false
    ;(async () => {
      setSync('syncing')
      const { data, error } = await supabase.from(TABLE).select('data').eq('user_id', user.id).maybeSingle()
      if (cancel) return
      if (error) return setSync('error')
      const remoto = data?.data
      setState((local) => {
        if (remoto && (remoto.updatedAt || 0) > (local.updatedAt || 0)) return { ...estadoInicial(), ...remoto }
        // local más nuevo → subirlo
        supabase.from(TABLE).upsert({ user_id: user.id, data: local, updated_at: new Date().toISOString() }).then(({ error }) => setSync(error ? 'error' : 'ok'))
        return local
      })
      remoteReady.current = true
      setSync('ok')
    })()
    return () => {
      cancel = true
    }
  }, [user])

  // Subir cambios a la nube (debounce)
  useEffect(() => {
    if (!supabase || !user || !remoteReady.current) return
    clearTimeout(pushTimer.current)
    pushTimer.current = setTimeout(async () => {
      setSync('syncing')
      const { error } = await supabase.from(TABLE).upsert({ user_id: user.id, data: state, updated_at: new Date().toISOString() })
      setSync(error ? 'error' : 'ok')
    }, 800)
  }, [state, user])

  // Traer cambios hechos desde otro dispositivo al volver a la pestaña
  useEffect(() => {
    if (!supabase || !user) return
    const onVis = async () => {
      if (document.visibilityState !== 'visible') return
      const { data } = await supabase.from(TABLE).select('data').eq('user_id', user.id).maybeSingle()
      const remoto = data?.data
      if (remoto) setState((local) => ((remoto.updatedAt || 0) > (local.updatedAt || 0) ? { ...estadoInicial(), ...remoto } : local))
    }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [user])

  const mutate = useCallback((fn) => setState((s) => ({ ...fn(s), updatedAt: Date.now() })), [])

  const actions = useMemo(
    () => ({
      guardarTarea: (t) =>
        mutate((s) => {
          if (t.id && s.tareas.some((x) => x.id === t.id)) return { ...s, tareas: s.tareas.map((x) => (x.id === t.id ? { ...x, ...t } : x)) }
          return { ...s, tareas: [...s.tareas, { estado: 'pendiente', adjuntos: [], links: [], ...t, id: t.id || uid(), creada: Date.now() }] }
        }),
      toggleTarea: (id) =>
        mutate((s) => ({
          ...s,
          tareas: s.tareas.map((t) =>
            t.id === id ? { ...t, estado: t.estado === 'completada' ? 'pendiente' : 'completada', completada: t.estado === 'completada' ? null : Date.now() } : t,
          ),
        })),
      borrarTarea: (id) =>
        mutate((s) => {
          const t = s.tareas.find((x) => x.id === id)
          t?.adjuntos?.forEach((a) => borrarArchivo(a, user?.id))
          return { ...s, tareas: s.tareas.filter((x) => x.id !== id) }
        }),
      guardarEvento: (e) =>
        mutate((s) => {
          if (e.id && s.eventos.some((x) => x.id === e.id)) return { ...s, eventos: s.eventos.map((x) => (x.id === e.id ? { ...x, ...e } : x)) }
          return { ...s, eventos: [...s.eventos, { ...e, id: uid() }] }
        }),
      toggleEvento: (id) => mutate((s) => ({ ...s, eventos: s.eventos.map((e) => (e.id === id ? { ...e, hecho: !e.hecho } : e)) })),
      borrarEvento: (id) => mutate((s) => ({ ...s, eventos: s.eventos.filter((e) => e.id !== id) })),
      guardarMeta: (materia, patch) =>
        mutate((s) => ({ ...s, materiasMeta: { ...s.materiasMeta, [materia]: { ...s.materiasMeta[materia], ...patch } } })),
      guardarAjustes: (patch) => mutate((s) => ({ ...s, ajustes: { ...s.ajustes, ...patch } })),
      importar: (data) => mutate(() => ({ ...estadoInicial(), ...data })),
    }),
    [mutate, user],
  )

  const value = useMemo(() => ({ state, ...actions, user, sync }), [state, actions, user, sync])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
