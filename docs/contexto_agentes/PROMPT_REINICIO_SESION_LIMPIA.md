# 🚀 Prompt para Iniciar una Nueva Sesión Limpia en TutorPAES

> **Instrucciones para Gabriel:**
> Cuando abras una nueva ventana o sesión en Herdr / Antigravity, copia y pega el siguiente bloque de texto en el primer mensaje. Con esto, el nuevo agente cargará automáticamente la memoria de Obsidian, sabrá exactamente qué hace cada agente en Herdr y no perderá tiempo repitiendo lo que ya hicimos.

```markdown
Hola. Estamos en el sprint final de desarrollo de **Tutor PAES V3** (`/home/gabriel/Escritorio/Proyectos2026/Tutor-PaesV3`).

### 1. Contexto Canónico y Memoria en Obsidian
Toda la documentación técnica y estado del proyecto está centralizada en la bóveda:
`/home/gabriel/Memoria semantica/TutorPAES/`
- `ESTADO-MAESTRO.md`: Estado consolidado del proyecto al 30 de Septiembre de 2026 (95% de preparación técnica).
- `Contexto-Agentes-2026-09/07_DATASET_DEMRE_2026_AUDITADO.md`: Banco de preguntas oficial (329 preguntas DEMRE 2026 auditadas con figuras 300 DPI, KaTeX y fichas semánticas).
- `Contexto-Agentes-2026-09/08_PLAN_OPERATIVO_PILOTO_OCTUBRE.md`: Plan de los 2 pilotos (Sábado: 20 alumnos en la universidad; Próxima semana: 10 alumnos en colegio con hermano profesor; Noviembre: Feria de software con identidad del diseñador).
- `Contexto-Agentes-2026-09/09_ESTADO_HERDR_Y_AGENTES.md`: Mapeo de paneles Herdr (`w3:p1`, `w3:p2`, `w3:p3`) y comandos de comunicación.
- `Contexto-Agentes-2026-09/06_GENERATIVE_UI_SPECIFICATION.md`: Especificación de Generative UI (`[WIDGET:PARABOLA|...]`).

### 2. Entorno Herdr y Worktrees Activos
Estamos trabajando en el workspace **`w3`** de Herdr:
- **`w3:p1` (Tú / Orquestador Agy):** Coordinación, base de datos y despliegue/túneles (`/home/gabriel/`).
- **`w3:p2` (Agy2 / Backend FastAPI):** Worktree `.worktrees/sprint-backend/` (HEAD `cece03c`).
- **`w3:p3` (Claude Code / Frontend Next.js 16):** Worktree `.worktrees/sprint-frontend/` (HEAD `6e56652`).
- Dataset de 329 preguntas listo en:
  `/home/gabriel/Escritorio/Proyectos2026/Procesamiento_Datos_Psu/salida_lista_hoy/preguntas_demre_2026_auditadas_final.jsonl`

### 3. Tareas Inmediatas a Ejecutar
1. **Backend (Agy2 en `w3:p2`):**
   - Actualizar `tutorpaes/backend/scripts/seed_paes_data.py` para sembrar las 329 preguntas oficiales DEMRE 2026 en PostgreSQL.
   - Crear `scripts/seed_pilot_users.py` con 20 cuentas pre-sembradas (`alumno01-20@tutorpaes.cl` con clave `paes2026`) + cuenta docente (`profesor.hermano@tutorpaes.cl`).
2. **Frontend (Claude en `w3:p3`):**
   - Implementar la Tarea 1 de GenUI: Intercepción de `[WIDGET:PARABOLA|args]` en `use-ai-tutor.ts` y componente interactivo con Tailwind.
   - Implementar el "Puente Explicación -> Tutor IA" y la "Pantalla de Debrief con Estimador de Puntaje PAES (100-1000)".
3. **Infraestructura (Orquestador):**
   - Verificar `./scripts/start-local-tunnel.sh` (Cloudflare Santiago) para dar acceso público a los 20 alumnos el sábado.

Para dar la orden a los agentes en Herdr puedes ejecutar:
- `herdr agent prompt w3:p2 "Inicia Tarea 1: actualizar seed_paes_data.py con las 329 preguntas de preguntas_demre_2026_auditadas_final.jsonl"`
- `herdr agent prompt w3:p3 "Inicia Tarea 1: implementar widget de parábola en use-ai-tutor.ts"`

Por favor, confirma que leíste `ESTADO-MAESTRO.md` y arranquemos de inmediato con la inyección del dataset en PostgreSQL.
```
