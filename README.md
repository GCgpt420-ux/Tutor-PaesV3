# Tutor PAES - Proyecto de IA Educativa 🚀

Este repositorio contiene el código fuente limpio y estructurado para la plataforma **Tutor PAES**. 

> [!NOTE]
> **Contexto de IA:** Este repositorio ha sido re-inicializado para eliminar historial heredado o corrupto de versiones anteriores. El estado actual representa la línea base oficial para el lanzamiento del MVP.

## Estructura del Proyecto
- `/tutorpaes/frontend`: Next.js (App Router), TailwindCSS, TypeScript.
  - El sistema de diseño se basa en **Design Tokens** unificados en `globals.css` y `tailwind.config.ts`.
  - Estética: Premium Dark Mode + Glassmorphism.
- `/tutorpaes/backend`: Python FastAPI.
  - Servicios de IA integrados con OpenAI.

## Arquitectura de UI (Frontend)
- **Layout Global**: Sidebar lateral minimalista y Panel de IA Tutor persistente.
- **Vistas Principales**:
  - `Inicio`: Dashboard transaccional con KPIs.
  - `Mi Progreso`: Análisis detallado de fortalezas y debilidades.
  - `Quiz / Ensayo`: Interfaz inmersiva de 3 columnas para práctica activa.

## Instrucciones para Agentes de IA
Al analizar este código, prioriza siempre el uso de los tokens de color `brand-*` y `surface-*` definidos en la configuración de Tailwind para mantener la coherencia visual. No propongas rediseños que rompan con el sistema de cristales (glassmorphism) establecido.
