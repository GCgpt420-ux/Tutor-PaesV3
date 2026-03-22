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

export function ProfilePageView() {
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
      await apiFetch('/auth/me', {
        method: 'PUT',
        body: JSON.stringify(formData),
      });

      setProfileMessage({ type: 'success', text: '¡Perfil actualizado correctamente!' });
      setTimeout(() => setProfileMessage(null), 3000);
    } catch {
      setProfileMessage({ type: 'error', text: 'Error al actualizar el perfil.' });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Todos los campos son obligatorios');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Las nuevas contraseñas no coinciden');
      return;
    }

    if (newPassword.length < 10) {
      setPasswordError('La contraseña debe tener al menos 10 caracteres');
      return;
    }

    try {
      setPasswordLoading(true);
      await apiFetch('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
          confirm_password: confirmPassword,
        }),
      });

      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowChangePassword(false);

      setTimeout(() => setPasswordSuccess(false), 5000);
    } catch (error: unknown) {
      setPasswordError(error instanceof Error ? error.message : 'Error al cambiar la contraseña');
    } finally {
      setPasswordLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-gray-500">Cargando perfil...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-red-600 bg-red-50 p-4 rounded-lg">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-black text-zinc-50 uppercase tracking-tight">Mi Perfil</h1>
          <p className="text-zinc-400 font-medium">Completa tu información para personalizar tus misiones.</p>
        </div>

        <div className="bg-zinc-900/80 backdrop-blur-sm p-4 rounded-2xl border-2 border-zinc-800 shadow-xl flex items-center gap-5">
          <div>
            <p className="text-xs text-brand-primary font-bold uppercase tracking-wider">Plan actual</p>
            <p className="text-lg font-black text-zinc-50 uppercase">Free</p>
          </div>

          <Link
            href="/pricing"
            className="bg-brand-primary hover:bg-brand-primary/90 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-brand-primary/20 transition-all text-sm whitespace-nowrap flex items-center gap-2"
          >
            Mejorar Plan
          </Link>
        </div>
      </div>

      {profileMessage && (
        <div
          className={`p-4 rounded-xl text-sm font-bold border-2 ${
            profileMessage.type === 'success'
              ? 'bg-brand-accent/10 border-brand-accent/20 text-brand-accent'
              : 'bg-red-900/20 border-red-900/50 text-red-400 animate-error-shake'
          }`}
        >
          {profileMessage.text}
        </div>
      )}

      {passwordSuccess && (
        <div className="p-4 rounded-xl text-sm font-bold border-2 bg-brand-accent/10 border-brand-accent/20 text-brand-accent">
          Contraseña actualizada exitosamente
        </div>
      )}

      {user && (
        <>
          <div className="bg-surface-raised/80 backdrop-blur-sm rounded-3xl shadow-2xl border-2 border-zinc-800 overflow-hidden">
            <div className="p-8">
              <form onSubmit={handleProfileSubmit} className="space-y-8">
                <div>
                  <h2 className="text-xl font-black text-zinc-50 uppercase tracking-wide mb-6 flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-brand-primary/10 border border-brand-primary/20">
                      <UserCircle className="w-5 h-5 text-brand-primary" />
                    </div>
                    Información Personal
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-zinc-300 uppercase tracking-wider">Correo Electrónico</label>
                      <input
                        type="email"
                        value={formData.email}
                        disabled
                        className="w-full p-4 bg-zinc-950/50 border-2 border-zinc-800 rounded-xl text-zinc-500 cursor-not-allowed font-medium"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-zinc-300 uppercase tracking-wider">Nombre Completo</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleProfileChange}
                        placeholder="Ej: Juan Pérez"
                        className="w-full p-4 bg-zinc-950 border-2 border-zinc-800 rounded-xl text-zinc-50 placeholder:text-zinc-600 focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none transition-all font-medium"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-zinc-300 uppercase tracking-wider">Edad</label>
                      <input
                        type="number"
                        name="age"
                        value={formData.age || ''}
                        onChange={handleProfileChange}
                        placeholder="17"
                        className="w-full p-4 bg-zinc-950 border-2 border-zinc-800 rounded-xl text-zinc-50 placeholder:text-zinc-600 focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none transition-all font-medium"
                      />
                    </div>
                  </div>
                </div>

                <hr className="border-2 border-zinc-800/50" />

                <div>
                  <h2 className="text-xl font-black text-zinc-50 uppercase tracking-wide mb-6 flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-brand-accent/10 border border-brand-accent/20">
                      <GraduationCap className="w-5 h-5 text-brand-accent" />
                    </div>
                    Misiones Académicas
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-zinc-300 uppercase tracking-wider">Situación Actual</label>
                      <div className="relative">
                        <School className="absolute left-4 top-4 w-5 h-5 text-zinc-500" />
                        <select
                          name="academic_level"
                          value={formData.academic_level}
                          onChange={handleProfileChange}
                          className="w-full pl-12 p-4 bg-zinc-950 border-2 border-zinc-800 rounded-xl text-zinc-50 focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none transition-all font-medium appearance-none"
                        >
                          <option value="" className="bg-zinc-900">Selecciona tu nivel...</option>
                          <option value="3ro Medio" className="bg-zinc-900">3ro Medio</option>
                          <option value="4to Medio" className="bg-zinc-900">4to Medio</option>
                          <option value="Egresado" className="bg-zinc-900">Egresado / Año Sabático</option>
                          <option value="Trabajando" className="bg-zinc-900">Trabajando y Estudiando</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-zinc-300 uppercase tracking-wider">Universidad Objetivo</label>
                      <div className="relative">
                        <School className="absolute left-4 top-4 w-5 h-5 text-zinc-500" />
                        <input
                          type="text"
                          name="target_university"
                          value={formData.target_university}
                          onChange={handleProfileChange}
                          placeholder="Ej: Universidad de Chile"
                          className="w-full pl-12 p-4 bg-zinc-950 border-2 border-zinc-800 rounded-xl text-zinc-50 placeholder:text-zinc-600 focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none transition-all font-medium"
                        />
                      </div>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-bold text-zinc-300 uppercase tracking-wider">Especialidad</label>
                      <div className="relative">
                        <BookOpen className="absolute left-4 top-4 w-5 h-5 text-zinc-500" />
                        <input
                          type="text"
                          name="target_degree"
                          value={formData.target_degree}
                          onChange={handleProfileChange}
                          placeholder="Ej: Ingeniería"
                          className="w-full pl-12 p-4 bg-zinc-950 border-2 border-zinc-800 rounded-xl text-zinc-50 placeholder:text-zinc-600 focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none transition-all font-medium"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-6">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 bg-brand-primary hover:bg-brand-primary/90 text-white font-bold py-4 px-8 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-brand-primary/20 uppercase tracking-widest text-sm"
                  >
                    {saving ? (
                      <>Guardando...</>
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        Guardar
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

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
                  className="text-sm text-brand-primary hover:text-brand-primary/80 font-bold uppercase tracking-wide transition-colors"
                >
                  {showChangePassword ? 'Cancelar' : 'Cambiar Contraseña'}
                </button>
              </div>

              {showChangePassword && (
                <form onSubmit={handleChangePassword} className="space-y-6">
                  {passwordError && (
                    <p className="text-sm font-bold text-red-400 bg-red-900/20 border-2 border-red-900/50 p-4 rounded-xl animate-error-shake">
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
                        className="w-full p-4 bg-zinc-950 border-2 border-zinc-800 rounded-xl text-zinc-50 placeholder:text-zinc-600 focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none transition-all font-medium pr-12"
                        placeholder="Ingresa tu contraseña actual"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-4 top-4 text-zinc-500 hover:text-zinc-300 transition-colors"
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
                        className="w-full p-4 bg-zinc-950 border-2 border-zinc-800 rounded-xl text-zinc-50 placeholder:text-zinc-600 focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none transition-all font-medium pr-12"
                        placeholder="Ingresa tu nueva contraseña"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-4 top-4 text-zinc-500 hover:text-zinc-300 transition-colors"
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
                      className="w-full p-4 bg-zinc-950 border-2 border-zinc-800 rounded-xl text-zinc-50 placeholder:text-zinc-600 focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none transition-all font-medium"
                      placeholder="Confirma tu nueva contraseña"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={passwordLoading}
                    className="w-full bg-brand-primary hover:bg-brand-primary/90 disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-brand-primary/20 uppercase tracking-wide mt-2"
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
