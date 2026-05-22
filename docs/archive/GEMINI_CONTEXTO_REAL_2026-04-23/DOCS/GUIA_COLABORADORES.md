# Guia para Colaboradores

## 1. Objetivo
Acelerar el onboarding de nuevos integrantes y reducir errores de coordinacion tecnica.

## 2. Estructura del repositorio
- `tutorpaes/backend`: API, modelos, servicios, migraciones.
- `tutorpaes/frontend`: interfaz web, rutas App Router, capa API cliente.
- `DOCS`: documentacion tecnica y operativa.
- `scripts`: automatizaciones de arranque y smoke.

## 3. Flujo de trabajo recomendado
1. Sincronizar rama principal.
2. Crear rama corta por objetivo.
3. Implementar cambios pequenos y verificables.
4. Ejecutar pruebas locales del modulo tocado.
5. Abrir PR con contexto, impacto y evidencias.

## 4. Reglas de codigo
- Comentarios en espanol tecnico.
- Evitar comentarios redundantes.
- Mensajes de error claros y accionables.
- No agregar secretos en codigo o docs.

## 5. Reglas de documentacion
- Sin emojis.
- Titulos y secciones consistentes.
- Incluir objetivo, pasos, resultado esperado y riesgos.
- Actualizar docs si cambia el comportamiento funcional.

## 6. Protocolo de validacion minima
1. Backend health en verde.
2. Build frontend exitoso.
3. Login y ruta protegida funcionando.
4. Flujo critico del modulo afectado validado.

## 7. Areas criticas del proyecto
- Auth y sesion.
- Quiz y registro de intentos.
- Integracion de pagos.
- Integracion IA.
- Configuracion de seguridad y variables de entorno.

## 8. Buenas practicas de colaboracion
- Documentar supuestos tecnicos.
- Evitar cambios no relacionados en la misma PR.
- Si se detecta deuda tecnica, registrar accion concreta y prioridad.
- Priorizar claridad por sobre complejidad.

## 9. Primeras tareas sugeridas para nuevos colaboradores
1. Levantar entorno local completo.
2. Ejecutar QA funcional minimo.
3. Revisar endpoints de auth y quiz.
4. Corregir un issue acotado con pruebas de regresion.
