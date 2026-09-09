export type StudioPersonaRole = 'admin' | 'staff' | 'creator';

export interface StudioPersona {
  email: string;
  role: StudioPersonaRole;
  brandId?: string;
  brandName?: string;
}

export const PRESET_PERSONAS: StudioPersona[] = [
  {
    email: 'operator@dissafyt.com',
    role: 'staff',
    brandName: 'Factory Floor (All Brands)',
  },
  {
    email: 'creator.skhanda@dissafyt.com',
    role: 'creator',
    brandId: 'b0000000-0000-0000-0000-000000000001',
    brandName: 'Skhanda Heritage Co. (Stacked Returns)',
  },
  {
    email: 'creator.vibecult@dissafyt.com',
    role: 'creator',
    brandId: 'b0000000-0000-0000-0000-000000000002',
    brandName: 'Vibe Cult Cape Town (Drip Income)',
  },
  {
    email: 'admin@dissafyt.com',
    role: 'admin',
    brandName: 'Platform Administrator (Full Access)',
  },
];

const STORAGE_KEY = 'dissafyt_studio_persona';
const AUTH_KEY = 'dissafyt_studio_auth';

export function isStudioAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const isAuth = localStorage.getItem(AUTH_KEY);
    if (isAuth === 'true') return true;
    return document.cookie.includes('dissafyt_studio_auth=true');
  } catch {
    return false;
  }
}

export function getActivePersona(): StudioPersona {
  if (typeof window === 'undefined') {
    return PRESET_PERSONAS[0];
  }

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {
    // Ignore error
  }

  return PRESET_PERSONAS[0];
}

export function loginStudioPersona(persona: StudioPersona): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(AUTH_KEY, 'true');
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persona));

    // Set persistent session cookies for Next.js middleware
    document.cookie = `dissafyt_studio_auth=true; path=/; max-age=2592000; SameSite=Lax`;
    document.cookie = `dissafyt_studio_role=${persona.role}; path=/; max-age=2592000; SameSite=Lax`;
    document.cookie = `dissafyt_studio_user_email=${encodeURIComponent(persona.email)}; path=/; max-age=2592000; SameSite=Lax`;
    
    if (persona.brandId) {
      document.cookie = `dissafyt_studio_brand_id=${persona.brandId}; path=/; max-age=2592000; SameSite=Lax`;
    } else {
      document.cookie = `dissafyt_studio_brand_id=; path=/; max-age=0; SameSite=Lax`;
    }

    window.dispatchEvent(new CustomEvent('studio_persona_changed', { detail: persona }));
  } catch {
    // Ignore error
  }
}

export function logoutStudioPersona(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(STORAGE_KEY);

    // Clear all studio auth cookies
    document.cookie = `dissafyt_studio_auth=; path=/; max-age=0; SameSite=Lax`;
    document.cookie = `dissafyt_studio_role=; path=/; max-age=0; SameSite=Lax`;
    document.cookie = `dissafyt_studio_brand_id=; path=/; max-age=0; SameSite=Lax`;
    document.cookie = `dissafyt_studio_user_email=; path=/; max-age=0; SameSite=Lax`;

    window.dispatchEvent(new CustomEvent('studio_persona_changed', { detail: null }));
  } catch {
    // Ignore error
  }
}

export function setActivePersona(persona: StudioPersona): void {
  loginStudioPersona(persona);
}
