import { AppRole } from '@dissafyt/database';

export type Permission =
  | 'product:create'
  | 'product:edit'
  | 'product:delete'
  | 'service:create'
  | 'service:edit'
  | 'service:delete'
  | 'staff:create'
  | 'staff:edit'
  | 'staff:delete'
  | 'location:create'
  | 'location:edit'
  | 'location:delete'
  | 'user:view'
  | 'user:manage_roles'
  | 'audit:view'
  | 'order:view'
  | 'order:edit'
  | 'booking:view'
  | 'booking:edit'
  | 'reporting:view'
  | 'payment:view'
  | 'factory:view_queue'
  | 'factory:update_job'
  | 'factory:dispatch'
  | 'brand:manage_own'
  | 'design:upload'
  | 'product:create_custom'
  | 'product:edit_own'
  | 'job:view_own'
  | 'earnings:view_own';

/**
  * Granular RBAC Role Permission Matrix.
  * - admin: Complete platform governance.
  * - staff: Operational management & factory production desk.
  * - barber: Service provider (schedule & personal bio).
  * - creator: Local brand owner / designer (catalog & earnings).
  * - customer: Storefront access only.
  */
export const ROLE_PERMISSIONS: Record<AppRole, Permission[]> = {
  admin: [
    'product:create',
    'product:edit',
    'product:delete',
    'service:create',
    'service:edit',
    'service:delete',
    'staff:create',
    'staff:edit',
    'staff:delete',
    'location:create',
    'location:edit',
    'location:delete',
    'user:view',
    'user:manage_roles',
    'audit:view',
    'order:view',
    'order:edit',
    'booking:view',
    'booking:edit',
    'reporting:view',
    'payment:view',
    'factory:view_queue',
    'factory:update_job',
    'factory:dispatch',
    'brand:manage_own',
    'design:upload',
    'product:create_custom',
    'product:edit_own',
    'job:view_own',
    'earnings:view_own',
  ],
  staff: [
    'product:edit',
    'service:edit',
    'staff:edit',
    'user:view',
    'order:view',
    'order:edit',
    'booking:view',
    'booking:edit',
    'reporting:view',
    'payment:view',
    'factory:view_queue',
    'factory:update_job',
    'factory:dispatch',
  ],
  barber: [
    'staff:edit', // restricted to own profile in application logic
  ],
  creator: [
    'brand:manage_own',
    'design:upload',
    'product:create_custom',
    'product:edit_own',
    'job:view_own',
    'earnings:view_own',
  ],
  customer: [],
};

export class RBACService {
  /**
   * Evaluates whether a role or set of roles has a specific permission.
   */
  static hasPermission(
    roleOrRoles: AppRole | AppRole[] | string | string[] | undefined | null,
    permission: Permission
  ): boolean {
    if (!roleOrRoles) return false;

    const roles: string[] = Array.isArray(roleOrRoles) ? roleOrRoles : [roleOrRoles];

    // Admin always has full bypass authority
    if (roles.includes('admin')) return true;

    for (const r of roles) {
      const perms = ROLE_PERMISSIONS[r as AppRole] || [];
      if (perms.includes(permission)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Returns all granted permissions for a given role.
   */
  static getPermissions(role: AppRole): Permission[] {
    return ROLE_PERMISSIONS[role] || [];
  }
}
