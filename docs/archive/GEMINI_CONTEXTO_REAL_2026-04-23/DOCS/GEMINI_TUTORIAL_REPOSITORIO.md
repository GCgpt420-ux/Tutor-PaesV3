# Tutorial para Gemini: analizar este repositorio sin inventar

Objetivo: que Gemini trabaje con evidencia real del repo, minimizando conclusiones falsas por documentos históricos o contexto incompleto.

## 1) Prompt base (copiar y pegar en Gemini)

Usa este prompt como mensaje inicial:

Eres analista técnico de software. Debes analizar un repositorio de forma estricta y basada en evidencia.

Reglas obligatorias:
1. No inventes archivos, endpoints, features ni estados de implementación.
2. Si no hay evidencia explícita en código o documentación canónica, responde: "No verificado en repositorio".
3. Distingue siempre entre documentación vigente y documentación histórica.
4. Prioriza este orden de lectura:
   - DOCS/LECTURA_RAPIDA_IA.md
   - DOCS/INDICE_MAESTRO_COLABORADORES.md
   - DOCS/REFERENCIA_DE_ARCHIVOS.md
   - README.md
   - Código real en tutorpaes/backend y tutorpaes/frontend
5. Los archivos con prefijo ARCHIVADO_ son históricos y no deben usarse como fuente principal de estado actual.
6. Antes de concluir, valida cada afirmación con al menos una referencia de archivo.

Formato de salida obligatorio:
- Hechos verificados
- Supuestos pendientes de verificación
- Riesgos de interpretación
- Evidencia consultada (lista de rutas)

Si detectas contradicciones entre documentos, prioriza código real y marca la inconsistencia.

## 2) Modo de trabajo recomendado para Gemini

Pide a Gemini que siga esta secuencia:

1. Construir mapa de repo: carpetas principales y servicios.
2. Leer solo documentos canónicos primero.
3. Contrastar afirmaciones importantes directamente en código.
4. Separar hallazgos en:
   - Confirmado por código
   - Confirmado solo por docs
   - No confirmado
5. Entregar conclusiones con nivel de confianza (alto, medio, bajo).

## 3) Plantilla de preguntas (para evitar respuestas ambiguas)

Cuando le pidas algo a Gemini, usa preguntas cerradas y verificables:

- "¿Qué endpoints activos de IA existen hoy? Lista ruta de archivo + función."
- "¿Qué partes del flujo de frontend consumen el endpoint X?"
- "¿Qué quedó solo en documentación y no en código implementado?"
- "¿Qué está en ARCHIVADO_ y qué impacto tiene hoy?"

Evita pedir: "hazme un diagnóstico general" sin alcance ni criterio de evidencia.

## 4) Checklist anti-alucinación

Antes de aceptar la respuesta de Gemini, revisa:

1. ¿Cada afirmación técnica cita archivos concretos?
2. ¿Separó claramente histórico vs vigente?
3. ¿Reconoció incertidumbre donde faltaba evidencia?
4. ¿No mezcló docs antiguos con estado actual?
5. ¿La conclusión coincide con el código real?

Si falla alguno, pedir nueva respuesta con este texto:

"Rehaz el análisis con trazabilidad estricta a archivos y marca como no verificado cualquier punto sin evidencia explícita."

## 5) Convención para este repositorio

Para este proyecto, considera canónico:

- Estado funcional: código en tutorpaes/backend y tutorpaes/frontend.
- Contexto editorial y operativo: DOCS/INDICE_MAESTRO_COLABORADORES.md y DOCS/REFERENCIA_DE_ARCHIVOS.md.
- Contexto histórico: archivos DOCS/ARCHIVADO_*.md.

Regla final: en caso de conflicto, gana el código.