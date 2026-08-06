'use client';

import { useEffect, useState } from 'react';
import { getCurrentUser } from '@/src/lib/auth/current-user';
import { CoursesPageView } from '@/src/features/courses/views/courses-page-view';
import { TeacherCoursesPageView } from '@/src/features/courses/components/teacher-courses-page-view';
import { Loader } from 'lucide-react';

export default function CursosPage() {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentUser()
      .then((user) => {
        setRole(user?.role || 'student');
      })
      .catch(() => {
        setRole('student');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <Loader className="h-10 w-10 text-brand-primary animate-spin mb-4" />
        <p className="text-text-tertiary font-black uppercase tracking-[0.2em] text-xs">Cargando Cursos...</p>
      </div>
    );
  }

  if (role === 'teacher' || role === 'admin') {
    return <TeacherCoursesPageView />;
  }

  return <CoursesPageView />;
}
