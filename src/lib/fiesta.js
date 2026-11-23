// Efectos de festejo: sonidos sintetizados (Web Audio, sin archivos), vibración, baile y confeti.
import confetti from 'canvas-confetti'

let ctx = null
let sonidosOn = true
export const setSonidos = (v) => (sonidosOn = v !== false)

function audio() {
  if (!sonidosOn) return null
  try {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)()
    if (ctx.state === 'suspended') ctx.resume()
    return ctx
  } catch {
    return null
  }
}

function nota(freq, t0, dur, tipo = 'triangle', vol = 0.16) {
  const c = audio()
  if (!c) return
  const t = c.currentTime + t0
  const o = c.createOscillator()
  const g = c.createGain()
  o.type = tipo
  o.frequency.setValueAtTime(freq, t)
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(vol, t + 0.015)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  o.connect(g).connect(c.destination)
  o.start(t)
  o.stop(t + dur + 0.05)
}

// "Pop" corto al completar una tarea
export function sonidoPop() {
  nota(660, 0, 0.12, 'sine', 0.2)
  nota(990, 0.07, 0.18, 'sine', 0.16)
}

// Campanita suave (aprobar con muchas materias por delante)
export function sonidoCampanita() {
  nota(1046.5, 0, 0.5, 'sine', 0.12)
  nota(1318.5, 0.12, 0.6, 'sine', 0.1)
  nota(1568, 0.24, 0.8, 'sine', 0.08)
}

// Estallido chico de confeti, al centro
export function confetiSuave() {
  confetti({ particleCount: 70, spread: 70, startVelocity: 30, origin: { y: 0.6 }, colors: COLORES, zIndex: 200 })
}

// Fanfarria al aprobar una materia
export function sonidoFanfarria() {
  const C = [523.25, 659.25, 783.99, 1046.5]
  C.forEach((f, i) => nota(f, i * 0.09, 0.25, 'square', 0.07))
  ;[523.25, 659.25, 783.99, 1046.5].forEach((f) => nota(f, 0.42, 0.9, 'triangle', 0.1))
  nota(1318.5, 0.42, 0.9, 'sine', 0.08)
}

// Melodía de victoria (para cuando aprobás todo)
export function sonidoVictoria() {
  const m = [
    [783.99, 0, 0.14], [783.99, 0.15, 0.14], [783.99, 0.3, 0.14], [1046.5, 0.45, 0.5],
    [932.33, 1.0, 0.25], [1046.5, 1.25, 0.25], [1174.66, 1.5, 0.25], [1318.51, 1.75, 0.9],
  ]
  m.forEach(([f, t, d]) => nota(f, t, d, 'square', 0.06))
  m.forEach(([f, t, d]) => nota(f / 2, t, d, 'triangle', 0.08))
}

// Explosión de fuego artificial (ruido filtrado)
export function sonidoBoom(vol = 0.35) {
  const c = audio()
  if (!c) return
  const dur = 0.9
  const buf = c.createBuffer(1, c.sampleRate * dur, c.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 3)
  const src = c.createBufferSource()
  src.buffer = buf
  const f = c.createBiquadFilter()
  f.type = 'lowpass'
  f.frequency.value = 600 + Math.random() * 900
  const g = c.createGain()
  g.gain.value = vol
  src.connect(f).connect(g).connect(c.destination)
  src.start()
}

export const vibrar = (patron) => {
  try {
    navigator.vibrate?.(patron)
  } catch {}
}

const reducido = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

// Hace "bailar" la interfaz un momento
export function bailar(ms = 1600) {
  if (reducido()) return
  document.body.classList.remove('bailando')
  void document.body.offsetWidth
  document.body.classList.add('bailando')
  clearTimeout(bailar.t)
  bailar.t = setTimeout(() => document.body.classList.remove('bailando'), ms)
}

const COLORES = ['#8b5cf6', '#38bdf8', '#22c55e', '#a78bfa', '#f0abfc', '#facc15', '#fb7185']

// Confeti que sale desde un elemento (ej. el checkbox tocado)
export function confetiDesde(el, n = 40) {
  if (!el) return
  const r = el.getBoundingClientRect()
  confetti({
    particleCount: n,
    spread: 70,
    startVelocity: 28,
    scalar: 0.8,
    ticks: 120,
    origin: { x: (r.left + r.width / 2) / innerWidth, y: (r.top + r.height / 2) / innerHeight },
    colors: COLORES,
    zIndex: 200,
  })
}

export function lanzarConfeti() {
  const fin = Date.now() + 1300
  confetti({ particleCount: 150, spread: 95, origin: { y: 0.65 }, colors: COLORES, zIndex: 200 })
  ;(function frame() {
    confetti({ particleCount: 5, angle: 60, spread: 60, origin: { x: 0 }, colors: COLORES, zIndex: 200 })
    confetti({ particleCount: 5, angle: 120, spread: 60, origin: { x: 1 }, colors: COLORES, zIndex: 200 })
    if (Date.now() < fin) requestAnimationFrame(frame)
  })()
}

// Lluvia de emojis
export function lluviaEmojis(emojis = ['🎓', '🎉', '⭐', '💜'], tandas = 3) {
  let shapes
  try {
    shapes = emojis.map((e) => confetti.shapeFromText({ text: e, scalar: 2.2 }))
  } catch {
    return
  }
  for (let i = 0; i < tandas; i++)
    setTimeout(() => confetti({ shapes, scalar: 2.2, particleCount: 22, spread: 140, startVelocity: 25, gravity: 0.7, ticks: 220, origin: { x: Math.random(), y: -0.1 }, zIndex: 200 }), i * 350)
}

// Fuegos artificiales: devuelve una función para detenerlos
export function fuegosArtificiales(duracionMs = 12000) {
  const fin = Date.now() + duracionMs
  const id = setInterval(() => {
    if (Date.now() > fin) return clearInterval(id)
    const x = 0.15 + Math.random() * 0.7
    const y = 0.15 + Math.random() * 0.35
    const color = COLORES[Math.floor(Math.random() * COLORES.length)]
    confetti({ particleCount: 90, spread: 360, startVelocity: 32, gravity: 0.9, ticks: 110, decay: 0.92, scalar: 0.9, origin: { x, y }, colors: [color, '#ffffff'], zIndex: 200 })
    sonidoBoom(0.22 + Math.random() * 0.15)
  }, 550)
  return () => clearInterval(id)
}

// Frases para el cartel de cada materia aprobada (temática dev)
export const FRASES = [
  'git commit -m "materia aprobada" ✅',
  'Deploy exitoso a producción 🚀',
  '0 errores, 0 warnings ✨',
  'Build passing 🟢',
  'Merge sin conflictos 🤝',
  'Tests: 100% en verde 🧪',
  'Bug del cuatrimestre: resuelto 🐛🔨',
  '¡Una menos! El Politécnico tiembla 🏛️',
]
export const frase = () => FRASES[Math.floor(Math.random() * FRASES.length)]
