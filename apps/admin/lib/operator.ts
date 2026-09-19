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

export function getCookieDomain(): string {
  if (typeof window === 'undefined') return '';
  const hostname = window.location.hostname;
  if (hostname.endsWith('dissafyt.com')) {
    return '; domain=.dissafyt.com';
  }
  return '';
}

/**
 * Fetch wrapper that automatically appends active operator session token and RBAC headers.
 * Prioritizes live, refreshed Supabase Auth tokens over stale cookies and auto-retries on 401.
 */
export async function adminFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const operator = getActiveOperator();
  const headers = new Headers(init?.headers || {});

  // 1. Prioritize live Supabase session token in browser to prevent expired cookie JWT lockouts
  let token: string | null = null;
  if (typeof window !== 'undefined') {
    try {
      const supabase = getSupabaseBrowserClient();
      const { data } = await supabase.auth.getSession();
      if (data?.session?.access_token) {
        token = data.session.access_token;
        // Keep cookie refreshed with the active access token
        const maxAge = 60 * 60 * 24 * 7; // 7 days
        const domainPart = getCookieDomain();
        document.cookie = `dissafyt_admin_token=${encodeURIComponent(token)}; path=/; max-age=${maxAge}; SameSite=Lax${domainPart}`;
      }
    } catch {
      // ignore
    }
  }

  // 2. Fall back to cookie token if browser session was not yet initialized
  if (!token) {
    token = getCookie('dissafyt_admin_token');
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

  let res = await fetch(input, {
    ...init,
    headers,
  });

  // 3. Auto-recovery: If 401 Unauthorized, attempt session refresh and retry once
  if (res.status === 401 && typeof window !== 'undefined') {
    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase.auth.refreshSession();
      if (!error && data?.session?.access_token) {
        const freshToken = data.session.access_token;
        const maxAge = 60 * 60 * 24 * 7;
        const domainPart = getCookieDomain();
        document.cookie = `dissafyt_admin_token=${encodeURIComponent(freshToken)}; path=/; max-age=${maxAge}; SameSite=Lax${domainPart}`;
        headers.set('Authorization', `Bearer ${freshToken}`);
        res = await fetch(input, {
          ...init,
          headers,
        });
      }
    } catch {
      // ignore
    }
  }

  return res;
}
