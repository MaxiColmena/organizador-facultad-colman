import { useStore } from '../lib/store'
import { abrirArchivo } from '../lib/files'
import { Fecha, Icon, MateriaTag } from './ui'

export default function TareaItem({ t, onEdit, mostrarMateria = true }) {
  const { toggleTarea, borrarTarea, user } = useStore()
  const done = t.estado === 'completada'
  return (
    <li className={`tarea ${done ? 'done' : ''}`}>
      <button className={`checkbox ${done ? 'on' : ''}`} onClick={() => toggleTarea(t.id)} aria-label={done ? 'Marcar pendiente' : 'Marcar completada'}>
        {done && <Icon name="check" size={14} />}
      </button>
      <div className="tarea-main" onClick={() => onEdit(t)}>
        <div className="tarea-title">{t.titulo}</div>
        <div className="tarea-meta">
          {mostrarMateria && <MateriaTag id={t.materia} />}
          {t.fecha ? (done ? <span className="fecha">{t.fecha.split('-').reverse().join('/')}</span> : <Fecha fecha={t.fecha} />) : <span className="fecha">sin fecha</span>}
          <span className={`estado ${done ? 'ok' : ''}`}>{done ? 'Completada' : 'Pendiente'}</span>
        </div>
        {(t.adjuntos?.length > 0 || t.links?.length > 0) && (
          <div className="tarea-docs" onClick={(e) => e.stopPropagation()}>
            {t.adjuntos.map((a) => (
              <button key={a.id} className="chip" onClick={() => abrirArchivo(a, user?.id).catch((e) => alert(e.message))}>
                <Icon name="file" size={13} /> {a.nombre}
              </button>
            ))}
            {t.links.map((l) => (
              <a key={l.id} className="chip" href={l.url} target="_blank" rel="noreferrer">
                <Icon name="link" size={13} /> {l.label}
              </a>
            ))}
          </div>
        )}
      </div>
      <div className="tarea-actions">
        <button className="icon-btn" onClick={() => onEdit(t)} aria-label="Editar"><Icon name="edit" size={16} /></button>
        <button className="icon-btn" onClick={() => confirm(`¿Borrar "${t.titulo}"?`) && borrarTarea(t.id)} aria-label="Borrar"><Icon name="trash" size={16} /></button>
      </div>
    </li>
  )
}
