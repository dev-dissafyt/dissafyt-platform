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
    brandName: 'Vibe Cult Johannesburg (Drip Income)',
  },
  {
    email: 'admin@dissafyt.com',
    role: 'admin',
    brandName: 'Platform Administrator (Full Access)',
  },
];

const STORAGE_KEY = 'dissafyt_studio_persona';

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

export function setActivePersona(persona: StudioPersona): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persona));
    // Set cookie so middleware can inspect it
    document.cookie = `dissafyt_studio_role=${persona.role}; path=/; max-age=2592000`;
    if (persona.brandId) {
      document.cookie = `dissafyt_studio_brand_id=${persona.brandId}; path=/; max-age=2592000`;
    } else {
      document.cookie = `dissafyt_studio_brand_id=; path=/; max-age=0`;
    }
    window.dispatchEvent(new CustomEvent('studio_persona_changed', { detail: persona }));
  } catch {
    // Ignore error
  }
}
