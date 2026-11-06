import { daysUntil, todayISO } from './dates'
import { materiaById } from '../data/materias'

// Une tareas pendientes y eventos en una lista de "vencimientos" ordenada por fecha.
export function vencimientos(state) {
  const items = []
  for (const t of state.tareas) {
    if (t.estado === 'completada' || !t.fecha) continue
    items.push({ id: t.id, clase: 'tarea', titulo: t.titulo, materia: t.materia, fecha: t.fecha, fechaFin: null })
  }
  for (const e of state.eventos) {
    if (e.hecho) continue
    const fin = e.fechaFin || e.fecha
    if (fin < todayISO()) continue
    items.push({ id: e.id, clase: 'evento', titulo: e.titulo, materia: e.materia, fecha: e.fecha, fechaFin: e.fechaFin, tipo: e.tipo, tentativo: e.tentativo, importancia: e.importancia })
  }
  return items.sort((a, b) => a.fecha.localeCompare(b.fecha))
}

// Urgentes: vencidas (sólo tareas) o dentro de los próximos N días.
export function alertas(state) {
  const n = state.ajustes?.diasAviso ?? 3
  const peso = { critica: 0, alta: 1 }
  return vencimientos(state)
    .filter((v) => daysUntil(v.fecha) <= n)
    .sort((a, b) => (peso[a.importancia] ?? 2) - (peso[b.importancia] ?? 2) || a.fecha.localeCompare(b.fecha))
}

export function nivel(fecha, fechaFin) {
  const d = daysUntil(fecha)
  if (d < 0 && (!fechaFin || daysUntil(fechaFin) < 0)) return 'vencida'
  if (d <= 0) return 'hoy'
  if (d <= 3) return 'pronto'
  return 'ok'
}

// Notificaciones del navegador (funcionan mientras la app esté abierta o en segundo plano reciente).
const NOTI_KEY = 'organizador-notificados'
export function notificar(state) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return
  let enviados = {}
  try { enviados = JSON.parse(localStorage.getItem(NOTI_KEY) || '{}') } catch {}
  const hoy = todayISO()
  for (const a of alertas(state)) {
    const k = `${a.id}-${hoy}`
    if (enviados[k]) continue
    const m = materiaById(a.materia)
    const d = daysUntil(a.fecha)
    const cuando = d < 0 ? 'VENCIDA' : d === 0 ? 'HOY' : d === 1 ? 'mañana' : `en ${d} días`
    try {
      new Notification(`${a.titulo} — ${cuando}`, { body: m ? m.nombre : 'Recordatorio', icon: './favicon.svg', tag: k })
    } catch {}
    enviados[k] = 1
  }
  localStorage.setItem(NOTI_KEY, JSON.stringify(enviados))
}
