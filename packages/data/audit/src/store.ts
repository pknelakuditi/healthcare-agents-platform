import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import type { AuditEvent } from './events.js';
import { PersistenceError } from '../../../persistence/src/index.js';
import type { AuditRepository } from './repository.js';

function ensureJsonFile(filePath: string): void {
  mkdirSync(path.dirname(filePath), { recursive: true });
  if (!existsSync(filePath)) {
    writeFileSync(filePath, '[]\n', 'utf-8');
  }
}

function readJsonArray<T>(filePath: string): T[] {
  ensureJsonFile(filePath);
  return JSON.parse(readFileSync(filePath, 'utf-8')) as T[];
}

function writeJsonArray<T>(filePath: string, value: T[]): void {
  ensureJsonFile(filePath);
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf-8');
}

export class FileAuditStore implements AuditRepository {
  private readonly filePath: string;

  constructor(baseDir: string) {
    this.filePath = path.join(baseDir, 'audit-events.json');
  }

  append<TPayload extends Record<string, unknown>>(event: AuditEvent<TPayload>): AuditEvent<TPayload> {
    try {
      const events = readJsonArray<AuditEvent>(this.filePath);
      events.push(event);
      writeJsonArray(this.filePath, events);
      return event;
    } catch (error) {
      throw new PersistenceError('Failed to append audit event.', error);
    }
  }

  list(): AuditEvent[] {
    try {
      return readJsonArray<AuditEvent>(this.filePath);
    } catch (error) {
      throw new PersistenceError('Failed to load audit events.', error);
    }
  }
}
