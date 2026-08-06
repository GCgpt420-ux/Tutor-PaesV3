'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/src/lib/api/client';
import { getCurrentUser } from '@/src/lib/auth/current-user';
import { Loader2, Shield, Search, Filter, ShieldAlert, CheckCircle, XCircle } from 'lucide-react';

type UserMe = {
  user_id: number;
  email: string;
  name: string;
  is_admin: boolean;
};

type AdminUser = {
  id: number;
  email: string;
  name: string;
  role: string;
  is_admin: boolean;
  is_active: boolean;
};

export default function AdminPage() {
  const [me, setMe] = useState<UserMe | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('all');
  const [status, setStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    if (role !== 'all') params.set('role', role);
    if (status !== 'all') params.set('is_active', status === 'active' ? 'true' : 'false');
    return params.toString();
  }, [search, role, status]);

  useEffect(() => {
    let isMounted = true;

    async function loadMeAndUsers() {
      try {
        setLoading(true);
        const user = await getCurrentUser();
        if (!user.is_admin) {
          if (isMounted) {
            setMe(user);
            setError('No tienes permisos de administrador para ver esta página.');
          }
          return;
        }

        const list = await apiFetch<AdminUser[]>(`/admin/users?${queryParams}`);
        if (isMounted) {
          setMe(user);
          setUsers(list);
        }
      } catch {
        if (isMounted) {
          setError('No se pudo cargar el panel de administración.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadMeAndUsers();

    return () => {
      isMounted = false;
    };
  }, [queryParams]);

  const updateUser = async (userId: number, payload: Partial<AdminUser>) => {
    try {
      const updated = await apiFetch<AdminUser>(`/admin/users/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    } catch {
      setError('No se pudo actualizar el usuario.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 text-white animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="border-b border-white/10 pb-6 mb-10">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="h-5 w-5 text-brand-primary animate-pulse" />
          <span className="text-[10px] font-mono font-black uppercase tracking-[0.3em] text-brand-primary">
            Panel de Seguridad / Administración
          </span>
        </div>
        <h1 className="text-3xl md:text-4xl font-black text-text-primary uppercase tracking-tight">
          Gestión de Usuarios
        </h1>
        <p className="text-text-tertiary font-medium mt-1">
          Administra roles, permisos, estados de cuenta y credenciales.
        </p>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center min-h-[30vh]">
          <Loader2 className="h-8 w-8 text-brand-primary animate-spin mb-3" />
          <p className="text-xs text-text-tertiary font-mono uppercase tracking-widest">Cargando nómina...</p>
        </div>
      )}

      {error && !loading && (
        <div className="glass-card p-6 border-brand-danger/30 bg-brand-danger/5 flex items-start gap-4 animate-error-shake">
          <ShieldAlert className="h-6 w-6 text-brand-danger shrink-0 mt-0.5" />
          <div>
            <p className="text-brand-danger font-black uppercase tracking-widest text-sm">Alerta de Seguridad</p>
            <p className="text-text-secondary text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      {!loading && !error && me?.is_admin && (
        <>
          {/* Filters Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-black/30 p-4 border border-white/5 rounded-2xl">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
              <input
                className="w-full pl-10 pr-4 py-2.5 bg-surface-raised/40 border border-white/10 rounded-xl text-text-primary placeholder:text-text-tertiary text-xs transition-all focus:border-brand-primary/50 focus:outline-none"
                placeholder="Buscar por email o nombre..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Role Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
              <select
                className="w-full pl-10 pr-4 py-2.5 bg-surface-raised/40 border border-white/10 rounded-xl text-text-primary text-xs transition-all focus:border-brand-primary/50 focus:outline-none appearance-none"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="all">Todos los roles</option>
                <option value="student">Estudiantes</option>
                <option value="teacher">Profesores</option>
                <option value="admin">Administradores</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
              <select
                className="w-full pl-10 pr-4 py-2.5 bg-surface-raised/40 border border-white/10 rounded-xl text-text-primary text-xs transition-all focus:border-brand-primary/50 focus:outline-none appearance-none"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="all">Todos los estados</option>
                <option value="active">Activos</option>
                <option value="inactive">Inactivos</option>
              </select>
            </div>
          </div>

          {/* Users Table */}
          <div className="overflow-hidden border border-white/5 bg-black/20 rounded-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.02] text-text-tertiary uppercase font-mono tracking-widest text-[9px]">
                    <th className="py-4 px-4 font-bold">ID</th>
                    <th className="py-4 px-4 font-bold">Usuario</th>
                    <th className="py-4 px-4 font-bold">Email</th>
                    <th className="py-4 px-4 font-bold">Rol</th>
                    <th className="py-4 px-4 font-bold text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-4 px-4 font-mono text-text-tertiary font-bold">{user.id}</td>
                      <td className="py-4 px-4">
                        <div className="font-bold text-text-primary uppercase tracking-tight">{user.name}</div>
                      </td>
                      <td className="py-4 px-4 font-mono text-text-secondary">{user.email}</td>
                      <td className="py-4 px-4">
                        <select
                          className="bg-surface-raised/50 border border-white/10 rounded-lg px-3 py-1.5 text-[11px] font-mono font-bold text-text-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-all focus:border-brand-primary/50 focus:outline-none"
                          value={user.is_admin ? 'admin' : user.role}
                          onChange={(e) => updateUser(user.id, { role: e.target.value })}
                          disabled={user.id === me?.user_id}
                        >
                          <option value="student">ESTUDIANTE</option>
                          <option value="teacher">PROFESOR</option>
                          <option value="admin">ADMINISTRADOR</option>
                        </select>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <button
                          className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1 text-[10px] font-mono font-black uppercase tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                            user.is_active
                              ? 'bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20'
                              : 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20 hover:bg-zinc-500/20'
                          }`}
                          onClick={() => updateUser(user.id, { is_active: !user.is_active })}
                          disabled={user.id === me?.user_id}
                        >
                          {user.is_active ? (
                            <>
                              <CheckCircle className="h-3 w-3" />
                              ACTIVO
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3 w-3" />
                              INACTIVO
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
