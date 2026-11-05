# Organizador Facultad — Colman Máximo

Landing/app para organizar el 2º cuatrimestre de la **Tecnicatura Superior en Desarrollo de Software Multiplataforma** (2º año, Instituto Politécnico) hasta la **defensa pública del 1 al 4 de diciembre**.

## Qué tiene
- **Inicio:** cuenta regresiva a la defensa, alertas (vencidas o a ≤ 3 días), clases de hoy, próximas fechas, progreso por materia.
- **Materias (8):** estado (cursando / en riesgo / aprobada), asistencia, forma de evaluación, notas, fechas y tareas.
- **Tareas:** título, materia, consigna, fecha límite, estado, **adjuntos (PDF, docx, zip, imágenes…) y links** de documentación.
- **Calendario:** mensual, con exámenes/entregas/tareas; tocar un día muestra lo anotado y las clases.
- **Horario:** grilla semanal (escritorio) y vista por día (celular).
- **Notificaciones** del navegador para lo que vence pronto. Backup exportar/importar JSON.

## Desarrollo
```bash
npm install
npm run dev
```

## Datos y sincronización
- **Sin configurar nada:** todo se guarda en el navegador (localStorage + IndexedDB para archivos). PC y celular **no** se sincronizan.
- **Con Supabase (gratis):** login con email y sincronización PC ↔ celular, adjuntos en Storage privado.
  1. Crear proyecto en supabase.com → SQL Editor → ejecutar `supabase/schema.sql`.
  2. Copiar `Project URL` y `anon key` (Settings → API).
  3. GitHub → repo → Settings → Secrets and variables → Actions → crear `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
  4. En Render, cargar las mismas variables. Local: copiar `.env.example` a `.env`.
  5. (Opcional) Supabase → Authentication → desactivar "Confirm email" para no tener que confirmar.

## Deploy
- **GitHub Pages:** cada push a `main` despliega con `.github/workflows/deploy.yml`. Si falla la primera vez: repo → Settings → Pages → Source: **GitHub Actions**. URL: `https://maxicolmena.github.io/organizador-facultad-colman/`.
- **Render (plan free):** New → Blueprint → elegir este repo (usa `render.yaml`). Sirve la app con `node server.js` y expone `GET /health`. El plan free se duerme tras ~15 min sin uso (el primer acceso tarda ~1 min).
