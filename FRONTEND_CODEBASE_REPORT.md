# Informe Completo del Frontend - TutorPAES

## Tabla de Contenidos
1. [Estructura General del Proyecto](#estructura-general)
2. [Configuración y Dependencias](#configuración)
3. [Páginas (App Router)](#páginas)
4. [APIs y Rutas](#apis-y-rutas)
5. [Componentes UI](#componentes-ui)
6. [Componentes Features](#componentes-features)
7. [Hooks Personalizados](#hooks)
8. [Servicios y Librerías](#servicios)
9. [Tipos y Esquemas](#tipos)
10. [Estilos y Temas](#estilos)

---

## 1. Estructura General del Proyecto {#estructura-general}

```
tutorpaes/frontend/
├── app/                          # Rutas principales (Next.js App Router)
│   ├── page.tsx                 # Landing page
│   ├── layout.tsx               # Layout root
│   ├── globals.css              # Estilos globales
│   ├── api/                     # API routes (proxies y servicios)
│   ├── protected/               # Rutas autenticadas
│   │   ├── cursos/              # Catálogo de materias
│   │   ├── ensayos/             # Listado de ensayos
│   │   ├── progreso/            # Dashboard principal
│   │   ├── perfil/              # Perfil de usuario
│   │   └── quiz/                # Quiz interactivo
│   └── auth/                    # Autenticación (login, signup, etc.)
├── src/
│   ├── components/              # Componentes reutilizables
│   │   ├── layout/              # Sidebar, Header, Footer
│   │   └── ui/                  # Componentes UI base (Button, Card, etc.)
│   ├── features/                # Características por dominio
│   │   ├── auth/                # Autenticación
│   │   ├── dashboard/           # Dashboard y progreso
│   │   ├── exams/               # Ensayos y quiz
│   │   ├── courses/             # Catálogo de materias
│   │   └── ai/                  # Integración IA
│   ├── hooks/                   # Custom hooks
│   ├── lib/                     # Utilidades y servicios
│   │   ├── api/                 # Cliente API
│   │   ├── auth/                # Lógica de autenticación
│   │   ├── server/              # Utilidades servidor
│   │   └── theme/               # Configuración de temas
│   └── types/                   # Tipos TypeScript
├── lib/                         # Librerías compartidas
│   └── theme/                   # Configuración de colores por materia
├── public/                      # Activos estáticos
├── scripts/                     # Scripts auxiliares
├── jest.config.ts               # Configuración Jest
├── next.config.ts               # Configuración Next.js
├── tailwind.config.ts           # Configuración Tailwind CSS
└── tsconfig.json                # Configuración TypeScript
```

---

## 2. Configuración y Dependencias {#configuración}

### 2.1 next.config.ts

```typescript
import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "base-uri 'self'",
      "frame-ancestors 'none'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "style-src 'self' 'unsafe-inline'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "connect-src 'self' https: http://127.0.0.1:8000 http://localhost:8000",
      "form-action 'self' https://webpay3gint.transbank.cl https://webpay3g.transbank.cl",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/protected',
        destination: '/protected/progreso',
        permanent: false,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
```

### 2.2 tailwind.config.ts

```typescript
import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        "paes-dark": "#0B1220",
        "paes-card": "#0F1623",
      },
      animation: {
        blob: "blob 7s infinite",
        fadeInUp: "fadeInUp 0.8s ease-out",
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;
```

### 2.3 tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts"
  ]
}
```

---

## 3. Páginas (App Router) {#páginas}

### 3.1 app/layout.tsx - Root Layout

```typescript
import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "TutorPAES",
  description: "Aplicación TutorPAES: frontend en Next.js con backend personalizado",
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${geistSans.className} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

### 3.2 app/page.tsx - Landing Page

```typescript
'use client';

import Link from "next/link";
import { useEffect, useState } from "react";
import { BarChart3, Brain, Target, Zap, ArrowRight, BookOpen } from "lucide-react";

export default function Home() {
  const [year, setYear] = useState<number | null>(null);

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  return (
    <main className="min-h-screen flex flex-col bg-white text-gray-900">
      {/* NAVBAR */}
      <nav className="w-full border-b border-gray-200">
        <div className="max-w-6xl mx-auto flex justify-between items-center px-6 h-16">
          <Link href="/" className="font-bold text-lg">
            PAES Pro
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/auth/login" className="text-sm font-medium text-gray-600 hover:text-gray-900">
              Iniciar sesión
            </Link>
            <Link href="/auth/sign-up" className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg">
              Crear cuenta
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-4xl text-center py-20 space-y-6">
          <h1 className="text-5xl font-extrabold tracking-tight">
            Prepárate para la PAES de forma inteligente
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Practica con ensayos reales, analiza tu rendimiento y mejora tus resultados
          </p>
          <div className="flex justify-center gap-4 pt-6">
            <Link href="/auth/sign-up" className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl">
              Comenzar Gratis
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
```

### 3.3 app/protected/layout.tsx - Dashboard Layout

```typescript
import { DashboardSidebar } from "@/src/components/layout/sidebar";
import { DashboardHeader } from "@/src/components/layout/header";
import { DashboardFooter } from "@/src/components/layout/footer";
import { MobileNav } from "@/src/components/layout/mobile-nav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="hidden lg:block">
        <DashboardSidebar />
      </div>
      
      <div className="flex flex-col flex-1">
        <DashboardHeader />
        <main className="flex-1 p-4 md:p-6 pb-24 md:pb-6">
          {children}
        </main>
        <div className="hidden md:block">
          <DashboardFooter />
        </div>
      </div>

      <MobileNav />
    </div>
  );
}
```

### 3.4 app/protected/progreso/page.tsx - Dashboard Principal

```typescript
'use client';

import { ProtectedView } from '@/src/features/dashboard/views/dashboard-view';

export default function ProgresoPage() {
  return <ProtectedView />;
}
```

### 3.5 app/protected/cursos/page.tsx - Catálogo de Materias

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SubjectCard } from '@/src/features/dashboard/components/subject-card';
import { Loader } from 'lucide-react';
import { apiFetch } from '@/src/lib/api/client';

interface Subject {
  subject_id: number;
  subject_code: string;
  name: string;
  topics: Array<{
    topic_id: number;
    topic_code: string;
    name: string;
  }>;
}

export default function CursosPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const exams = await apiFetch<Array<{ exam_id: number; code: string; name: string }>>('/catalog/exams/');
        const paesExam = exams.find(e => e.code === 'PAES');
        
        if (!paesExam) {
          throw new Error('No se encontró el examen PAES');
        }
        
        const subjectsData = await apiFetch<Subject[]>(`/catalog/subjects/?exam_id=${paesExam.exam_id}`);
        setSubjects(subjectsData);
      } catch (err) {
        console.error('Error fetching subjects:', err);
        setError(err instanceof Error ? err.message : 'Error al cargar cursos');
      } finally {
        setLoading(false);
      }
    };

    fetchSubjects();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader className="h-10 w-10 text-blue-600 animate-spin" />
          <p className="text-gray-600">Cargando cursos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Catálogo de Cursos</h1>
        <p className="text-gray-600 mt-2">Selecciona una materia para empezar a estudiar</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {subjects.map((subject) => (
          <SubjectCard
            key={subject.subject_id}
            id={subject.subject_id.toString()}
            name={subject.name}
            description={`Código: ${subject.subject_code} · ${subject.topics.length} temas`}
            onClick={() => router.push(`/protected/cursos/${subject.subject_id}`)}
          />
        ))}
      </div>
    </div>
  );
}
```

### 3.6 app/protected/ensayos/page.tsx - Gestión de Ensayos

```typescript
'use client';

import { useEffect, useState } from 'react';
import { Loader, Plus, Calendar, FileText } from 'lucide-react';
import { ExamCard } from '@/src/features/dashboard/components/exam-card';
import { CreateExamModal } from '@/src/features/exams/components/create-exam-modal';
import { apiFetch } from '@/src/lib/api/client';

interface Exam {
  exam_id: number;
  code: string;
  name: string;
  subjects: Array<{
    subject_id: number;
    subject_code: string;
    name: string;
  }>;
}

interface ExamCardData {
  id: string;
  title: string;
  type: 'oficial' | 'personalizado';
  duration_minutes: number;
  created_at: string;
}

type TabType = 'oficial' | 'personalizado';

export default function EnsayosPage() {
  const [activeTab, setActiveTab] = useState<TabType>('oficial');
  const [officialExams, setOfficialExams] = useState<ExamCardData[]>([]);
  const [customExams, setCustomExams] = useState<ExamCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const loadCustomExams = () => {
    if (typeof window === 'undefined') return;
    const raw = localStorage.getItem('custom_exams_v1');
    const stored = raw ? JSON.parse(raw) : [];
    const mapped = stored.map((exam: any) => ({
      id: exam.id,
      title: exam.title,
      type: 'personalizado',
      duration_minutes: exam.duration_minutes,
      created_at: exam.created_at,
    }));
    setCustomExams(mapped);
  };

  useEffect(() => {
    const fetchExams = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const exams = await apiFetch<Exam[]>('/catalog/exams/');
        
        const officialExamsData: ExamCardData[] = exams.map(exam => ({
          id: exam.exam_id.toString(),
          title: exam.name,
          type: 'oficial',
          duration_minutes: 180,
          created_at: new Date().toISOString(),
        }));
        
        setOfficialExams(officialExamsData);
        loadCustomExams();
      } catch (err) {
        console.error('Error fetching exams:', err);
        setError(err instanceof Error ? err.message : 'Error al cargar ensayos');
      } finally {
        setLoading(false);
      }
    };

    fetchExams();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="h-10 w-10 animate-spin" />
      </div>
    );
  }

  const exams = activeTab === 'oficial' ? officialExams : customExams;

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-zinc-50 uppercase tracking-tight">Mis Ensayos</h1>
          <p className="text-zinc-400 mt-2 font-medium">
            Entrena con simulaciones oficiales o crea tus propios desafíos
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-brand-primary hover:bg-brand-primary/90 text-white font-bold rounded-xl"
        >
          <Plus className="h-5 w-5" />
          Nuevo Ensayo
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-8 flex gap-2 border-b-2 border-zinc-800 pb-2">
        <button
          onClick={() => setActiveTab('oficial')}
          className={`px-6 py-3 font-black text-sm uppercase tracking-wide ${
            activeTab === 'oficial'
              ? 'text-brand-primary bg-brand-primary/10'
              : 'text-zinc-500'
          }`}
        >
          Oficiales ({officialExams.length})
        </button>
        <button
          onClick={() => setActiveTab('personalizado')}
          className={`px-6 py-3 font-black text-sm uppercase tracking-wide ${
            activeTab === 'personalizado'
              ? 'text-brand-primary bg-brand-primary/10'
              : 'text-zinc-500'
          }`}
        >
          Custom ({customExams.length})
        </button>
      </div>

      {/* Grid de Exámenes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {exams.map((exam) => (
          <ExamCard
            key={exam.id}
            {...exam}
            type={exam.type}
            scheduledAt={null}
            createdAt={exam.created_at}
          />
        ))}
      </div>

      {showCreateModal && (
        <CreateExamModal
          onClose={() => setShowCreateModal(false)}
          onExamCreated={() => {
            setShowCreateModal(false);
            loadCustomExams();
          }}
        />
      )}
    </div>
  );
}
```

### 3.7 app/protected/perfil/page.tsx - Perfil de Usuario

```typescript
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Save, GraduationCap, School, BookOpen, UserCircle, Lock, Eye, EyeOff } from 'lucide-react';
import { apiFetch } from '@/src/lib/api/client';

interface UserProfile {
  user_id: number;
  email: string;
  name: string;
  is_admin: boolean;
  age?: number | null;
  academic_level?: string | null;
  target_university?: string | null;
  target_degree?: string | null;
}

interface ProfileFormData {
  name: string;
  email: string;
  age: number | null;
  academic_level: string;
  target_university: string;
  target_degree: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState<ProfileFormData>({
    name: '',
    email: '',
    age: null,
    academic_level: '',
    target_university: '',
    target_degree: '',
  });
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadUser() {
      try {
        const data = await apiFetch<UserProfile>('/auth/me');
        if (isMounted) {
          setUser(data);
          setFormData({
            name: data.name || '',
            email: data.email || '',
            age: data.age || null,
            academic_level: data.academic_level || '',
            target_university: data.target_university || '',
            target_degree: data.target_degree || '',
          });
        }
      } catch {
        if (isMounted) {
          setError('No se pudo cargar el perfil. Inicia sesión nuevamente.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadUser();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'age' ? (value ? Number(value) : null) : value,
    }));
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setProfileMessage(null);

    try {
      const response = await apiFetch('/auth/me', {
        method: 'PATCH',
        body: formData,
      });
      
      setUser(response);
      setProfileMessage({ type: 'success', text: 'Perfil actualizado exitosamente' });
    } catch (err) {
      setProfileMessage({ 
        type: 'error', 
        text: err instanceof Error ? err.message : 'Error al guardar perfil'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setPasswordError('Las contraseñas no coinciden');
      return;
    }

    setPasswordLoading(true);
    setPasswordError(null);

    try {
      await apiFetch('/auth/change-password', {
        method: 'POST',
        body: {
          current_password: currentPassword,
          new_password: newPassword,
        },
      });

      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowChangePassword(false);
      
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Error al cambiar contraseña');
    } finally {
      setPasswordLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Cargando perfil...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-black text-zinc-50 uppercase tracking-tight">Mi Perfil</h1>
        <p className="text-zinc-400 font-medium">Completa tu información para personalizar tus misiones.</p>
      </div>

      {/* Tarjeta de Suscripción */}
      <div className="bg-zinc-900/80 backdrop-blur-sm p-4 rounded-2xl border-2 border-zinc-800 shadow-xl flex items-center gap-5">
        <div>
          <p className="text-xs text-brand-primary font-bold uppercase tracking-wider">Plan actual</p>
          <p className="text-lg font-black text-zinc-50 uppercase">Free</p>
        </div>
        <Link
          href="/pricing"
          className="bg-brand-primary hover:bg-brand-primary/90 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg"
        >
          Mejorar Plan
        </Link>
      </div>

      {/* Mensajes globales */}
      {profileMessage && (
        <div
          className={`p-4 rounded-xl text-sm font-bold border-2 ${
            profileMessage.type === 'success'
              ? 'bg-brand-accent/10 border-brand-accent/20 text-brand-accent'
              : 'bg-red-900/20 border-red-900/50 text-red-400'
          }`}
        >
          {profileMessage.text}
        </div>
      )}

      {passwordSuccess && (
        <div className="p-4 rounded-xl text-sm font-bold bg-brand-accent/10 border-brand-accent/20 text-brand-accent">
          Contraseña actualizada exitosamente
        </div>
      )}

      {user && (
        <>
          {/* Formulario Principal */}
          <div className="bg-surface-raised/80 backdrop-blur-sm rounded-3xl shadow-2xl border-2 border-zinc-800 overflow-hidden">
            <div className="p-8">
              <form onSubmit={handleProfileSubmit} className="space-y-8">
                {/* SECCIÓN 1: Información Personal */}
                <div>
                  <h2 className="text-xl font-black text-zinc-50 uppercase tracking-wide mb-6 flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-brand-primary/10 border border-brand-primary/20">
                      <UserCircle className="w-5 h-5 text-brand-primary" />
                    </div>
                    Información Personal
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Email */}
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-zinc-300 uppercase tracking-wider">Correo Electrónico</label>
                      <input
                        type="email"
                        value={formData.email}
                        disabled
                        className="w-full p-4 bg-zinc-950/50 border-2 border-zinc-800 rounded-xl text-zinc-500 cursor-not-allowed font-medium"
                      />
                    </div>

                    {/* Nombre Completo */}
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-zinc-300 uppercase tracking-wider">Nombre Completo</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleProfileChange}
                        placeholder="Ej: Juan Pérez"
                        className="w-full p-4 bg-zinc-950 border-2 border-zinc-800 rounded-xl text-zinc-50 placeholder:text-zinc-600 focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none"
                      />
                    </div>

                    {/* Edad */}
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-zinc-300 uppercase tracking-wider">Edad</label>
                      <input
                        type="number"
                        name="age"
                        value={formData.age || ''}
                        onChange={handleProfileChange}
                        placeholder="17"
                        className="w-full p-4 bg-zinc-950 border-2 border-zinc-800 rounded-xl text-zinc-50"
                      />
                    </div>
                  </div>
                </div>

                <hr className="border-2 border-zinc-800/50" />

                {/* SECCIÓN 2: Metas Académicas */}
                <div>
                  <h2 className="text-xl font-black text-zinc-50 uppercase tracking-wide mb-6 flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-brand-accent/10 border border-brand-accent/20">
                      <GraduationCap className="w-5 h-5 text-brand-accent" />
                    </div>
                    Misiones Académicas
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Nivel Académico */}
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-zinc-300 uppercase tracking-wider">Situación Actual</label>
                      <select
                        name="academic_level"
                        value={formData.academic_level}
                        onChange={handleProfileChange}
                        className="w-full p-4 bg-zinc-950 border-2 border-zinc-800 rounded-xl text-zinc-50"
                      >
                        <option value="">Selecciona tu nivel...</option>
                        <option value="3ro Medio">3ro Medio</option>
                        <option value="4to Medio">4to Medio</option>
                        <option value="Egresado">Egresado / Año Sabático</option>
                      </select>
                    </div>

                    {/* Universidad Objetivo */}
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-zinc-300 uppercase tracking-wider">Universidad Objetivo</label>
                      <input
                        type="text"
                        name="target_university"
                        value={formData.target_university}
                        onChange={handleProfileChange}
                        placeholder="Ej: Universidad de Chile"
                        className="w-full p-4 bg-zinc-950 border-2 border-zinc-800 rounded-xl text-zinc-50"
                      />
                    </div>

                    {/* Especialidad */}
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-bold text-zinc-300 uppercase tracking-wider">Especialidad</label>
                      <input
                        type="text"
                        name="target_degree"
                        value={formData.target_degree}
                        onChange={handleProfileChange}
                        placeholder="Ej: Ingeniería"
                        className="w-full p-4 bg-zinc-950 border-2 border-zinc-800 rounded-xl text-zinc-50"
                      />
                    </div>
                  </div>
                </div>

                {/* Botón Guardar */}
                <div className="flex justify-end pt-6">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 bg-brand-primary hover:bg-brand-primary/90 text-white font-bold py-4 px-8 rounded-xl uppercase tracking-widest text-sm"
                  >
                    {saving ? <>Guardando...</> : <>
                      <Save className="w-5 h-5" />
                      Guardar
                    </>}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Seguridad - Cambio de Contraseña */}
          <div className="bg-surface-raised/80 backdrop-blur-sm rounded-3xl shadow-2xl border-2 border-zinc-800 overflow-hidden mt-8">
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black text-zinc-50 uppercase tracking-wide flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20">
                    <Lock className="w-5 h-5 text-red-500" />
                  </div>
                  Seguridad
                </h2>
                <button
                  onClick={() => setShowChangePassword(!showChangePassword)}
                  className="text-sm text-brand-primary hover:text-brand-primary/80 font-bold uppercase"
                >
                  {showChangePassword ? 'Cancelar' : 'Cambiar Contraseña'}
                </button>
              </div>

              {showChangePassword && (
                <form onSubmit={handleChangePassword} className="space-y-6">
                  {passwordError && (
                    <p className="text-sm font-bold text-red-400 bg-red-900/20 border-2 border-red-900/50 p-4 rounded-xl">
                      {passwordError}
                    </p>
                  )}

                  <div>
                    <label className="block text-sm font-bold text-zinc-300 uppercase tracking-wider mb-2">
                      Contraseña Actual
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full p-4 bg-zinc-950 border-2 border-zinc-800 rounded-xl text-zinc-50 pr-12"
                        placeholder="Ingresa tu contraseña actual"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-4 top-4 text-zinc-500"
                      >
                        {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-zinc-300 uppercase tracking-wider mb-2">
                      Nueva Contraseña
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full p-4 bg-zinc-950 border-2 border-zinc-800 rounded-xl text-zinc-50 pr-12"
                        placeholder="Ingresa tu nueva contraseña"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-4 top-4 text-zinc-500"
                      >
                        {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-zinc-300 uppercase tracking-wider mb-2">
                      Confirmar Nueva Contraseña
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full p-4 bg-zinc-950 border-2 border-zinc-800 rounded-xl text-zinc-50"
                      placeholder="Confirma tu nueva contraseña"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={passwordLoading}
                    className="w-full bg-brand-primary hover:bg-brand-primary/90 disabled:bg-zinc-800 text-white font-bold py-4 rounded-xl uppercase tracking-wide"
                  >
                    {passwordLoading ? 'Actualizando...' : 'Guardar Contraseña'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
```

### 3.8 app/protected/quiz/[subject_code]/[topic_code]/page.tsx - Quiz Interactivo

```typescript
'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle, XCircle, Loader } from 'lucide-react';
import { apiFetch } from '@/src/lib/api/client';

interface QuizState {
  question: any;
  selectedChoice: number | null;
  submitted: boolean;
  isCorrect: boolean | null;
  feedbackText: string | null;
  isFinished: boolean;
  loading: boolean;
  error: string | null;
  attemptId: number | null;
  questionsAnswered: number;
  correctAnswers: number;
}

export default function QuizPage() {
  const params = useParams();
  const router = useRouter();
  const subject_code = params?.subject_code as string;
  const topic_code = params?.topic_code as string;

  const [quiz, setQuiz] = useState<QuizState>({
    question: null,
    selectedChoice: null,
    submitted: false,
    isCorrect: null,
    feedbackText: null,
    isFinished: false,
    loading: true,
    error: null,
    attemptId: null,
    questionsAnswered: 0,
    correctAnswers: 0,
  });

  const loadNextQuestion = useCallback(async () => {
    if (!subject_code || !topic_code) {
      setQuiz((prev) => ({
        ...prev,
        loading: false,
        error: 'Parámetros de materia o tema no encontrados',
      }));
      return;
    }

    try {
      setQuiz((prev) => ({
        ...prev,
        loading: true,
        error: null,
        selectedChoice: null,
        submitted: false,
        isCorrect: null,
        feedbackText: null,
      }));

      const response = await apiFetch(
        `/quiz/next-question?subject_code=${subject_code}&topic_code=${topic_code}`
      );

      if (response.kind === "topic_completed") {
        setQuiz((prev) => ({
          ...prev,
          question: null,
          loading: false,
          isFinished: true,
          attemptId: response.attempt_id,
          questionsAnswered: response.total_questions,
          correctAnswers: response.correct_count,
        }));
        return;
      }

      if (response.kind === "question") {
        setQuiz((prev) => ({
          ...prev,
          question: response,
          loading: false,
        }));
      }
    } catch (err) {
      console.error('Error al cargar pregunta:', err);
      setQuiz((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Error al cargar la pregunta',
        question: null,
      }));
    }
  }, [subject_code, topic_code]);

  useEffect(() => {
    loadNextQuestion();
  }, [loadNextQuestion]);

  const handleAnswerSelect = (choiceId: number) => {
    if (!quiz.submitted) {
      setQuiz((prev) => ({
        ...prev,
        selectedChoice: choiceId,
      }));
    }
  };

  const handleSubmitAnswer = async () => {
    if (quiz.selectedChoice === null || !quiz.question) return;

    try {
      setQuiz((prev) => ({ ...prev, submitted: true }));

      const response = await apiFetch('/quiz/answer', {
        method: 'POST',
        body: {
          subject_code,
          topic_code,
          question_id: quiz.question.question_id,
          selected_choice_id: quiz.selectedChoice,
        },
      });

      setQuiz((prev) => ({
        ...prev,
        isCorrect: response.is_correct,
        feedbackText: response.feedback_text,
        attemptId: response.attempt_id,
        questionsAnswered: prev.questionsAnswered + 1,
        correctAnswers: response.is_correct ? prev.correctAnswers + 1 : prev.correctAnswers,
      }));

      if (response.is_attempt_finished) {
        setQuiz((prev) => ({
          ...prev,
          isFinished: true,
        }));
      }
    } catch (err) {
      console.error('Error al enviar respuesta:', err);
      setQuiz((prev) => ({
        ...prev,
        error: 'Error al procesar tu respuesta',
        submitted: false,
      }));
    }
  };

  const handleContinue = () => {
    if (quiz.isFinished) {
      router.push(`/protected/ensayos/${quiz.attemptId}/resultados?attempt_id=${quiz.attemptId}`);
    } else {
      loadNextQuestion();
    }
  };

  if (quiz.loading && !quiz.question) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader className="h-10 w-10 animate-spin text-brand-primary" />
          <p className="text-zinc-300">Cargando pregunta...</p>
        </div>
      </div>
    );
  }

  if (quiz.error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-900/20 border border-red-900/50 rounded-lg p-6 max-w-md">
          <p className="text-red-400">{quiz.error}</p>
          <button
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-red-900/40 hover:bg-red-900/60 text-red-300 rounded-lg"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  if (quiz.isFinished) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="bg-surface-raised rounded-2xl p-8 max-w-md text-center border border-zinc-800">
          <CheckCircle className="h-16 w-16 text-brand-accent mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-zinc-50 mb-4">¡Tema Completado!</h1>
          <p className="text-zinc-300 mb-6">
            Respondiste {quiz.questionsAnswered} preguntas,{' '}
            <span className="text-brand-accent font-bold">{quiz.correctAnswers} correctas</span>
          </p>
          <button
            onClick={handleContinue}
            className="w-full px-6 py-3 bg-brand-primary hover:bg-brand-primary/90 text-white font-bold rounded-lg"
          >
            Ver Resultados
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-zinc-400 hover:text-zinc-200">
          <ArrowLeft className="h-5 w-5" />
          Atrás
        </button>
        <div className="text-sm text-zinc-400">
          Pregunta {quiz.questionsAnswered + 1}
        </div>
      </div>

      {/* Pregunta */}
      {quiz.question && (
        <div className="bg-surface-raised rounded-2xl p-8 border border-zinc-800">
          <h2 className="text-xl font-bold text-zinc-50 mb-6">{quiz.question.prompt}</h2>

          {/* Opciones */}
          <div className="space-y-3 mb-6">
            {quiz.question.choices.map((choice: any) => (
              <button
                key={choice.id}
                onClick={() => handleAnswerSelect(choice.id)}
                disabled={quiz.submitted}
                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                  quiz.selectedChoice === choice.id
                    ? 'border-brand-primary bg-brand-primary/10'
                    : 'border-zinc-700 bg-zinc-900 hover:border-zinc-600'
                }`}
              >
                <span className="font-bold text-zinc-200">{choice.label}.</span>
                <span className="text-zinc-300 ml-2">{choice.text}</span>
              </button>
            ))}
          </div>

          {/* Feedback */}
          {quiz.submitted && (
            <div
              className={`p-4 rounded-lg mb-6 flex items-start gap-3 ${
                quiz.isCorrect
                  ? 'bg-brand-accent/10 border border-brand-accent/20'
                  : 'bg-red-900/20 border border-red-900/50'
              }`}
            >
              {quiz.isCorrect ? (
                <CheckCircle className="h-5 w-5 text-brand-accent flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              )}
              <p className={quiz.isCorrect ? 'text-brand-accent' : 'text-red-400'}>
                {quiz.feedbackText}
              </p>
            </div>
          )}

          {/* Botones de Acción */}
          <div className="flex gap-4">
            {!quiz.submitted ? (
              <button
                onClick={handleSubmitAnswer}
                disabled={quiz.selectedChoice === null}
                className="flex-1 px-6 py-3 bg-brand-primary hover:bg-brand-primary/90 disabled:bg-zinc-700 text-white font-bold rounded-lg"
              >
                Enviar Respuesta
              </button>
            ) : (
              <button
                onClick={handleContinue}
                className="flex-1 px-6 py-3 bg-brand-primary hover:bg-brand-primary/90 text-white font-bold rounded-lg"
              >
                Siguiente Pregunta
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
```

### 3.9 Auth Pages

#### app/auth/login/page.tsx
```typescript
import { LoginForm } from "@/src/features/auth/components/login-form";

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
    </div>
  );
}
```

#### app/auth/sign-up/page.tsx
```typescript
import { SignUpForm } from "@/src/features/auth/components/sign-up-form";

export default function Page() {
  return (
    <div className="min-h-svh w-full relative bg-gradient-to-br from-amber-50 via-white to-blue-50">
      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] opacity-20" />
      
      <div className="relative flex items-center justify-center p-6 md:p-10 min-h-svh">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold text-amber-900 mb-2">
              TutorPAES, tu tutor de bolsillo
            </h1>
            <p className="text-amber-700/70">
              Tu espacio para desarrollarte y aprender
            </p>
          </div>
          <SignUpForm />
        </div>
      </div>
    </div>
  );
}
```

---

## 4. APIs y Rutas {#apis-y-rutas}

### 4.1 app/api/auth/login/route.ts

```typescript
import { NextRequest } from 'next/server';
import { API_BASE_URL, relayAuthResponse } from '@/src/lib/server/auth-session';

export async function POST(request: NextRequest) {
  const body = await request.text();

  const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body,
  });

  return relayAuthResponse(response);
}
```

### 4.2 app/api/auth/register/route.ts

```typescript
import { NextRequest } from 'next/server';
import { API_BASE_URL, relayAuthResponse } from '@/src/lib/server/auth-session';

export async function POST(request: NextRequest) {
  const body = await request.text();

  const response = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body,
  });

  return relayAuthResponse(response);
}
```

### 4.3 app/api/auth/logout/route.ts

```typescript
import { NextResponse } from 'next/server';
import { clearAuthCookies } from '@/src/lib/server/auth-session';

export async function POST() {
  const response = NextResponse.json({ success: true });
  clearAuthCookies(response);
  return response;
}
```

### 4.4 app/api/auth/refresh/route.ts

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { API_BASE_URL, clearAuthCookies, relayAuthResponse } from '@/src/lib/server/auth-session';

export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get('refresh_token')?.value;

  if (!refreshToken) {
    const response = NextResponse.json({ error: 'Refresh token no disponible' }, { status: 401 });
    clearAuthCookies(response);
    return response;
  }

  const backendResponse = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
    method: 'POST',
    headers: {
      Cookie: `refresh_token=${refreshToken}`,
    },
  });

  return relayAuthResponse(backendResponse);
}
```

### 4.5 app/api/ai/explain/route.ts

```typescript
import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const question_id = Number(body?.question_id);

    if (!question_id) {
      return NextResponse.json(
        { error: 'question_id is required' },
        { status: 400 }
      );
    }

    const token = request.cookies.get('access_token')?.value;

    const response = await fetch(`${API_BASE_URL}/api/v1/ai/explain/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ question_id }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      return NextResponse.json(
        { error: 'Failed to generate explanation', details: errorBody },
        { status: response.status }
      );
    }

    const headers = new Headers(response.headers);
    headers.set('Content-Type', 'text/event-stream; charset=utf-8');
    headers.set('Cache-Control', 'no-cache, no-transform');
    headers.set('Connection', 'keep-alive');

    return new NextResponse(response.body, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('AI Explain Stream Proxy Error:', error);
    return NextResponse.json(
      {
        error: 'Tutor IA interrumpió la conexión o no está disponible.',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'AI Explain endpoint active',
    methods: ['POST'],
  });
}
```

### 4.6 app/api/payments/create/route.ts

```typescript
import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const plan = body.plan || 'monthly';
    const token = request.cookies.get('access_token')?.value;

    const response = await fetch(`${API_BASE_URL}/api/v1/payments/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ plan }),
    });

    const paymentData = await response.json();
    if (!response.ok) {
      return NextResponse.json(
        { error: paymentData?.detail || 'Error al crear el pago' },
        { status: response.status }
      );
    }

    return NextResponse.json(paymentData);
  } catch (error) {
    console.error('Error creating payment:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud de pago' },
      { status: 500 }
    );
  }
}
```

### 4.7 app/api/backend/[...path]/route.ts - Proxy Universal

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { API_BASE_URL } from '@/src/lib/server/auth-session';

async function forwardRequest(request: NextRequest, path: string[]) {
  const accessToken = request.cookies.get('access_token')?.value;
  const targetUrl = `${API_BASE_URL}/api/v1/${path.join('/')}${request.nextUrl.search}`;
  const method = request.method;
  const headers = new Headers();

  const contentType = request.headers.get('content-type');
  if (contentType) {
    headers.set('Content-Type', contentType);
  }

  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  const body = method === 'GET' || method === 'HEAD' ? undefined : await request.text();
  const backendResponse = await fetch(targetUrl, {
    method,
    headers,
    body,
  });

  const responseBody = await backendResponse.arrayBuffer();
  const responseHeaders = new Headers();
  const responseContentType = backendResponse.headers.get('content-type');

  if (responseContentType) {
    responseHeaders.set('Content-Type', responseContentType);
  }

  return new NextResponse(responseBody, {
    status: backendResponse.status,
    headers: responseHeaders,
  });
}

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return forwardRequest(request, path);
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return forwardRequest(request, path);
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return forwardRequest(request, path);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return forwardRequest(request, path);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return forwardRequest(request, path);
}
```

---

## 5. Componentes UI {#componentes-ui}

### 5.1 src/components/ui/button.tsx

```typescript
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/src/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
```

### 5.2 src/components/ui/card.tsx

```typescript
import * as React from "react";
import { cn } from "@/src/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-xl border bg-card text-card-foreground shadow",
      className,
    )}
    {...props}
  />
));
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("font-semibold leading-none tracking-tight", className)}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
};
```

### 5.3 src/components/ui/input.tsx

```typescript
import * as React from "react";
import { cn } from "@/src/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
```

### 5.4 src/components/ui/label.tsx

```typescript
"use client";

import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/src/lib/utils";

const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
);

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
    VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(labelVariants(), className)}
    {...props}
  />
));
Label.displayName = LabelPrimitive.Root.displayName;

export { Label };
```

### 5.5 src/components/ui/checkbox.tsx

```typescript
"use client";

import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";
import { cn } from "@/src/lib/utils";

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "peer h-4 w-4 shrink-0 rounded-sm border border-primary shadow focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
      className,
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className={cn("flex items-center justify-center text-current")}
    >
      <Check className="h-4 w-4" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
```

### 5.6 src/components/ui/badge.tsx

```typescript
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/src/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
```

### 5.7 src/components/ui/markdown-math-renderer.tsx

```typescript
import ReactMarkdown from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';

interface MarkdownMathRendererProps {
  content: string;
  className?: string;
}

export function MarkdownMathRenderer({ content, className }: MarkdownMathRendererProps) {
  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          p: ({ children }) => <p className="mb-3 leading-relaxed">{children}</p>,
          ul: ({ children }) => <ul className="mb-3 list-disc pl-6">{children}</ul>,
          ol: ({ children }) => <ol className="mb-3 list-decimal pl-6">{children}</ol>,
          li: ({ children }) => <li className="mb-1">{children}</li>,
          code: ({ children }) => (
            <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-900">{children}</code>
          ),
          pre: ({ children }) => (
            <pre className="mb-3 overflow-x-auto rounded-lg bg-slate-900 p-3 text-xs text-slate-100">
              {children}
            </pre>
          ),
          strong: ({ children }) => <strong className="font-semibold text-slate-900">{children}</strong>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
```

---

## 6. Componentes Features {#componentes-features}

### 6.1 src/features/auth/components/login-form.tsx

```typescript
"use client";

import { cn } from "@/src/lib/utils";
import { Button } from "@/src/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { 
  BookOpen, 
  GraduationCap, 
  Key, 
  Notebook, 
  Brain,
  Coffee,
  Library,
  Sparkles,
  Lock
} from "lucide-react";

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.detail || 'Error al iniciar sesión');
      }

      router.push("/protected");
      
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error al iniciar sesión";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <div className="relative overflow-hidden rounded-2xl border border-blue-200/20 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg">
        <div className="absolute -left-8 -top-8 h-40 w-40 rounded-full bg-blue-200/10 blur-xl" />
        <div className="absolute -right-6 -bottom-6 h-32 w-32 rounded-full bg-indigo-200/10 blur-xl" />
        
        <div className="relative p-1">
          <Card className="border-blue-200/30 bg-white/90 backdrop-blur-sm">
            <CardHeader className="pb-6">
              <div className="flex flex-col items-center gap-4 mb-4">
                <div className="relative">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
                    <GraduationCap className="h-10 w-10 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 p-2 rounded-full bg-amber-500">
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                </div>
                <div className="text-center">
                  <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
                    Bienvenido de Vuelta
                  </CardTitle>
                  <CardDescription className="text-blue-700/80 mt-2 text-base">
                    Continúa tu viaje de aprendizaje
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-blue-900">Correo Electrónico</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@ejemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="border-blue-200 focus-visible:ring-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="password" className="text-blue-900">Contraseña</Label>
                    <Link href="/auth/forgot-password" className="text-xs text-blue-600 hover:text-blue-700">
                      ¿Olvidaste?
                    </Link>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="border-blue-200 focus-visible:ring-blue-500"
                  />
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {error}
                  </div>
                )}

                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
                </Button>
              </form>

              <div className="mt-6 text-center text-sm">
                <span className="text-gray-600">¿No tienes cuenta? </span>
                <Link href="/auth/sign-up" className="text-blue-600 hover:text-blue-700 font-semibold">
                  Regístrate aquí
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
```

### 6.2 src/features/auth/components/logout-button.tsx

```typescript
"use client";

import { Button } from "@/src/components/ui/button";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  const logout = async () => {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
    router.push("/auth/login");
    router.refresh();
  };

  return <Button onClick={logout}>Logout</Button>;
}
```

### 6.3 src/features/dashboard/components/quick-access.tsx

```typescript
import Link from 'next/link';
import { Bot, FileText, TrendingUp, Flame, ChevronRight } from 'lucide-react';

export function QuickAccess() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 auto-rows-[minmax(180px,auto)]">
      {/* Acceso a Progreso (Destacado) */}
      <Link href="/protected/progreso" className="md:col-span-2 md:row-span-2 block">
        <div className="group relative overflow-hidden bg-surface-raised/90 backdrop-blur-xl border-2 border-zinc-800 rounded-3xl p-8 hover:border-brand-primary hover:shadow-2xl transition-all h-full flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between mb-8">
              <div className="p-4 rounded-2xl bg-zinc-800/50 group-hover:bg-brand-primary/20 transition-colors border border-zinc-700/50">
                <TrendingUp className="h-8 w-8 text-brand-primary" />
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900 border border-zinc-800/80">
                <Flame className="h-5 w-5 text-orange-500 animate-pulse" />
                <span className="text-sm font-black text-zinc-200 uppercase">5 Días</span>
              </div>
            </div>
            <h3 className="text-3xl font-black text-zinc-50 uppercase mb-2">Alto Rendimiento</h3>
            <p className="text-zinc-400 font-medium">Historial de precisión y estadísticas.</p>
          </div>
          
          <div className="mt-8 flex items-center gap-2 text-brand-primary font-bold uppercase text-sm">
            Entrar al Panel <ChevronRight className="h-5 w-5" />
          </div>
        </div>
      </Link>

      {/* Acceso a Cursos -> Tutores */}
      <Link href="/protected/cursos" className="md:col-span-2 block">
        <div className="group bg-surface-raised/90 backdrop-blur-xl border-2 border-zinc-800 rounded-3xl p-6 hover:border-brand-accent transition-all h-full flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-black text-zinc-50 uppercase">Tutores IA</h3>
            <div className="p-3 rounded-2xl bg-zinc-800/50 group-hover:bg-brand-accent/20 transition-colors">
              <Bot className="h-6 w-6 text-brand-accent" />
            </div>
          </div>
          <p className="text-zinc-400 text-sm mb-6">
            Coach personalizado para M1, M2, Ciencias y Lenguaje.
          </p>
          <div className="flex items-center gap-2 text-brand-accent font-bold uppercase text-sm">
            Ver Especialistas <ChevronRight className="h-4 w-4" />
          </div>
        </div>
      </Link>

      {/* Acceso a Ensayos */}
      <Link href="/protected/ensayos" className="md:col-span-2 block">
        <div className="group bg-surface-raised/90 backdrop-blur-xl border-2 border-zinc-800 rounded-3xl p-6 hover:border-indigo-400 transition-all h-full flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-black text-zinc-50 uppercase">Ensayos</h3>
            <div className="p-3 rounded-2xl bg-zinc-800/50 group-hover:bg-indigo-500/20 transition-colors">
              <FileText className="h-6 w-6 text-indigo-400" />
            </div>
          </div>
          <p className="text-zinc-400 text-sm mb-6">
            Ensayos completos cronometrados.
          </p>
          <div className="flex items-center gap-2 text-indigo-400 font-bold uppercase text-sm">
            Comenzar <ChevronRight className="h-4 w-4" />
          </div>
        </div>
      </Link>
    </div>
  );
}
```

### 6.4 src/features/dashboard/components/subject-card.tsx

```typescript
import { Bot, Sparkles, Hexagon, BrainCircuit, Orbit, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { getMateriaColor, MateriaId } from '@/lib/theme/materia-colors';

interface SubjectCardProps {
  id: string;
  name: string;
  description: string;
  icon_url?: string;
  onClick: () => void;
}

function resolveMateriaId(name: string): MateriaId {
  const lower = name.toLowerCase();
  if (lower.includes('matemática') || lower.includes('m1') || lower.includes('m2')) {
    return 'matematica';
  } else if (lower.includes('lectora') || lower.includes('lenguaje')) {
    return 'lenguaje';
  } else if (lower.includes('ciencia')) {
    return 'ciencias';
  } else if (lower.includes('historia')) {
    return 'historia';
  }
  return 'matematica';
}

export function SubjectCard({
  name,
  description,
  icon_url,
  onClick,
}: SubjectCardProps) {
  const lowerName = name.toLowerCase();
  const materiaId = resolveMateriaId(name);
  const materiaColor = getMateriaColor(materiaId);
  
  let ThemeIcon = Bot;
  if (lowerName.includes('matemática') || lowerName.includes('m1') || lowerName.includes('m2')) {
    ThemeIcon = Hexagon;
  } else if (lowerName.includes('lectora') || lowerName.includes('lenguaje')) {
    ThemeIcon = Sparkles;
  } else if (lowerName.includes('ciencia')) {
    ThemeIcon = Orbit;
  } else if (lowerName.includes('historia')) {
    ThemeIcon = BrainCircuit;
  }

  const themeColor = `text-${materiaColor.accent}`;
  const themeBg = `bg-${materiaColor.primary}/10 border-${materiaColor.primary}/20 hover:border-${materiaColor.primary}`;

  return (
    <button
      onClick={onClick}
      className={`group h-full bg-surface-raised/80 backdrop-blur-md border-2 border-zinc-800 rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 text-left flex flex-col justify-between`}
    >
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className={`p-4 rounded-2xl border ${themeBg} transition-colors`}>
            {icon_url ? (
              <div className="relative h-7 w-7">
                <Image
                  src={icon_url}
                  alt={name}
                  className="object-contain"
                  fill
                  sizes="28px"
                />
              </div>
            ) : (
              <ThemeIcon className={`h-7 w-7 ${themeColor}`} />
            )}
          </div>
          <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border border-zinc-800 bg-zinc-950 ${themeColor}`}>
            IA Coach
          </div>
        </div>

        <h3 className="text-xl font-black text-zinc-50 uppercase tracking-wide">
          Tutor {name}
        </h3>

        <p className="text-sm text-zinc-400 mt-3 font-medium line-clamp-2">
          {description || 'Entrena tus habilidades con asistencia inteligente.'}
        </p>
      </div>

      <div className={`mt-8 flex items-center gap-2 font-bold uppercase tracking-widest text-sm opacity-0 group-hover:opacity-100 transition-opacity ${themeColor}`}>
        <span>Entrenar con el Tutor</span>
        <ChevronRight className="h-5 w-5" />
      </div>
    </button>
  );
}
```

---

## 7. Hooks Personalizados {#hooks}

### 7.1 src/hooks/useAuth.ts

```typescript
'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/src/lib/api/client';

interface User {
  user_id: number;
  email: string;
  name: string;
  is_admin: boolean;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiFetch<User>('/auth/me')
      .then((u) => setUser(u))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  return {
    user,
    loading,
    isAuthenticated: !!user,
  };
}
```

### 7.2 src/features/ai/hooks/use-ai-explanation.ts

```typescript
import { useState } from 'react';

interface RequestAiExplanationParams {
  questionId: string;
  selectedAnswer: string;
  attemptId: string;
  timeoutMs?: number;
}

export function useAiExplanation() {
  const [loading, setLoading] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function requestExplanation({
    questionId,
    selectedAnswer,
    attemptId,
    timeoutMs = 35000,
  }: RequestAiExplanationParams) {
    setLoading(true);
    setError(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch('/api/ai/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_id: Number(questionId),
          selectedAnswer,
          attemptId,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.status === 429) {
        setError('Alcanzaste el límite de explicaciones. Upgrade a Premium para ilimitadas.');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to generate explanation');
      }

      if (!response.body) {
        throw new Error('ReadableStream not supported');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let done = false;

      setExplanation('');

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;

        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          
          const events = chunk.split('\n\n');
          for (const event of events) {
            if (event.startsWith('data: ')) {
              const dataStr = event.slice(6);
              if (dataStr.trim() === '[DONE]') {
                done = true;
                break;
              }
              setExplanation((prev) => (prev ? prev + dataStr : dataStr));
            }
          }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setError('El Tutor IA tardó demasiado (35s). Intenta de nuevo.');
      } else {
        setError('Error generando explicación. Intenta de nuevo.');
      }
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  }

  return {
    loading,
    explanation,
    error,
    requestExplanation,
  };
}
```

---

## 8. Servicios y Librerías {#servicios}

### 8.1 src/lib/api/client.ts

```typescript
const API_PROXY_BASE = "/api/backend";

let refreshPromise: Promise<boolean> | null = null;

export type ApiFetchOptions = Omit<RequestInit, 'body'> & {
  body?: BodyInit | Record<string, unknown> | null;
};

async function refreshSession(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include',
    })
      .then((response) => response.ok)
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

function redirectToLogin() {
  if (typeof window !== 'undefined') {
    window.location.href = '/auth/login';
  }
}

export async function apiFetch<T>(
  endpoint: string,
  options: ApiFetchOptions = {},
  allowRefresh = true
) {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = endpoint.startsWith('http')
    ? endpoint
    : `${API_PROXY_BASE}${cleanEndpoint}`;
  
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };

  const hasBody = options.body !== undefined && options.body !== null;
  if (hasBody && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const config = {
    ...options,
    credentials: 'include' as RequestCredentials,
    headers,
    body: options.body && typeof options.body === 'object'
      ? JSON.stringify(options.body)
      : options.body,
  };

  const res = await fetch(url, config);

  if (res.status === 401) {
    if (allowRefresh) {
      const refreshed = await refreshSession();
      if (refreshed) {
        return apiFetch<T>(endpoint, options, false);
      }
    }

    redirectToLogin();
    throw new Error('Token expirado. Por favor, inicia sesión de nuevo.');
  }

  if (!res.ok) {
    let errBody: Record<string, unknown> = {};
    try {
      errBody = await res.json();
    } catch {}
    const message =
      (typeof errBody?.detail === 'string' ? errBody.detail : JSON.stringify(errBody?.detail)) ||
      (typeof errBody?.error === 'string' ? errBody.error : JSON.stringify(errBody?.error)) ||
      (typeof errBody?.message === 'string' ? errBody.message : JSON.stringify(errBody?.message)) ||
      res.statusText;
    console.error(`Error de API [${res.status}]:`, errBody, message);
    throw new Error(message);
  }

  return (await res.json()) as T;
}
```

### 8.2 src/lib/auth/current-user.ts

```typescript
import { apiFetch } from '@/src/lib/api/client';

export type CurrentUser = {
  user_id: number;
  email: string;
  name: string;
  is_admin: boolean;
};

let cachedUser: CurrentUser | null = null;
let inFlightUserPromise: Promise<CurrentUser> | null = null;

export async function getCurrentUser(options?: { forceRefresh?: boolean }): Promise<CurrentUser> {
  const forceRefresh = options?.forceRefresh ?? false;

  if (!forceRefresh && cachedUser) {
    return cachedUser;
  }

  if (!forceRefresh && inFlightUserPromise) {
    return inFlightUserPromise;
  }

  inFlightUserPromise = apiFetch<CurrentUser>('/auth/me')
    .then((user) => {
      cachedUser = user;
      return user;
    })
    .finally(() => {
      inFlightUserPromise = null;
    });

  return inFlightUserPromise;
}

export function clearCurrentUserCache() {
  cachedUser = null;
  inFlightUserPromise = null;
}
```

### 8.3 src/lib/server/auth-session.ts

```typescript
import { NextResponse } from 'next/server';

const ACCESS_TOKEN_MAX_AGE_SECONDS = 60 * 60 * 24;
const REFRESH_TOKEN_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000';

function getCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge,
  };
}

export function clearAuthCookies(response: NextResponse) {
  response.cookies.set('access_token', '', { ...getCookieOptions(0), maxAge: 0 });
  response.cookies.set('refresh_token', '', { ...getCookieOptions(0), maxAge: 0 });
}

export async function relayAuthResponse(response: Response) {
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorResponse = NextResponse.json(
      { error: payload?.detail || payload?.error || 'No se pudo completar la autenticación' },
      { status: response.status },
    );
    clearAuthCookies(errorResponse);
    return errorResponse;
  }

  const nextResponse = NextResponse.json({
    user_id: payload.user_id,
    email: payload.email,
    name: payload.name,
    is_admin: payload.is_admin,
  });

  if (payload.access_token) {
    nextResponse.cookies.set('access_token', payload.access_token, getCookieOptions(ACCESS_TOKEN_MAX_AGE_SECONDS));
  }

  if (payload.refresh_token) {
    nextResponse.cookies.set('refresh_token', payload.refresh_token, getCookieOptions(REFRESH_TOKEN_MAX_AGE_SECONDS));
  }

  return nextResponse;
}
```

### 8.4 src/lib/utils.ts

```typescript
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };
  return date.toLocaleDateString('es-CL', options);
}
```

---

## 9. Tipos y Esquemas {#tipos}

### 9.1 src/types/quiz.ts

```typescript
/**
 * Quiz Types - Aligned with Backend Pydantic Schemas
 */

export interface BackendQuestionChoice {
  id: number;
  label: string;
  text: string;
}

export interface BackendQuestionOut {
  kind: "question";
  question_id: number;
  prompt: string;
  topic: string;
  reading_text?: string | null;
  choices: BackendQuestionChoice[];
}

export interface BackendTopicCompletedOut {
  kind: "topic_completed";
  message: string;
  attempt_id: number;
  status: string;
  total_questions: number;
  correct_count: number;
  score_percentage: number;
  score_paes: number;
  score: number;
}

export type NextQuestionResponse = BackendQuestionOut | BackendTopicCompletedOut;

export interface BackendAnswerIn {
  subject_code: string;
  topic_code: string;
  question_id: number;
  selected_choice_id: number;
  user_id?: number;
}

export interface BackendAnswerOut {
  attempt_id: number;
  feedback_id: number;
  is_correct: boolean;
  feedback_text: string;
  is_attempt_finished: boolean;
  ai_payload: Record<string, unknown>;
}

export interface QuizState {
  question: BackendQuestionOut | null;
  selectedChoice: number | null;
  submitted: boolean;
  isCorrect: boolean | null;
  feedbackText: string | null;
  aiPayload: Record<string, unknown> | null;
  isFinished: boolean;
  loading: boolean;
  error: string | null;
  attemptId: number | null;
  questionsAnswered: number;
  correctAnswers: number;
}
```

### 9.2 src/types/index.ts

```typescript
/**
 * Type Definitions
 */

export type { SignUpData, SignInData } from '@/src/features/auth/api/auth';
export type { Exam, ExamAttempt, Question } from '@/src/features/exams/api/exams';
export type { Subject, Topic } from '@/src/features/courses/api/courses';

export interface User {
  id: string;
  email: string;
  full_name?: string;
  created_at: string;
  updated_at?: string;
}

export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}
```

---

## 10. Estilos y Temas {#estilos}

### 10.1 app/globals.css

```css
@import "katex/dist/katex.min.css";

@tailwind base;
@tailwind components;
@tailwind utilities;

@theme {
  /* Marca Principal */
  --color-brand-primary: #6366f1;
  --color-brand-primary-hover: #4f46e5;
  --color-brand-primary-active: #4338ca;
  
  /* Marca Secundaria */
  --color-brand-accent: #10b981;
  --color-brand-accent-hover: #059669;
  --color-brand-accent-active: #047857;
  
  /* Superficies */
  --color-surface-base: #09090b;
  --color-surface-default: #18181b;
  --color-surface-raised: #27272a;
  --color-surface-container: #3f3f46;
  
  /* Tipografía */
  --color-text-primary: #fafafa;
  --color-text-secondary: #d4d4d8;
  --color-text-tertiary: #a1a1a6;
  --color-text-on-brand: #ffffff;
  
  /* Materias */
  --color-materia-math: #3b82f6;
  --color-materia-language: #ec4899;
  --color-materia-science: #10b981;
  --color-materia-history: #f59e0b;
  
  /* Tipografía Escala */
  --text-heading-xl: 2.5rem;
  --text-heading-lg: 1.875rem;
  --text-heading-md: 1.5rem;
  --text-body-base: 1rem;
  --text-body-sm: 0.875rem;
  
  /* Espaciado */
  --radius: 0.5rem;
  --radius-lg: 0.75rem;
}

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 0 0% 3.9%;
    --card: 0 0% 100%;
    --card-foreground: 0 0% 3.9%;
    --accent: 99 89% 60%;
  }
  
  .dark {
    --background: 0 0% 3.9%;
    --foreground: 0 0% 98%;
    --card: 0 0% 3.9%;
    --card-foreground: 0 0% 98%;
    --accent: 99 89% 60%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}

.ai-streaming-cursor > :last-child::after {
  content: '▋';
  margin-left: 0.25rem;
  display: inline-block;
  animation: blink 1s step-end infinite;
  color: var(--color-brand-accent, #10b981);
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  75% { transform: translateX(4px); }
}

.animate-error-shake {
  animation: shake 0.2s ease-in-out 0s 2;
}

@keyframes border-beam {
  0%, 100% { border-color: rgba(16, 185, 129, 0.2); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.0); }
  50% { border-color: rgba(16, 185, 129, 0.8); box-shadow: 0 0 15px 0 rgba(16, 185, 129, 0.2); }
}

.animate-border-beam {
  animation: border-beam 2s ease-in-out infinite;
}
```

### 10.2 lib/theme/materia-colors.ts

```typescript
/**
 * Configuración centralizada de colores por materia
 */

export type MateriaId = 'matematica' | 'lenguaje' | 'ciencias' | 'historia';

export interface MateriaColorConfig {
  primary: string;
  accent: string;
  light: string;
  dark: string;
  gradient: {
    from: string;
    to: string;
  };
}

export const MATERIA_COLORS: Record<MateriaId, MateriaColorConfig> = {
  matematica: {
    primary: 'blue-500',
    accent: 'blue-400',
    light: 'blue-50',
    dark: 'blue-900',
    gradient: {
      from: 'from-blue-500',
      to: 'to-blue-600',
    },
  },
  lenguaje: {
    primary: 'rose-500',
    accent: 'rose-400',
    light: 'rose-50',
    dark: 'rose-900',
    gradient: {
      from: 'from-rose-500',
      to: 'to-rose-600',
    },
  },
  ciencias: {
    primary: 'emerald-500',
    accent: 'emerald-400',
    light: 'emerald-50',
    dark: 'emerald-900',
    gradient: {
      from: 'from-emerald-500',
      to: 'to-emerald-600',
    },
  },
  historia: {
    primary: 'amber-500',
    accent: 'amber-400',
    light: 'amber-50',
    dark: 'amber-900',
    gradient: {
      from: 'from-amber-500',
      to: 'to-amber-600',
    },
  },
};

export function getMateriaColor(materiaId: string): MateriaColorConfig {
  const normalized = materiaId?.toLowerCase() as MateriaId;
  return MATERIA_COLORS[normalized] || MATERIA_COLORS.matematica;
}

export function getMateriaColorClass(materiaId: string): string {
  return `bg-${getMateriaColor(materiaId).primary}`;
}

export const MATERIA_LABELS: Record<MateriaId, string> = {
  matematica: 'Matemática',
  lenguaje: 'Lenguaje',
  ciencias: 'Ciencias',
  historia: 'Historia',
};
```

---

## Resumen Técnico

**Stack Frontend:**
- **Framework**: Next.js 16.1.6 (App Router + Turbopack)
- **UI Library**: React 19
- **Styling**: Tailwind CSS 4 + CSS Modules
- **State Management**: React Hooks + Context API
- **HTTP Client**: Fetch API con abstracción personalizada
- **Authentication**: JWT con cookies httpOnly
- **Type Safety**: TypeScript 5
- **Icons**: Lucide React

**Estructura:**
- App Router para ruteo
- Arquitectura por features (domain-driven)
- Componentes UI reutilizables
- Servicios centralizados
- API routes como proxies seguros

**Características:**
- ✅ Autenticación segura con JWT
- ✅ Dashboard interactivo
- ✅ Quiz en tiempo real con SSE
- ✅ Explicaciones IA con streaming
- ✅ Gestión de perfil usuario
- ✅ Sistema de pagos (Transbank Webpay)
- ✅ Responsive design mobile-first
- ✅ Temas de color dinámicos por materia

**Integración Backend:**
- Proxy a FastAPI backend en Python
- Separación de responsabilidades cliente/servidor
- Seguridad en edge (headers, CORS, CSP)

---

*Informe generado: Marzo 17, 2026*
*Frontend TutorPAES - Auditoría Completa de Codebase*
