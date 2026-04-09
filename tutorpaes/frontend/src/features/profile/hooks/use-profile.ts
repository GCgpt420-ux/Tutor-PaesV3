import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/src/lib/api/client';

export interface UserProfile {
  user_id: number;
  email: string;
  name: string;
  is_admin: boolean;
  age?: number | null;
  academic_level?: string | null;
  target_university?: string | null;
  target_degree?: string | null;
}

export interface ProfileFormData {
  name: string;
  email?: string; // Sometimes email is readonly but returned
  age: number | null;
  academic_level: string;
  target_university: string;
  target_degree: string;
}

// Claves de cache de React Query
export const profileKeys = {
  all: ['profile'] as const,
  me: () => [...profileKeys.all, 'me'] as const,
};

// Hook: Obtener el perfil del usuario actual
export function useProfile() {
  return useQuery({
    queryKey: profileKeys.me(),
    queryFn: async () => {
      return apiFetch<UserProfile>('/auth/me');
    },
  });
}

// Hook: Actualizar el perfil del usuario
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ProfileFormData) => {
      return apiFetch<UserProfile>('/auth/me', {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    onSuccess: (updatedProfile) => {
      // Invalida o actualiza el cache local para reflejar instantáneamente el nuevo perfil
      queryClient.setQueryData(profileKeys.me(), updatedProfile);
    },
  });
}
