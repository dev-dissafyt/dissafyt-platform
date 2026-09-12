import { AppRole, getSupabaseBrowserClient } from '@dissafyt/database';

export interface AdminOperator {
  email: string;
  role: AppRole;
  fullName?: string;
}

const STORAGE_KEY = 'dissafyt_admin_operator';

export const DEFAULT_OPERATOR: AdminOperator = {
  email: 'curtislee@dissafyt.com',
  role: 'admin',
  fullName: 'Curtis-Lee',
};

export function getActiveOperator(): AdminOperator {
  if (typeof window === 'undefined') return DEFAULT_OPERATOR;
  try {
    const cookieEmail = getCookie('dissafyt_admin_email');
    const cookieRole = (getCookie('dissafyt_admin_role') as AppRole) || 'admin';
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (cookieEmail && parsed.email !== cookieEmail) {
        return {
          email: cookieEmail,
          role: cookieRole,
          fullName: cookieEmail.split('@')[0],
        };
      }
      return parsed;
    }
    if (cookieEmail) {
      return {
        email: cookieEmail,
        role: cookieRole,
        fullName: cookieEmail.split('@')[0],
      };
    }
  } catch {
    // ignore
  }
  return DEFAULT_OPERATOR;
}

export function setActiveOperator(operator: AdminOperator): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(operator));
    window.dispatchEvent(new CustomEvent('admin_operator_changed', { detail: operator }));
  } catch {
    // ignore
  }
}

export async function logoutAdmin(): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
  } catch {
    // ignore
  }

  // Clear cookies
  document.cookie = 'dissafyt_admin_token=; path=/; max-age=0; SameSite=Lax';
  document.cookie = 'dissafyt_admin_email=; path=/; max-age=0; SameSite=Lax';
  document.cookie = 'dissafyt_admin_role=; path=/; max-age=0; SameSite=Lax';

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }

  window.location.href = '/login';
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

/**
 * Fetch wrapper that automatically appends active operator session token and RBAC headers.
 */
export async function adminFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const operator = getActiveOperator();
  const headers = new Headers(init?.headers || {});

  // 1. Attach Bearer token from cookie or browser Supabase session
  let token = getCookie('dissafyt_admin_token');
  if (!token && typeof window !== 'undefined') {
    try {
      const supabase = getSupabaseBrowserClient();
      const { data } = await supabase.auth.getSession();
      token = data?.session?.access_token || null;
    } catch {
      // ignore
    }
  }

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (!headers.has('x-admin-role')) {
    headers.set('x-admin-role', operator.role);
  }
  if (!headers.has('x-admin-email')) {
    headers.set('x-admin-email', operator.email);
  }

  return fetch(input, {
    ...init,
    headers,
  });
}
