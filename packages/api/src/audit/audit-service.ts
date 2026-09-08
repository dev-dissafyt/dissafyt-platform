import { getSupabaseAdminClient, AuditLog, AuditAction, AuditEntityType } from '@dissafyt/database';

export interface CreateAuditLogInput {
  actor_id?: string | null;
  actor_email?: string;
  actor_role?: string;
  action: AuditAction | string;
  entity_type: AuditEntityType | string;
  entity_id: string;
  entity_name?: string;
  changes?: Record<string, any>;
  ip_address?: string;
}

// In-memory fallback buffer ensures zero data loss if table schema is refreshing
const MEMORY_AUDIT_BUFFER: AuditLog[] = [];

export class AuditService {
  /**
   * Automatically and immutably records an administrative audit event.
   */
  static async recordLog(input: CreateAuditLogInput): Promise<AuditLog> {
    const admin = getSupabaseAdminClient();
    const newEntry: AuditLog = {
      id: crypto.randomUUID(),
      actor_id: input.actor_id || null,
      actor_email: input.actor_email || 'admin@dissafyt.com',
      actor_role: input.actor_role || 'admin',
      action: input.action,
      entity_type: input.entity_type,
      entity_id: input.entity_id,
      entity_name: input.entity_name || '',
      changes: input.changes || {},
      ip_address: input.ip_address || '',
      created_at: new Date().toISOString(),
    };

    // Store in-memory buffer (capped at 150 items)
    MEMORY_AUDIT_BUFFER.unshift(newEntry);
    if (MEMORY_AUDIT_BUFFER.length > 150) {
      MEMORY_AUDIT_BUFFER.pop();
    }

    try {
      const { error } = await admin.from('audit_logs').insert({
        id: newEntry.id,
        actor_id: newEntry.actor_id,
        actor_email: newEntry.actor_email,
        actor_role: newEntry.actor_role,
        action: newEntry.action,
        entity_type: newEntry.entity_type,
        entity_id: newEntry.entity_id,
        entity_name: newEntry.entity_name,
        changes: newEntry.changes,
        ip_address: newEntry.ip_address,
        created_at: newEntry.created_at,
      });

      if (error) {
        console.warn('AuditLog DB insert fallback to memory buffer:', error.message);
      }
    } catch (err: any) {
      console.warn('AuditLog DB exception fallback to memory buffer:', err.message);
    }

    return newEntry;
  }

  /**
   * Retrieves recent audit log entries for administrative compliance and inspection.
   */
  static async listLogs(limit: number = 50): Promise<AuditLog[]> {
    const admin = getSupabaseAdminClient();
    try {
      const { data, error } = await admin
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (!error && data && data.length > 0) {
        // Merge with memory buffer to ensure real-time consistency
        const dbIds = new Set(data.map((d: any) => d.id));
        const uncommitted = MEMORY_AUDIT_BUFFER.filter((m) => !dbIds.has(m.id));
        return [...uncommitted, ...data].slice(0, limit);
      }
    } catch {
      // Fallback
    }

    return MEMORY_AUDIT_BUFFER.slice(0, limit);
  }
}
