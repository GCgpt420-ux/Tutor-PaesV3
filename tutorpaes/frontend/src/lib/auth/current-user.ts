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