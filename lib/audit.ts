import { v4 as uuidv4 } from 'uuid'
import { containers } from './cosmos'
import type { AuditLog } from './types'

export async function appendAuditLog(params: {
  action: string
  performed_by: string
  performed_by_name: string
  target_id: string
  target_type: string
  diff?: Record<string, unknown> | null
}): Promise<void> {
  const now = new Date()
  const log: AuditLog = {
    id: uuidv4(),
    log_id: uuidv4(),
    action: params.action,
    performed_by: params.performed_by,
    performed_by_name: params.performed_by_name,
    target_id: params.target_id,
    target_type: params.target_type,
    diff: params.diff ?? null,
    timestamp: now.toISOString(),
    action_date_month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
  }
  try {
    await containers.audit().items.create(log)
  } catch {
    // Audit failures must not break primary operations
    console.error('Failed to write audit log:', params.action)
  }
}
