# 07 — Dataset Oficial DEMRE 2026 Auditado y Saneado

**Proyecto:** Tutor PAES V3 / Procesamiento Datos PSU  
**Fecha de Consolidación:** 30 de Septiembre de 2026  
**Auditoría y Certificación:** 100% Verificado con KaTeX, PyMuPDF e Inspección Visual  
**Archivo Canónico de Producción:**  
`/home/gabriel/Escritorio/Proyectos2026/Procesamiento_Datos_Psu/salida_lista_hoy/preguntas_demre_2026_auditadas_final.jsonl`

---

## 1. Resumen Ejecutivo del Banco de Preguntas

El banco de datos original (508 preguntas con OCR imperfecto) ha sido sustituido por la extracción digital vectorial directa de los **Ensayos Oficiales DEMRE Proceso de Admisión 2026** (extraídos de los PDFs oficiales de `/home/gabriel/Descargas/Procesamiento base de datos/`).

* **Total de Preguntas Auditadas:** 342 preguntas oficiales
* **Preguntas Aprobadas (Nivel Oro / Producción):** **329 preguntas (96.2%)**
* **Preguntas Descartadas:** **13 preguntas (3.8%)** (exclusivamente aquellas donde las alternativas son figuras/diagramas que no admiten texto).
* **Calidad de Fórmulas:** 100% KaTeX validado con delimitadores `$ ... $` para inline y `$$ ... $$` para bloque. Fracciones, exponentes, raíces y vectores corregidos.
* **Recursos Visuales:** 100% de las figuras requeridas están recortadas a 300 DPI en `/home/gabriel/Escritorio/Proyectos2026/Procesamiento_Datos_Psu/salida_lista_hoy/imagenes_2026/` y cuentan con **Ficha Semántica** para que el Tutor Socrático de IA comprenda el contexto visual.

---

## 2. Desglose por Materia (329 Preguntas Aprobadas)

| Asignatura | Código | Preguntas Aprobadas | Descartadas | Estado Pedagógico |
| :--- | :---: | :---: | :---: | :--- |
| **Matemática M1** | `M1` | **43** | 2 | Álgebra, números, funciones, potencias y geometría con figuras PNG y KaTeX limpio. |
| **Matemática M2** | `M2` | **36** | 2 | Fórmulas avanzadas, logaritmos, trigonometría y combinatoria auditadas. |
| **Ciencias - Biología** | `BIO` | **53** | 3 | Genética mendeliana, biología celular y ecología con diagramas y tablas en Markdown. |
| **Ciencias - Física** | `FIS` | **53** | 3 | Cinemática, dinámica, ondas, óptica y circuitos eléctricos con unidades normalizadas. |
| **Ciencias - Química** | `QUI` | **53** | 3 | Reacciones, estequiometría, disoluciones y química orgánica formateadas en KaTeX. |
| **Historia y Cs. Sociales** | `HIST` | **45** | 0 | 100% texto puro oficial. Citas históricas, fuentes y cronología impecables. |
| **Competencia Lectora** | `LENG` | **46** | 0 | 100% textos de lectura íntegros (>200 palabras) vinculados por grupo de preguntas. |
| **TOTAL GENERAL** | — | **329** | **13** | **7 Pruebas completas listas para la base de datos.** |

---

## 3. Las 13 Preguntas Descartadas (Alternativas en Figuras)

Estas preguntas fueron descartadas y registradas en `salida_lista_hoy/auditoria_manual_decisiones.json` porque sus alternativas $A, B, C, D, E$ en el PDF oficial son figuras geométricas o esquemas gráficos, por lo que el alumno no puede responderlas en texto ni la IA evaluarlas por string:

1. `Quimica_q23`: Óptica / lentes (alternativas con diagramas de formación de imágenes).
2. `Biologia_q23`: Duplicado idéntico de la lente del módulo común.
3. `Fisica_q05`: Duplicado idéntico de la lente del módulo común.
4. `Matematicas_q49`: Construcción geométrica con regla y compás (alternativas con dibujos).
5. `Matematicas_q57`: Infografía / pictogramas de datos de empleo.
6. `Matematicas_M2_q27`: 4 planos cartesianos con gráficos de funciones en las alternativas.
7. `Matematicas_M2_q50`: 4 gráficas de funciones de densidad de probabilidad.
8. `Biologia_q77`: 4 gráficos cartesianos de actividad fotosintética vs temperatura.
9. `Biologia_q80`: 4 esquemas microscópicos de pelo de perezoso.
10. `Fisica_q62`: 5 trazados ópticos de reflexión en espejos cóncavos.
11. `Fisica_q67`: 4 diagramas de vectores de fuerza (cuerpo libre).
12. `Quimica_q65`: 4 representaciones moleculares 3D con esferas.
13. `Quimica_q67`: 4 estructuras químicas con enlaces dibujados.

---

## 4. Contrato de Datos JSONL (`preguntas_demre_2026_auditadas_final.jsonl`)

Cada línea del archivo contiene un objeto JSON con el siguiente esquema estricto:

```json
{
  "number": 1,
  "subject": "Matematicas",
  "question": "Enunciado con KaTeX validado como $\\frac{a}{b} = c$...",
  "options": {
    "A": "Alternativa A limpia",
    "B": "Alternativa B limpia",
    "C": "Alternativa C limpia",
    "D": "Alternativa D limpia"
  },
  "respuesta_correcta": "B",
  "explicacion_breve": "Respuesta oficial DEMRE 2026: Alternativa B.",
  "reading_passage_texto": null,
  "reading_passage_titulo": null,
  "requires_image": true,
  "image_path": "imagenes_2026/matematicas_q01.png",
  "figura_descripcion_semantica": "- TIPO DE RECURSO: Plano cartesiano...\n- ELEMENTOS: Vértices (0,0), (2,4)...\n- GUÍA PARA EL TUTOR IA: El estudiante debe identificar la pendiente...",
  "page": 3,
  "source_file": "Matematicas_M1_2026.pdf",
  "image_verified": true,
  "audit_status": "aprobada",
  "etiqueta": "reparacion_con_ia"
}
```

---

## 5. Mapeo a la Base de Datos PostgreSQL de TutorPAES

El script seeder (`tutorpaes/backend/scripts/seed_paes_data.py`) inserta estos registros directamente en las tablas normalizadas:

* `questions.prompt` $\leftarrow$ `item["question"]`
* `questions.explanation` $\leftarrow$ `item["explicacion_breve"]`
* `questions.reading_text` $\leftarrow$ `item["reading_passage_texto"]`
* `questions.image_url` $\leftarrow$ `/static/imagenes_2026/{item["image_path"]}`
* `question_choices` $\leftarrow$ iteración de `item["options"]`, marcando `is_correct = (label == item["respuesta_correcta"])`.
* `questions.difficulty` $\leftarrow$ `2` (PAES media oficial).
* `questions.question_type` $\leftarrow$ `"mcq"`.
