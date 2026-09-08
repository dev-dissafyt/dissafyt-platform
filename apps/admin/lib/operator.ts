import { AppRole } from '@dissafyt/database';

export interface AdminOperator {
  email: string;
  role: AppRole;
}

const STORAGE_KEY = 'dissafyt_admin_operator';

export const DEFAULT_OPERATOR: AdminOperator = {
  email: 'admin@dissafyt.com',
  role: 'admin',
};

export function getActiveOperator(): AdminOperator {
  if (typeof window === 'undefined') return DEFAULT_OPERATOR;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
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

/**
 * Fetch wrapper that automatically appends active operator RBAC headers.
 */
export async function adminFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const operator = getActiveOperator();
  const headers = new Headers(init?.headers || {});

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
