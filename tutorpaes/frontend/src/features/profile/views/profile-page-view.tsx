'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Save, GraduationCap, School, BookOpen, UserCircle, Lock, Eye, EyeOff, Zap } from 'lucide-react';
import { apiFetch } from '@/src/lib/api/client';
import { useProfile, useUpdateProfile, ProfileFormData } from '@/src/features/profile/hooks/use-profile';

export function ProfilePageView() {
  const { data: user, isLoading: loading, isError, error: queryError } = useProfile();
  const updateProfileMutation = useUpdateProfile();

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
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        age: user.age || null,
        academic_level: user.academic_level || '',
        target_university: user.target_university || '',
        target_degree: user.target_degree || '',
      });
    }
  }, [user]);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'age' ? (value ? Number(value) : null) : value,
    }));
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMessage(null);

    updateProfileMutation.mutate(formData, {
      onSuccess: () => {
        setProfileMessage({ type: 'success', text: '¡Perfil actualizado correctamente!' });
        setTimeout(() => setProfileMessage(null), 3000);
      },
      onError: () => {
        setProfileMessage({ type: 'error', text: 'Error al actualizar el perfil.' });
      }
    });
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
      // Mantendremos esto con apiFetch por ahora para este paso, 
      // ideal sería extraerlo también a un mutador de react-query.
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
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="relative">
          <div className="h-16 w-16 border-t-4 border-b-4 border-brand-primary rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <UserCircle className="h-6 w-6 text-brand-primary" />
          </div>
        </div>
        <p className="text-text-tertiary font-black uppercase tracking-[0.2em] text-xs">Sincronizando perfil...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex justify-center items-center min-h-[60vh] p-6 text-center">
        <div className="glass-card p-10 border-brand-danger/30 bg-brand-danger/5 animate-error-shake">
          <p className="text-brand-danger font-black uppercase tracking-widest text-sm mb-2">Error al cargar perfil</p>
          <p className="text-text-secondary text-sm">{queryError instanceof Error ? queryError.message : 'Error desconocido'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20 p-6">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-12">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3 mb-2">
            <span className="h-1.5 w-12 bg-brand-primary rounded-full" />
            <span className="text-[10px] font-black text-brand-primary uppercase tracking-[0.4em]">Panel de Control</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-text-primary uppercase tracking-tight">Mi Perfil</h1>
          <p className="text-text-tertiary font-medium text-lg">Personaliza tu experiencia de estudio y objetivos académicos.</p>
        </div>

        <div className="glass-card p-6 border-white/10 bg-surface-raised/40 shadow-2xl flex items-center gap-8 min-w-[320px]">
          <div className="flex-1">
            <p className="text-[10px] font-black text-brand-primary uppercase tracking-widest mb-1">Tu Suscripción</p>
            <p className="text-2xl font-black text-text-primary uppercase tracking-tighter">Plan Free</p>
          </div>

          <Link
            href="/pricing"
            className="bg-brand-primary hover:bg-brand-primary/90 text-white px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-brand-primary/20 transition-all flex items-center gap-2 group"
          >
            Mejorar plan
            <Zap className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" />
          </Link>
        </div>
      </div>

      {profileMessage && (
        <div
          className={`px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] border transition-all ${
            profileMessage.type === 'success'
              ? 'bg-success/10 border-success/20 text-success'
              : 'bg-brand-danger/10 border-brand-danger/20 text-brand-danger animate-error-shake'
          }`}
        >
          {profileMessage.text}
        </div>
      )}

      {passwordSuccess && (
        <div className="px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] border bg-success/10 border-success/20 text-success">
          Contraseña actualizada exitosamente
        </div>
      )}

      {user && (
        <div className="grid grid-cols-1 gap-10">
          <div className="glass-card bg-surface-raised/10 rounded-3xl border-white/5 overflow-hidden">
            <div className="p-10">
              <form onSubmit={handleProfileSubmit} className="space-y-12">
                <section>
                  <h2 className="text-sm font-black text-text-primary uppercase tracking-[0.2em] mb-8 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center">
                      <UserCircle className="w-5 h-5 text-brand-primary" />
                    </div>
                    Información Personal
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-text-tertiary uppercase tracking-[0.2em] ml-1">E-mail de Acceso</label>
                      <input
                        type="email"
                        value={formData.email}
                        disabled
                        className="w-full p-4 bg-zinc-950/50 border border-white/5 rounded-2xl text-text-tertiary cursor-not-allowed font-medium text-sm"
                      />
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-text-tertiary uppercase tracking-[0.2em] ml-1">Nombre</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleProfileChange}
                        placeholder="Ej: Juan Pérez"
                        className="w-full p-4 bg-zinc-950/20 border border-white/10 rounded-2xl text-text-primary placeholder:text-zinc-700 focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary outline-none transition-all font-medium text-sm"
                      />
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-text-tertiary uppercase tracking-[0.2em] ml-1">Edad</label>
                      <input
                        type="number"
                        name="age"
                        value={formData.age || ''}
                        onChange={handleProfileChange}
                        placeholder="17"
                        className="w-full p-4 bg-zinc-950/20 border border-white/10 rounded-2xl text-text-primary placeholder:text-zinc-700 focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary outline-none transition-all font-medium text-sm"
                      />
                    </div>
                  </div>
                </section>

                <div className="h-px bg-white/5 w-full" />

                <section>
                  <h2 className="text-sm font-black text-text-primary uppercase tracking-[0.2em] mb-8 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center">
                      <GraduationCap className="w-5 h-5 text-brand-primary" />
                    </div>
                    Objetivos Académicos
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-[10px) font-black text-text-tertiary uppercase tracking-[0.2em] ml-1">Situación Actual</label>
                      <div className="relative group">
                        <select
                          name="academic_level"
                          value={formData.academic_level}
                          onChange={handleProfileChange}
                          className="w-full p-4 pl-12 bg-zinc-950/20 border border-white/10 rounded-2xl text-text-primary focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary outline-none transition-all font-medium text-sm appearance-none"
                        >
                          <option value="" className="bg-surface-raised">Seleccionar nivel...</option>
                          <option value="3ro Medio" className="bg-surface-raised">3ro Medio</option>
                          <option value="4to Medio" className="bg-surface-raised">4to Medio</option>
                          <option value="Egresado" className="bg-surface-raised">Egresado / Año Sabático</option>
                          <option value="Trabajando" className="bg-surface-raised">Trabajando y Estudiando</option>
                        </select>
                        <School className="absolute left-4 top-4 w-4 h-4 text-text-tertiary group-focus-within:text-brand-primary transition-colors" />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-text-tertiary uppercase tracking-[0.2em] ml-1">Universidad Objetivo</label>
                      <div className="relative group">
                        <input
                          type="text"
                          name="target_university"
                          value={formData.target_university}
                          onChange={handleProfileChange}
                          placeholder="Ej: Universidad de Chile"
                          className="w-full p-4 pl-12 bg-zinc-950/20 border border-white/10 rounded-2xl text-text-primary placeholder:text-zinc-700 focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary outline-none transition-all font-medium text-sm"
                        />
                        <School className="absolute left-4 top-4 w-4 h-4 text-text-tertiary group-focus-within:text-brand-primary transition-colors" />
                      </div>
                    </div>

                    <div className="space-y-3 md:col-span-2">
                      <label className="text-[10px] font-black text-text-tertiary uppercase tracking-[0.2em] ml-1">Especialidad / Carreras</label>
                      <div className="relative group">
                        <BookOpen className="absolute left-4 top-4 w-4 h-4 text-text-tertiary group-focus-within:text-brand-primary transition-colors" />
                        <input
                          type="text"
                          name="target_degree"
                          value={formData.target_degree}
                          onChange={handleProfileChange}
                          placeholder="Ej: Ingeniería Civil / Medicina"
                          className="w-full p-4 pl-12 bg-zinc-950/20 border border-white/10 rounded-2xl text-text-primary placeholder:text-zinc-700 focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary outline-none transition-all font-medium text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </section>

                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    disabled={updateProfileMutation.isPending}
                    className="flex items-center gap-3 bg-brand-primary hover:bg-brand-primary/90 text-white font-black py-4 px-10 rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-brand-primary/20 uppercase tracking-[0.2em] text-[10px] group"
                  >
                    {updateProfileMutation.isPending ? (
                      <>Sincronizando...</>
                    ) : (
                      <>
                        <Save className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        Actualizar Archivos
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="glass-card bg-surface-raised/5 rounded-3xl border-white/5 overflow-hidden">
            <div className="p-10">
              <div className="flex items-center justify-between mb-10">
                <h2 className="text-sm font-black text-text-primary uppercase tracking-[0.2em] flex items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-brand-danger/10 border border-brand-danger/20 flex items-center justify-center">
                    <Lock className="w-5 h-5 text-brand-danger" />
                  </div>
                  Seguridad de Acceso
                </h2>
                <button
                  onClick={() => setShowChangePassword(!showChangePassword)}
                  className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all border ${
                    showChangePassword 
                      ? 'bg-white/5 border-white/10 text-text-tertiary hover:text-text-primary' 
                      : 'bg-brand-primary/10 border-brand-primary/20 text-brand-primary hover:bg-brand-primary/20'
                  }`}
                >
                  {showChangePassword ? 'Cancelar' : 'Cambiar Password'}
                </button>
              </div>

              {showChangePassword && (
                <form onSubmit={handleChangePassword} className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-300">
                  {passwordError && (
                    <div className="bg-brand-danger/10 border border-brand-danger/20 px-6 py-4 rounded-2xl flex gap-3 animate-error-shake">
                      <span className="text-brand-danger font-black uppercase tracking-widest text-[10px]">{passwordError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-text-tertiary uppercase tracking-[0.2em] ml-1">
                        Token Actual
                      </label>
                      <div className="relative group">
                        <input
                          type={showCurrentPassword ? 'text' : 'password'}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="w-full p-4 pr-12 bg-zinc-950/20 border border-white/10 rounded-2xl text-text-primary placeholder:text-zinc-700 focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary outline-none transition-all font-medium text-sm"
                          placeholder="Contraseña vigente"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-4 top-4 text-text-tertiary hover:text-text-primary transition-colors"
                        >
                          {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-text-tertiary uppercase tracking-[0.2em] ml-1">
                        Nueva Secuencia
                      </label>
                      <div className="relative group">
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full p-4 pr-12 bg-zinc-950/20 border border-white/10 rounded-2xl text-text-primary placeholder:text-zinc-700 focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary outline-none transition-all font-medium text-sm"
                          placeholder="Nueva contraseña de acceso"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-4 top-4 text-text-tertiary hover:text-text-primary transition-colors"
                        >
                          {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3 md:col-span-2">
                      <label className="text-[10px] font-black text-text-tertiary uppercase tracking-[0.2em] ml-1">
                        Confirmar Nueva Secuencia
                      </label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full p-4 bg-zinc-950/20 border border-white/10 rounded-2xl text-text-primary placeholder:text-zinc-700 focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary outline-none transition-all font-medium text-sm"
                        placeholder="Repite la nueva contraseña"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={passwordLoading}
                      className="bg-brand-primary hover:bg-brand-primary/90 disabled:opacity-50 text-white font-black py-4 px-10 rounded-2xl transition-all shadow-xl shadow-brand-primary/20 uppercase tracking-[0.2em] text-[10px]"
                    >
                      {passwordLoading ? 'Cifrando...' : 'Actualizar Llave de Acceso'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
