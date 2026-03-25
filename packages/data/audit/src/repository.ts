import type { AuditEvent } from './events.js';

export interface AuditRepository {
  append<TPayload extends Record<string, unknown>>(event: AuditEvent<TPayload>): AuditEvent<TPayload>;
  list(): AuditEvent[];
}
