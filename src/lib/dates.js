// Fechas como strings locales 'YYYY-MM-DD' para evitar líos de zona horaria.
export const pad = (n) => String(n).padStart(2, '0')
export const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
export const parseISO = (s) => {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}
export const todayISO = () => toISO(new Date())

export const daysUntil = (iso) => {
  const t = new Date()
  const today = new Date(t.getFullYear(), t.getMonth(), t.getDate())
  return Math.round((parseISO(iso) - today) / 86400000)
}

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
export const MESES_LARGO = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
const DIAS_CORTO = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb']

export const fmtFecha = (iso) => {
  const d = parseISO(iso)
  return `${DIAS_CORTO[d.getDay()]} ${d.getDate()} ${MESES[d.getMonth()]}`
}
export const fmtRango = (a, b) => (b && b !== a ? `${fmtFecha(a)} → ${fmtFecha(b)}` : fmtFecha(a))

export const relativo = (iso) => {
  const n = daysUntil(iso)
  if (n === 0) return 'hoy'
  if (n === 1) return 'mañana'
  if (n === -1) return 'ayer'
  if (n < 0) return `hace ${-n} días`
  return `en ${n} días`
}

export const inRange = (iso, a, b) => iso >= a && iso <= (b || a)
export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)
