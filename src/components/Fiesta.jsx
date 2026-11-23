import { useEffect, useRef } from 'react'
import { GRADUACION } from '../data/materias'
import { daysUntil } from '../lib/dates'
import { bailar, fuegosArtificiales, lanzarConfeti, lluviaEmojis, sonidoVictoria, vibrar } from '../lib/fiesta'
import { Bailarin } from './ui'

const VIDEO = '3GwjfUFyY6M'
const FLOTANTES = ['🎓', '🎉', '🥳', '⭐', '💜', '🚀', '🏆', '✨', '🎆', '💻']

// Pantalla de festejo total: se abre al aprobar las 8 materias.
export default function Fiesta({ onClose }) {
  const parar = useRef(null)

  const festejar = () => {
    parar.current?.()
    parar.current = fuegosArtificiales(12000)
    lanzarConfeti()
    lluviaEmojis(['🎓', '🎉', '🏆', '💜', '⭐'], 5)
    sonidoVictoria()
    bailar(3000)
    vibrar([120, 60, 120, 60, 300])
  }

  useEffect(() => {
    document.body.classList.add('fiesta')
    festejar()
    const k = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', k)
    return () => {
      parar.current?.()
      document.body.classList.remove('fiesta')
      document.removeEventListener('keydown', k)
    }
  }, [])

  const dias = daysUntil(GRADUACION.inicio)

  return (
    <div className="fiesta-bg" role="dialog" aria-modal="true" aria-label="¡Aprobaste todas las materias!">
      <div className="flotantes" aria-hidden="true">
        {Array.from({ length: 18 }, (_, i) => (
          <span key={i} style={{ '--x': `${(i * 37) % 100}%`, '--d': `${6 + (i % 5)}s`, '--del': `${(i * 0.7) % 6}s` }}>{FLOTANTES[i % FLOTANTES.length]}</span>
        ))}
      </div>
      <div className="fiesta-card">
        <p className="fiesta-eyebrow">8 / 8 materias aprobadas</p>
        <h1 className="fiesta-titulo">
          <Bailarin texto="¡LO LOGRASTE," arcoiris />
          <br />
          <Bailarin texto="MÁXIMO!" arcoiris />
        </h1>
        <p className="fiesta-sub">Técnico Superior en Desarrollo de Software Multiplataforma… casi 😉</p>
        <p className="fiesta-defensa">
          {dias > 0 ? <>Solo queda la <strong>defensa pública</strong>: faltan <strong>{dias}</strong> días</> : <>¡Es la semana de la <strong>defensa pública</strong>! A romperla 💪</>}
        </p>
        <div className="fiesta-video">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${VIDEO}?autoplay=1&rel=0&playsinline=1`}
            title="Canción del festejo"
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        </div>
        <a className="link small" href={`https://youtu.be/${VIDEO}`} target="_blank" rel="noreferrer">¿No suena? Abrir en YouTube ↗</a>
        <div className="fiesta-acciones">
          <button className="btn btn-primary" onClick={festejar}>🎆 ¡Más fuegos!</button>
          <button className="btn btn-ghost" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  )
}
