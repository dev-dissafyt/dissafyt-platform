import { getSupabaseAdminClient, AppRole, UserWithProfile, UserBranchRole } from '@dissafyt/database';
import { AuditService } from '../audit/audit-service';

export class AdminUserService {
  /**
   * Lists all users with profiles and assigned roles, optionally filtered by branch location.
   */
  static async listUsers(locationId?: string): Promise<UserWithProfile[]> {
    const admin = getSupabaseAdminClient();
    const { data: profiles, error: pError } = await admin
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (pError || !profiles) {
      console.error('Failed to list profiles:', pError);
      return [];
    }

    const [userRolesRes, staffRes, locationsRes] = await Promise.all([
      admin.from('user_roles').select('*'),
      admin.from('staff').select('user_id, location_id, display_name'),
      admin.from('locations').select('id, name'),
    ]);

    const userRoles = userRolesRes.data || [];
    const staffList = staffRes.data || [];
    const locations = locationsRes.data || [];

    const locMap = new Map<string, string>();
    for (const l of locations) {
      locMap.set(l.id, l.name);
    }

    const mapped = profiles.map((p: any) => {
      const uRoles = userRoles.filter((ur: any) => ur.user_id === p.id);
      const staffRecord = staffList.find((s: any) => s.user_id === p.id);

      const branchRoles = uRoles.map((ur: any) => ({
        role: ur.role as AppRole,
        location_id: ur.location_id || staffRecord?.location_id || null,
        location_name:
          (ur.location_id && locMap.get(ur.location_id)) ||
          (staffRecord?.location_id && locMap.get(staffRecord.location_id)) ||
          null,
      }));

      const roles = Array.from(new Set(uRoles.map((ur: any) => ur.role as AppRole)));
      const assignedLocId = staffRecord?.location_id || uRoles.find((ur: any) => ur.location_id)?.location_id || null;

      return {
        ...p,
        roles: roles.length > 0 ? roles : ['customer'],
        branch_roles: branchRoles,
        assigned_location_id: assignedLocId,
        assigned_location_name: assignedLocId ? locMap.get(assignedLocId) || null : null,
      };
    });

    if (locationId) {
      return mapped.filter(
        (u) =>
          u.assigned_location_id === locationId ||
          (u.branch_roles || []).some((br: UserBranchRole) => br.location_id === locationId) ||
          u.roles.includes('admin')
      );
    }

    return mapped;
  }

  /**
   * Assigns a role to a specific user with branch affiliation and invisible audit logging.
   */
  static async assignRole(
    userId: string,
    role: AppRole,
    actor?: { email?: string; role?: string },
    locationId?: string | null
  ): Promise<{ success: boolean; error?: string }> {
    const admin = getSupabaseAdminClient();
    try {
      const payload: Record<string, any> = { user_id: userId, role };
      if (locationId) {
        payload.location_id = locationId;
      }

      const { error } = await admin
        .from('user_roles')
        .upsert(payload, { onConflict: 'user_id, role, location_id' });

      if (error) return { success: false, error: error.message };

      // If assigning a branch operational role, link to staff table as well
      if (locationId && (role === 'barbershop_manager' || role === 'barber' || role === 'staff')) {
        const { data: profile } = await admin
          .from('profiles')
          .select('full_name, phone')
          .eq('id', userId)
          .maybeSingle();

        const { data: existingStaff } = await admin
          .from('staff')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle();

        if (existingStaff) {
          await admin
            .from('staff')
            .update({ location_id: locationId, is_active: true })
            .eq('id', existingStaff.id);
        } else {
          await admin.from('staff').insert({
            user_id: userId,
            location_id: locationId,
            display_name: profile?.full_name || 'Staff Member',
            phone: profile?.phone || null,
            is_active: true,
          });
        }
      }

      // Invisible Audit Trail
      await AuditService.recordLog({
        actor_email: actor?.email || 'admin@dissafyt.com',
        actor_role: actor?.role || 'admin',
        action: 'role.assign',
        entity_type: 'user_role',
        entity_id: userId,
        entity_name: `Role: ${role}${locationId ? ` @ ${locationId}` : ''}`,
        changes: { user_id: userId, assigned_role: role, location_id: locationId },
      });

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Revokes a role from a user with invisible audit logging.
   */
  static async revokeRole(
    userId: string,
    role: AppRole,
    actor?: { email?: string; role?: string },
    locationId?: string | null
  ): Promise<{ success: boolean; error?: string }> {
    const admin = getSupabaseAdminClient();
    try {
      let query = admin.from('user_roles').delete().match({ user_id: userId, role });
      if (locationId) {
        query = query.match({ location_id: locationId });
      }

      const { error } = await query;
      if (error) return { success: false, error: error.message };

      // Invisible Audit Trail
      await AuditService.recordLog({
        actor_email: actor?.email || 'admin@dissafyt.com',
        actor_role: actor?.role || 'admin',
        action: 'role.revoke',
        entity_type: 'user_role',
        entity_id: userId,
        entity_name: `Role: ${role}${locationId ? ` @ ${locationId}` : ''}`,
        changes: { user_id: userId, revoked_role: role, location_id: locationId },
      });

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
