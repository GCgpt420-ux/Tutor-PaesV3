import type { Config } from 'tailwindcss';

// Este archivo contiene las "extensiones de estilo" que
// se extraen del proyecto tutor-paes-frontend original.
// No se carga en la configuración activa de Tailwind,
// pero sirve como referencia/plantilla para que, cuando
// estés listo para aplicar la nueva paleta, puedas copiar
// o fusionar estas líneas en `tailwind.config.ts`.

const paesExtension: Partial<Config> = {
  theme: {
    extend: {
      colors: {
        'paes-dark': '#0B1220',
        'paes-darker': '#050810',
        'paes-card': '#0F1623',
        'paes-border': '#1A2332',
        'paes-text': '#E8EAED',
        'paes-text-secondary': '#B0B4BD',
        'paes-emerald': '#10B981',
        'paes-blue': '#3B82F6',
      },
      backgroundImage: {
        'gradient-paes':
          'linear-gradient(135deg, #10B981 0%, #3B82F6 100%)',
        'gradient-subtle':
          'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)',
      },
      animation: {
        blob: 'blob 7s infinite',
        'blob-delay': 'blob 7s infinite 2s',
        'blob-delay-4': 'blob 7s infinite 4s',
        fadeInUp: 'fadeInUp 0.8s ease-out',
        fadeIn: 'fadeIn 0.6s ease-out',
        'pulse-subtle': 'pulse-subtle 2s ease-in-out infinite',
      },
      keyframes: {
        blob: {
          '0%, 100%': {
            transform: 'translate(0, 0) scale(1)',
            opacity: '0.7',
          },
          '33%': {
            transform: 'translate(30px, -50px) scale(1.1)',
            opacity: '0.5',
          },
          '66%': {
            transform: 'translate(-20px, 20px) scale(0.9)',
            opacity: '0.4',
          },
        },
        fadeInUp: {
          '0%': {
            opacity: '0',
            transform: 'translateY(20px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        fadeIn: {
          '0%': {
            opacity: '0',
          },
          '100%': {
            opacity: '1',
          },
        },
        'pulse-subtle': {
          '0%, 100%': {
            opacity: '1',
          },
          '50%': {
            opacity: '0.8',
          },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        glass: '0 8px 32px rgba(0, 0, 0, 0.1)',
        'glass-sm': '0 4px 6px rgba(0, 0, 0, 0.07)',
        glow: '0 0 20px rgba(16, 185, 129, 0.3)',
        'glow-blue': '0 0 20px rgba(59, 130, 246, 0.3)',
      },
    },
  },
};

export default paesExtension;
