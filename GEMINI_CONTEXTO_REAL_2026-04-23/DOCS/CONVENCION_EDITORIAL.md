# Convención Editorial del Proyecto

## 1. Objetivo
Definir un estándar único para nombres, comentarios, mensajes y estructura documental en todo el repositorio.

## 2. Idioma y tono
1. Idioma oficial: español técnico.
2. Tono: claro, directo y orientado a acción.
3. Evitar jerga innecesaria y frases ambiguas.
4. No usar emojis en documentación, código ni mensajes visibles.

## 3. Convenciones de nombres
## 3.1 Archivos de documentación
- Formato: MAYUSCULAS_CON_GUION_BAJO.md para documentos transversales.
- Ejemplos:
  - `BASES_SEGURIDAD.md`
  - `PROCESOS_OPERATIVOS.md`
- Para documentos específicos de fase: `PHASE_X_NOMBRE.md`.

## 3.2 Secciones y encabezados
- Usar encabezados en estilo frase, no todo en mayúsculas.
- Estructura mínima recomendada:
  1. Estado del documento
  2. Objetivo
  3. Alcance
  4. Procedimiento o contenido principal
  5. Criterios de validación
  6. Referencias relacionadas

## 4. Comentarios en código
1. Escribir comentarios en español.
2. Comentar intención y decisión, no lo obvio.
3. Mantener comentarios cortos y mantenibles.
4. Evitar comentarios desactualizados; eliminar si ya no aplican.

## 5. Mensajes de error y logs
1. Priorizar mensajes accionables.
2. Estructura recomendada para backend:
   - Contexto
   - Causa resumida
   - Acción sugerida
3. Evitar exponer secretos o datos sensibles en logs.
4. Mantener consistencia por módulo (auth, quiz, payments, ai).

## 6. Estructura de documentación
## 6.1 Roles documentales
- Documento canónico: fuente principal del tema.
- Documento operativo: pasos de ejecución y runbooks.
- Documento de reporte: evidencia de validación o estado histórico.

## 6.2 Política anti redundancia
1. Cada tema debe tener un documento canónico.
2. Otros documentos deben referenciar al canónico en vez de duplicar contenido.
3. Si una sección se repite en más de un archivo, reemplazar por enlace interno.

## 7. Estándar de mantenimiento
1. Al cambiar comportamiento funcional, actualizar la documentación asociada en la misma entrega.
2. Toda entrega debe indicar:
   - Qué cambió
   - Qué se validó
   - Qué riesgo queda pendiente
3. Revisar coherencia documental al cierre de cada sprint.

## 8. Checklist editorial para PR
- Texto en español técnico.
- Sin emojis.
- Encabezados consistentes.
- Enlaces internos válidos.
- Sin duplicación innecesaria.
- Logs y mensajes coherentes con estándar.

## 9. Gobernanza
- Owner sugerido: líder técnico o maintainer del módulo.
- Revisión editorial mínima: 1 aprobador técnico por documento canónico.
