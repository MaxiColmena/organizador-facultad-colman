// Adjuntos: IndexedDB en modo local, Supabase Storage si hay sesión.
import { supabase, BUCKET } from './supabase'

const DB = 'organizador-files'
const STORE = 'files'

function idb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}
async function tx(mode, fn) {
  const db = await idb()
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode)
    const r = fn(t.objectStore(STORE))
    t.oncomplete = () => resolve(r?.result)
    t.onerror = () => reject(t.error)
  })
}

const remotePath = (userId, att) => `${userId}/${att.id}-${att.nombre.replace(/[^\w.-]+/g, '_')}`

export async function guardarArchivo(file, att, userId) {
  if (supabase && userId) {
    const { error } = await supabase.storage.from(BUCKET).upload(remotePath(userId, att), file, { upsert: true })
    if (error) throw error
    return { ...att, remoto: true }
  }
  await tx('readwrite', (s) => s.put(file, att.id))
  return att
}

export async function abrirArchivo(att, userId) {
  // Abrir la pestaña antes del await evita el bloqueo de pop-ups (sobre todo en celular).
  const win = window.open('', '_blank')
  try {
    const url = await urlArchivo(att, userId)
    if (win) win.location.href = url
    else window.location.href = url
  } catch (e) {
    win?.close()
    throw e
  }
}

async function urlArchivo(att, userId) {
  let url
  if (att.remoto) {
    if (!supabase || !userId) throw new Error('Iniciá sesión para abrir este archivo')
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(remotePath(userId, att), 300)
    if (error) throw error
    url = data.signedUrl
  } else {
    const blob = await tx('readonly', (s) => s.get(att.id))
    if (!blob) throw new Error('Archivo no encontrado en este dispositivo')
    url = URL.createObjectURL(blob)
  }
  return url
}

export async function borrarArchivo(att, userId) {
  try {
    if (att.remoto && supabase && userId) await supabase.storage.from(BUCKET).remove([remotePath(userId, att)])
    else await tx('readwrite', (s) => s.delete(att.id))
  } catch (e) {
    console.warn('No se pudo borrar el archivo', e)
  }
}

export const fmtTamano = (b) => (b < 1024 ? `${b} B` : b < 1048576 ? `${(b / 1024).toFixed(0)} KB` : `${(b / 1048576).toFixed(1)} MB`)
