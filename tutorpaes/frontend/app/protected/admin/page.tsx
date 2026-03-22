'use client';

import { useEffect, useMemo, useState } from 'react';

import { apiFetch } from '@/src/lib/api/client';
import { getCurrentUser } from '@/src/lib/auth/current-user';

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
            setError('No tienes permisos para ver esta pagina.');
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
          setError('No se pudo cargar el panel de admin.');
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
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Panel Admin</h1>
        <p className="text-gray-600 mt-2">Gestiona usuarios y permisos</p>
      </div>

      {loading && (
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <p className="text-gray-600">Cargando usuarios...</p>
        </div>
      )}

      {error && !loading && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
          <p className="text-red-700 font-semibold">Error</p>
          <p className="text-red-600 text-sm mt-1">{error}</p>
        </div>
      )}

      {!loading && !error && me?.is_admin && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm"
              placeholder="Buscar por email o nombre"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="all">Todos los roles</option>
              <option value="student">Estudiante</option>
              <option value="teacher">Profesor</option>
              <option value="admin">Admin</option>
            </select>
            <select
              className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="all">Todos los estados</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </select>
          </div>

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="px-4 py-3 font-semibold text-gray-700">ID</th>
                  <th className="px-4 py-3 font-semibold text-gray-700">Nombre</th>
                  <th className="px-4 py-3 font-semibold text-gray-700">Email</th>
                  <th className="px-4 py-3 font-semibold text-gray-700">Rol</th>
                  <th className="px-4 py-3 font-semibold text-gray-700">Estado</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-t border-gray-100">
                    <td className="px-4 py-3 text-gray-600">{user.id}</td>
                    <td className="px-4 py-3 text-gray-900 font-medium">{user.name}</td>
                    <td className="px-4 py-3 text-gray-600">{user.email}</td>
                    <td className="px-4 py-3">
                      <select
                        className="rounded-md border border-gray-200 bg-white px-3 py-1 text-sm"
                        value={user.is_admin ? 'admin' : user.role}
                        onChange={(e) => updateUser(user.id, { role: e.target.value })}
                      >
                        <option value="student">Estudiante</option>
                        <option value="teacher">Profesor</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          user.is_active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-200 text-gray-600'
                        }`}
                        onClick={() => updateUser(user.id, { is_active: !user.is_active })}
                      >
                        {user.is_active ? 'Activo' : 'Inactivo'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
