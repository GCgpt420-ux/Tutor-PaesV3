# Diseno: Cierre Operativo e Investigacion de Tutor PAES

## Estado

- Aprobado por el propietario del proyecto el 2026-08-22.
- Repositorio canonico: `/home/gabriel/Escritorio/Proyectos2026/Tutor-PaesV3`.
- Objetivo: obtener una demo estable y una base para piloto controlado, sin ampliar funcionalidades por defecto.

## Objetivos

El trabajo tendra dos resultados paralelos:

1. Demostrar que el flujo estudiante funciona de extremo a extremo.
2. Explicar y evaluar todos los modulos para respaldar el proyecto de carrera.

La investigacion priorizara evidencia de ejecucion, contratos entre componentes, pruebas y riesgos. No dependera de revisar manualmente cada linea de codigo.

## Alcance operativo primario

El nucleo bloqueante para declarar una base operativa sera:

- registro e inicio de sesion;
- catalogo y seleccion;
- inicio y resolucion de quiz;
- resultados y progreso;
- tutor IA, fallback y errores visibles.

## Alcance academico secundario

Se analizaran, aunque no bloqueen el primer piloto:

- modulo docente;
- pagos y facturacion;
- voz y TTS;
- administracion;
- seguridad;
- observabilidad;
- despliegue, backup y rollback;
- procesamiento y calidad del contenido.

Cada modulo recibira una decision explicita: `conservar`, `corregir`, `posponer` o `migrar`.

## Metodo de evidencia

El levantamiento usara:

- mapa de rutas API y pantallas;
- relaciones frontend, backend y base de datos;
- dependencias y puntos de integracion;
- pruebas automatizadas y smoke tests;
- scripts de arranque, seeds y operacion;
- configuracion y variables de entorno;
- errores, placeholders y TODOs;
- diferencias entre documentacion y codigo real.

Cada modulo se describira con proposito, entradas, proceso, salidas, dependencias, estado, riesgo, evidencia y decision.

## Fases

1. Levantar el estado real del repositorio canonico y los comandos reproducibles.
2. Construir el mapa funcional y tecnico por capacidades.
3. Validar el flujo estudiante completo y registrar evidencia.
4. Auditar los modulos secundarios y clasificar su deuda.
5. Aplicar solo saneamiento que afecte operacion, reproducibilidad, seguridad basica o comprension.
6. Ejecutar tests, typecheck, smoke tests y pruebas de arranque.
7. Emitir criterios de cierre, deuda restante y decision de migracion.

## Documentacion externa en Obsidian

La documentacion de investigacion vivira fuera del repositorio, en:

`/home/gabriel/Memoria semantica/TutorPAES/Investigacion-Cierre-Operativo/`

Su estructura aprobada es:

```text
00-INDICE-Y-OBJETIVO.md
01-ESTADO-INICIAL.md
02-MAPA-FUNCIONAL.md
03-ARQUITECTURA-EXPLICADA.md
04-FLUJO-ESTUDIANTE.md
05-ANALISIS-DE-MODULOS/
06-MATRIZ-DEUDA-TECNICA.md
07-PLAN-DE-ESTABILIZACION.md
08-PLAN-DE-PRUEBAS-PILOTO.md
09-CRITERIOS-DE-CIERRE.md
10-DECISION-MIGRACION.md
evidencias/
```

## Criterios de cierre

### Demo estable

- El flujo estudiante puede ejecutarse sin asistencia constante.
- Los errores principales son visibles y comprensibles.
- Las pruebas existentes relevantes pasan.
- El arranque y la configuracion estan documentados.

### Piloto controlado

- El contenido inicial tiene revision humana.
- El fallback de IA funciona ante fallas o ausencia de proveedor.
- Hay evidencia de uso, errores y latencia basica.
- Existe respaldo y procedimiento de recuperacion.
- Hay limites de costo y un canal de feedback.
- Se puede retirar o desactivar contenido defectuoso.

No se declarara que el MAI mejora el aprendizaje solo por funcionar tecnicamente. Esa afirmacion requerira evidencia de uso y evaluacion pedagogica posterior.

## Fuera de alcance inicial

- Nuevas funcionalidades no necesarias para el flujo estudiante.
- Reescritura completa del sistema.
- Migracion inmediata a otro repositorio.
- Refactors amplios sin riesgo o beneficio demostrable.
