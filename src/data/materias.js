// Materias del 2º cuatrimestre — TS-DSM 2º año (Instituto Politécnico)
export const MATERIAS = [
  {
    id: 'pp3',
    nombre: 'Práctica Profesional III',
    corto: 'Práctica Prof. III',
    color: '#22c55e',
    evaluacion: 'Defensa de proyecto',
  },
  {
    id: 'redes',
    nombre: 'Redes y Seguridad',
    corto: 'Redes',
    color: '#fb923c',
    evaluacion: 'Trabajo práctico evaluativo',
  },
  {
    id: 'tlp4',
    nombre: 'Taller de Lenguajes de Programación IV',
    corto: 'TLP IV',
    color: '#8b5cf6',
    evaluacion: '2 parciales + recuperatorio',
  },
  {
    id: 'arf',
    nombre: 'Análisis de la Realidad Formoseña',
    corto: 'Realidad Formoseña',
    color: '#94a3b8',
    evaluacion: 'A definir',
  },
  {
    id: 'flexmind',
    nombre: 'Taller Complementario – FlexMind',
    corto: 'FlexMind',
    color: '#38bdf8',
    evaluacion: 'Examen (a confirmar)',
  },
  {
    id: 'rn2',
    nombre: 'Taller Complementario – React Native II',
    corto: 'React Native II',
    color: '#d946ef',
    evaluacion: 'A definir',
  },
  {
    id: 'ia',
    nombre: 'Seminario de Actualización Complementario – Modelos y Aplicaciones de la IA',
    corto: 'Modelos de IA',
    color: '#f472b6',
    evaluacion: 'A definir',
  },
  {
    id: 'ciber',
    nombre: 'Seminario de Actualización III – Ciberseguridad',
    corto: 'Ciberseguridad',
    color: '#3b82f6',
    evaluacion: 'Trabajo evaluativo',
  },
]

export const materiaById = (id) => MATERIAS.find((m) => m.id === id)

// 1 = lunes ... 5 = viernes
export const HORARIO = [
  { dia: 1, inicio: '09:00', fin: '11:00', materia: 'pp3' },
  { dia: 1, inicio: '11:00', fin: '13:00', materia: 'redes' },
  { dia: 1, inicio: '14:00', fin: '17:00', materia: 'ia' },

  { dia: 2, inicio: '09:00', fin: '13:00', materia: 'tlp4' },
  { dia: 2, inicio: '14:00', fin: '16:00', materia: 'ia' },
  { dia: 2, inicio: '16:00', fin: '17:00', materia: 'pp3' },

  { dia: 3, inicio: '09:00', fin: '11:00', materia: 'arf' },
  { dia: 3, inicio: '11:00', fin: '13:00', materia: 'redes' },
  { dia: 3, inicio: '14:00', fin: '17:00', materia: 'tlp4' },

  { dia: 4, inicio: '09:00', fin: '13:00', materia: 'flexmind' },
  { dia: 4, inicio: '14:00', fin: '17:00', materia: 'pp3' },

  { dia: 5, inicio: '09:00', fin: '13:00', materia: 'rn2' },
  { dia: 5, inicio: '14:00', fin: '17:00', materia: 'ciber' },
]

export const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

export const GRADUACION = { inicio: '2026-12-01', fin: '2026-12-04' }

export const TIPOS_EVENTO = {
  institucional: 'Institucional (cierre, inscripción…)',
  periodo: 'Período (varios días)',
  feriado: 'Feriado / Sin clases',
  examen: 'Examen / Parcial',
  recuperatorio: 'Recuperatorio',
  entrega: 'Entrega / TP',
  defensa: 'Defensa / Exposición',
  otro: 'Otro',
}

// Fechas conocidas al crear la app
export const EVENTOS_INICIALES = [
  { id: 'ev-redes-tp', titulo: 'TP evaluativo de Redes', materia: 'redes', fecha: '2026-11-11', tipo: 'entrega' },
  { id: 'ev-pp3-def', titulo: 'Defensa de proyecto — Práctica Profesional', materia: 'pp3', fecha: '2026-11-12', tipo: 'defensa' },
  { id: 'ev-flex', titulo: 'Posible examen de FlexMind', materia: 'flexmind', fecha: '2026-11-12', tipo: 'examen', tentativo: true },
  { id: 'ev-ciber', titulo: 'Trabajo evaluativo de Ciberseguridad', materia: 'ciber', fecha: '2026-11-13', tipo: 'entrega' },
  { id: 'ev-tlp-p2', titulo: 'Segundo parcial TLP IV', materia: 'tlp4', fecha: '2026-11-17', fechaFin: '2026-11-18', tipo: 'examen' },
  { id: 'ev-tlp-rec', titulo: 'Recuperatorio TLP IV (adeudo 1er parcial)', materia: 'tlp4', fecha: '2026-11-24', fechaFin: '2026-11-25', tipo: 'recuperatorio' },
  { id: 'ev-cierre-cuatri', titulo: 'Cierre del cuatrimestre', materia: null, fecha: '2026-11-20', tipo: 'institucional' },
  { id: 'ev-defensa', titulo: 'Defensa pública — ¡Recibida!', materia: null, fecha: '2026-12-01', fechaFin: '2026-12-04', tipo: 'defensa' },
]
