import { randomUUID } from 'node:crypto';

export interface AuditEvent<TPayload extends Record<string, unknown> = Record<string, unknown>> {
  eventId: string;
  eventType: string;
  occurredAt: string;
  actorId: string;
  requestId: string;
  payload: TPayload;
}

export function createAuditEvent<TPayload extends Record<string, unknown>>(
  input: Omit<AuditEvent<TPayload>, 'eventId' | 'occurredAt'>
): AuditEvent<TPayload> {
  return {
    eventId: randomUUID(),
    occurredAt: new Date().toISOString(),
    ...input,
  };
}
