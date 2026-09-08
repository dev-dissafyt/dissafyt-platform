import { getSupabaseAdminClient, Profile, UserWithProfile } from '@dissafyt/database';
import { UpdateProfileInput, updateProfileSchema } from '../validators/user-schema';
import { AuthService, AuthContext } from '../auth/auth-service';

export class UserService {
  /**
   * Retrieves full profile information along with assigned roles.
   */
  static async getUserProfile(userId: string): Promise<UserWithProfile | null> {
    try {
      const adminClient = getSupabaseAdminClient();

      const { data: profile, error } = await adminClient
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !profile) {
        return null;
      }

      const { data: roleRecords } = await adminClient
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      const roles = (roleRecords?.map((r: { role: string }) => r.role) || ['customer']) as UserWithProfile['roles'];

      return {
        ...profile,
        roles,
      };
    } catch (err) {
      console.error('Failed to get user profile:', err);
      return null;
    }
  }

  /**
   * Updates an existing user profile after validating input and checking authorization.
   */
  static async updateProfile(
    ctx: AuthContext,
    targetUserId: string,
    rawInput: UpdateProfileInput
  ): Promise<{ success: boolean; profile?: Profile; error?: string }> {
    if (!AuthService.canAccessUser(ctx, targetUserId)) {
      return { success: false, error: 'Forbidden: unauthorized access to user profile' };
    }

    const parseResult = updateProfileSchema.safeParse(rawInput);
    if (!parseResult.success) {
      return { success: false, error: parseResult.error.errors[0]?.message || 'Invalid input' };
    }

    try {
      const adminClient = getSupabaseAdminClient();
      const { data, error } = await adminClient
        .from('profiles')
        .update({
          ...parseResult.data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', targetUserId)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, profile: data as Profile };
    } catch (err) {
      console.error('Failed to update profile:', err);
      return { success: false, error: 'Internal server error while updating profile' };
    }
  }
}
