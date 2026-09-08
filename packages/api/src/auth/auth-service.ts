import { AppRole, getSupabaseBrowserClient, getSupabaseAdminClient } from '@dissafyt/database';

export interface AuthContext {
  userId: string;
  email?: string;
  roles: AppRole[];
}

export class AuthService {
  /**
   * Verifies an incoming access token via Supabase Auth and returns user identity + roles.
   */
  static async verifyToken(token: string): Promise<AuthContext | null> {
    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase.auth.getUser(token);

      if (error || !data.user) {
        return null;
      }

      const userId = data.user.id;
      const email = data.user.email;

      // In production/privileged backend, query user_roles table
      let roles: AppRole[] = ['customer'];
      try {
        const adminClient = getSupabaseAdminClient();
        const { data: roleRecords } = await adminClient
          .from('user_roles')
          .select('role')
          .eq('user_id', userId);

        if (roleRecords && roleRecords.length > 0) {
          roles = roleRecords.map((r: { role: string }) => r.role as AppRole);
        }
      } catch {
        // Fall back to default customer role if service role key is not yet configured
      }

      return {
        userId,
        email,
        roles,
      };
    } catch (err) {
      console.error('Auth verification error:', err);
      return null;
    }
  }

  /**
   * Checks if a given AuthContext includes the required role.
   */
  static hasRole(ctx: AuthContext, requiredRole: AppRole): boolean {
    return ctx.roles.includes(requiredRole) || ctx.roles.includes('admin');
  }

  /**
   * Checks if user is authorized to access a given user resource.
   */
  static canAccessUser(ctx: AuthContext, targetUserId: string): boolean {
    if (ctx.userId === targetUserId) return true;
    return ctx.roles.includes('admin');
  }
}
