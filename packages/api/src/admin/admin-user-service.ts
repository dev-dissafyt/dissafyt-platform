import { getSupabaseAdminClient, AppRole, UserWithProfile } from '@dissafyt/database';

export class AdminUserService {
  /**
   * Lists all users with profiles and assigned roles.
   */
  static async listUsers(): Promise<UserWithProfile[]> {
    const admin = getSupabaseAdminClient();
    const { data: profiles, error: pError } = await admin
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (pError || !profiles) {
      console.error('Failed to list profiles:', pError);
      return [];
    }

    const { data: userRoles } = await admin.from('user_roles').select('*');

    return profiles.map((p: any) => {
      const roles = (userRoles || [])
        .filter((ur: any) => ur.user_id === p.id)
        .map((ur: any) => ur.role as AppRole);

      return {
        ...p,
        roles: roles.length > 0 ? roles : ['customer'],
      };
    });
  }

  /**
   * Assigns a role to a specific user.
   */
  static async assignRole(userId: string, role: AppRole): Promise<{ success: boolean; error?: string }> {
    const admin = getSupabaseAdminClient();
    try {
      const { error } = await admin.from('user_roles').upsert({ user_id: userId, role }, { onConflict: 'user_id, role' });
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Revokes a role from a user.
   */
  static async revokeRole(userId: string, role: AppRole): Promise<{ success: boolean; error?: string }> {
    const admin = getSupabaseAdminClient();
    try {
      const { error } = await admin.from('user_roles').delete().match({ user_id: userId, role });
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Bootstrap tool: Promotes the user with matching email to admin.
   */
  static async bootstrapAdmin(email: string): Promise<{ success: boolean; error?: string; message?: string }> {
    const admin = getSupabaseAdminClient();
    const { data: profile, error } = await admin
      .from('profiles')
      .select('id, email, full_name')
      .ilike('email', email.trim())
      .single();

    if (error || !profile) {
      return { success: false, error: `No registered user found with email: ${email}` };
    }

    const res = await this.assignRole(profile.id, 'admin');
    if (!res.success) return res;

    return {
      success: true,
      message: `User ${profile.email} (${profile.id}) has been granted the 'admin' role.`,
    };
  }
}
