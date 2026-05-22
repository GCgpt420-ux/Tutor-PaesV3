# 🚀 Análisis de Futuras Características - TutorPAES

**Fecha:** 2026-04-06  
**Autor:** AI Development Team  
**Estado:** Propuesta Estratégica

---

## 📊 Visión General

Este documento análiza las características futuras para TutorPAES basado en:
- Estado actual de la plataforma (Fase 3.2 completada)
- Necesidades de usuarios identificadas
- Oportunidades de diferenciación competitiva
- Restricciones técnicas y de negocio

---

## 🎯 Características Propuestas por Prioridad

### TIER 1: Críticas (Próximas 2-3 semanas)

#### 1. **PDF Invoice Generation** (3-5 horas)
**Descripción:** Generar boletas PDF con marca y estilo de empresa

**Impacto:** Alto (UX crítica, requisito legal en Chile)

**Técnico:**
- Usar `reportlab` o `weasyprint` para generar PDFs
- Template HTML → PDF con logo y datos fiscales
- Almacenar en S3 o filesystem local
- Actualizar `generate_invoice_pdf()` en `invoice_service.py`

**Steps:**
```python
1. Instalar: pip install reportlab weasyprint
2. Crear template HTML en app/templates/invoice.html
3. Implementar gen_pdf_from_html()
4. Actualizar invoice_service.generate_invoice_pdf()
5. Test: crear pago, descargar PDF
```

**Prioridad:** ⭐⭐⭐⭐⭐ CRÍTICA

---

#### 2. **Validación de Credenciales Transbank** (2-3 horas)
**Descripción:** Mover API keys de Transbank a variables de entorno seguras

**Impacto:** Alto (seguridad crítica)

**Técnico:**
- [ ] Remover hardcoded credentials de `transbank_service.py`
- [ ] Usar `app/core/config.py` para cargar desde `.env`
- [ ] Rotar keys en producción
- [ ] Documento de seguridad actualizado

**Referencia:** `/home/gcuevas/ia_bot_v2/DOCS/ARQUITECTURA_Y_ROADMAP_PRODUCCION.md` línea 553

**Prioridad:** ⭐⭐⭐⭐⭐ CRÍTICA

---

#### 3. **User Study Sessions Analytics** (5-7 horas)
**Descripción:** Dashboard de analytics para ver progreso del usuario

**Impacto:** Medio-Alto (retención de usuarios)

**Incluye:**
- Tiempo dedicado por asignatura
- Tasa de aciertos por tema
- Curva de aprendizaje (gráficos)
- Comparar con promedio de otros usuarios (anonimizado)
- Predicción de puntaje PAES

**Backend:**
- Endpoint `GET /api/v1/analytics/user/summary` 
- Endpoint `GET /api/v1/analytics/user/breakdown?exam_id=...`
- Caché de 1 hora (queries pesadas)

**Frontend:**
- Componente `UserAnalyticsDashboard`
- Gráficos con `recharts` o `chart.js`
- Responsive y mobile-optimized

**Prioridad:** ⭐⭐⭐⭐

---

### TIER 2: Importantes (3-4 semanas)

#### 4. **Explicaciones IA ilimitadas con Rate Limiting Inteligente**
**Descripción:** Plan gratuito limita a 5/día, premium ilimitado (ya implementado), pero meter tracking

**Impacto:** Medio (monetización)

**Cambios:**
- Endpoint `POST /api/v1/ai/explanation` ya está en `payments.py` checkear disponibilidad
- Agregar tracking: `AIUsageLog` model
- Dashboard: mostrar explicaciones usadas hoy/mes
- Alerta antes de agotar limite

**Prioridad:** ⭐⭐⭐

---

#### 5. **Playlist de Temas Recomendados** (4-6 horas)
**Descripción:** ML para sugerir qué tema estudiar basado en rendimiento

**Impacto:** Medio (engagement)

**Algoritmo:**
```python
# Pseudocódigo
weak_topics = user_performance.filter(score < average)
recommendations = weak_topics.sort_by('urgency')
                            .limit(5)
                            .shuffle()
```

**Backend:**
- Endpoint `GET /api/v1/recommendations/topics`
- Cache: 6 horas (recalcular noche 2am)

**Frontend:**
- Widget en dashboard: "Estudia hoy"
- Click → navigate a quiz del tema

**Prioridad:** ⭐⭐⭐

---

#### 6. **Guía de Estudio Personalizada** (8-10 horas)
**Descripción:** Generar roadmap personalizado con timeline

**Impacto:** Alto (UX, diferenciador)

**Incluye:**
- [x] Base de datos de temas PAES (ya existe)
- [ ] Algoritmo de planificación (estimado 10h/tema)
- [ ] UI de calendar/roadmap generada por IA
- [ ] Notificaciones de progreso
- [ ] Ajustes dinámicos según performance

**Backend:**
```python
# POST /api/v1/study-plans/generate
{
  "exam_id": 1,
  "target_score": 700,
  "available_hours_per_week": 10,
  "start_date": "2026-04-08"
}

Response:
{
  "plan_id": 1,
  "generated_at": "...",
  "weeks": [
    {
      "week": 1,
      "topics": [...],
      "estimated_hours": 10,
      "milestones": [...]
    },
    ...
  ]
}
```

**Prioridad:** ⭐⭐⭐⭐

---

### TIER 3: Mejoras (4-6 semanas)

#### 7. **Integración WhatsApp Bot Avanzada**
**Descripción:** Bot de WhatsApp con soporte multimodal (texto, imagen, voz)

**Impacto:** Muy Alto (adquisición de usuarios)

**Fase 1 - Existente:**
- [x] Bot text-based exists at `whatsapp-bot/`

**Fase 2 - Mejorada:**
- [ ] Soporte de imágenes: usuario envía foto de problema → resolver
- [ ] Soporte de voz: transcripción con Whisper → respuesta IA
- [ ] Links deeplinks: "Click para resolver en app"
- [ ] Menus interactivos (botones WhatsApp)

**Tech Stack:**
- LibreChat API o Ollama local para LLM
- Whisper para transcripción voz
- FastAPI middleware para WhatsApp hooks

**Prioridad:** ⭐⭐⭐⭐⭐ (Crecimiento)

---

#### 8. **Leaderboards y Gamificación**
**Descripción:** Ranking de usuarios y badges/achievements

**Impacto:** Medio-Alto (engagement, retención)

**Incluye:**
- Global leaderboard (top 100 este mes)
- Leaderboard por asignatura
- Badges: "Primer 700+", "3 días streak", etc.
- Privacidad: opción anónima

**Backend:**
- Redis cache para leaderboard updates
- Batch job: actualizar rankings una vez/hora
- Endpoint: `GET /api/v1/leaderboards/global?period=week`

**Frontend:**
- Página `/protected/leaderboard`
- Tu posición highlighted
- Animaciones de subida/bajada

**Prioridad:** ⭐⭐⭐

---

#### 9. **Modo Offline - Ensayos Descargables**
**Descripción:** Descargar ensayos para resolver sin internet

**Impacto:** Medio (accesibilidad)

**Incluye:**
- PWA mejorado con Service Workers
- Almacenamiento local (IndexedDB) de preguntas
- Sync automático cuando hay conexión
- Estadísticas disponibles offline

**Técnico:**
- Actualizar Service Worker
- Implementar sync background
- Caching strategy: cache-first para preguntas, network-first para respuestas

**Prioridad:** ⭐⭐⭐

---

#### 10. **Exportar Análisis a CSV/PDF**
**Descripción:** Reporte completo de progreso para usuarios/institutos

**Impacto:** Bajo-Medio (pero high-value para B2B)

**Incluye:**
- CSV: datos brutos como spreadsheet
- PDF: reporte visual estilizado
- Gráficos incrustados
- Compartible por email

**Backend:**
- `GET /api/v1/analytics/export?format=pdf&period=month`
- Usar `reportlab` para generar PDF

**Prioridad:** ⭐⭐⭐

---

### TIER 4: Premium Features (6-8 semanas)

#### 11. **1-1 Tutoring Sessions Virtual** (20-30 horas)
**Descripción:** Conectar estudiantes con tutores humanos vía Zoom/videocall

**Impacto:** Muy Alto (diferenciador premium, ingresos)

**Arch:**
```
Frontend: Schedule session UI
↓
Backend: Booking API + calendar sync
↓
Zoom/Calendly: Platform de scheduling
↓
Notifications: Email + SMS reminder
↓
Video session: External platform
↓
Post-session: Feedback + notes storage
```

**Monetización:** $15-25/sesión (comisión 70/30 platform/tutor)

**Prioridad:** ⭐⭐⭐⭐ (Revenue)

---

#### 12. **Práctica Mock PAES Completa Multi-Day**
**Descripción:** Simulación realista de la prueba PAES (4 días, horarios reales)

**Impacto:** Alto (debe ser cerrado, solo después de Fase 3)

**Incluye:**
- Exactamente mismo formato que PAES
- Restricción de tiempo real
- Pausa entre días
- Corrección automática + análisis
- Predicción puntaje basada en resultados

**Backend:**
- Nueva tabla: `MockExams`
- Endpoint: `POST /api/v1/mock-exams/start`
- Bloqueos: una mock/usuario/mes

**Prioridad:** ⭐⭐⭐⭐

---

#### 13. **Content Library Actualizable por Admin**
**Descripción:** UI para que admins suban nuevas preguntas/temas sin código

**Impacto:** Medio (mantenibilidad)

**Incluye:**
- Interfaz drag-&-drop para subir CSVs
- Validación automática
- Preview antes de publicar
- Historial de cambios + rollback

**Tech:**
- Admin panel (Next.js)
- Formidable para file uploads
- Schema validation con Pydantic

**Prioridad:** ⭐⭐⭐

---

---

## 📈 Roadmap de Implementación Sugerido

```
┌─────────────────────────────────────────────────────────────────┐
│ FASE 4: Seguridad & Monetización (2-3 semanas)                 │
├─────────────────────────────────────────────────────────────────┤
│ [x] PDF Invoices (CRÍTICA)                                      │
│ [x] Transbank credentials rotation (CRÍTICA)                    │
│ [x] Usage analytics tracking                                    │
│ [ ] AI Rate Limiting dashboard                                  │
└─────────────────────────────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────────────────────────────┐
│ FASE 5: Analytics & Engagement (3-4 semanas)                   │
├─────────────────────────────────────────────────────────────────┤
│ [ ] User analytics dashboard                                    │
│ [ ] Topic recommendations                                       │
│ [ ] Gamification/Badges                                         │
│ [ ] Study planner generation                                    │
└─────────────────────────────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────────────────────────────┐
│ FASE 6: Advanced Features (4-6 semanas)                        │
├─────────────────────────────────────────────────────────────────┤
│ [ ] WhatsApp advanced features                                  │
│ [ ] Offline mode / Progressive Web App                          │
│ [ ] Export analytics (CSV/PDF)                                  │
│ [ ] Admin dashboard for content                                 │
└─────────────────────────────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────────────────────────────┐
│ FASE 7: Premium (6-8 semanas)                                  │
├─────────────────────────────────────────────────────────────────┤
│ [ ] 1-1 Tutoring sessions                                       │
│ [ ] Mock PAES multi-day                                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 💰 Impacto Económico Estimado

| Característica | Costo Dev | ROI | Timeline | Prioridad |
|---|---|---|---|---|
| PDF Invoices | 4h | Critical | Semana 1 | ⭐⭐⭐⭐⭐ |
| Transbank Security | 2h | Critical | Semana 1 | ⭐⭐⭐⭐⭐ |
| User Analytics | 7h | Medium-High | Semana 2-3 | ⭐⭐⭐⭐ |
| Recommendations | 6h | Medium | Semana 2-3 | ⭐⭐⭐ |
| Study Planner | 10h | High | Semana 3-4 | ⭐⭐⭐⭐ |
| WhatsApp Advanced | 12h | Very High | Semana 4-6 | ⭐⭐⭐⭐⭐ |
| Tutoring Sessions | 25h | Very High | Semana 6-8 | ⭐⭐⭐⭐ |
| Mock PAES | 15h | Very High | Semana 8+ | ⭐⭐⭐⭐ |

---

## 🎓 Casos de Uso Principales

### 1. Estudiante Típico
```
Flujo: Login → Dashboard → Ensayo → Chat IA → Resultados → Recomendaciones
Mejora: Agregar estudio planificado + analytics + badges
```

### 2. Estudiante Premium
```
Flujo: Lo anterior + sesión tutoring + mock PAES + planner personalizado
```

### 3. Institución (B2B Future)
```
Dashboard admin → Upload contenido → Monitor estudiantes → Exportar reportes
```

### 4. WhatsApp User
```
Chat → Duda → Bot responde → Link a app → Paga plan → Acceso full
```

---

## 🔒 Consideraciones de Seguridad

- ✅ IDOR guards ya implementados
- ✅ Rate limiting en endpoints
- [ ] JWT token expiration handling mejorado
- [ ] 2FA para modo admin
- [ ] Audit logs para acciones críticas
- [ ] HTTPS en todas las rutas
- [ ] Content Security Policy (CSP) headers

---

## 📊 Métricas de Éxito

Para cada feature, medir:
- Adoption rate (% usuarios que usan)
- Engagement (tiempo promedio en feature)
- Retention (% que vuelve después 7 días)
- NPS (Net Promoter Score)

---

## 🤝 Recomendaciones de Negocio

1. **Próximos 2 semanas:**
   - Completar PDF + Seguridad (Tier 1)
   - Comunicar roadmap a usuarios
   - Recopilar feedback

2. **Próximas 4 semanas:**
   - Lanzar Analytics + Recomendaciones
   - Beta testing con 100 usuarios
   - Ajustar según feedback

3. **Próximas 8 semanas:**
   - Lanzar WhatsApp integración avanzada
   - Plan tutoring beta
   - Preparar landing page para B2B

4. **Largo plazo (3-6 meses):**
   - Certificación de cursos
   - Integraciones con otras plataformas PAES
   - Expansión a otras pruebas (PSU, etc.)

---

## ✅ Conclusión

TutorPAES está en posición fuerte después de completar Fase 3.2. El roadmap propuesto:
- ✅ Resuelve pain points actuales
- ✅ Diferencia en mercado competitivo
- ✅ Genera múltiples streams de ingresos
- ✅ Es técnicamente viable
- ✅ Puede implementarse incremental

Recomendación: **Comenzar con Tier 1 inmediatamente, parallelizar Tier 2 en sprint siguiente.**

---

**Documento preparado:** 2026-04-06  
**Próxima revisión:** 2026-04-20  
**Owner:** Product & Engineering Teams
