import type { RuntimeConfig } from '../../config/src/index.js';
import { FileAuditStore } from '../../data/audit/src/index.js';
import { FileReviewStore } from '../../review/src/index.js';
import type { AuditRepository } from '../../data/audit/src/repository.js';
import type { ReviewRepository } from '../../review/src/repository.js';

export interface PersistenceRepositories {
  provider: 'file';
  auditRepository: AuditRepository;
  reviewRepository: ReviewRepository;
}

export function createPersistenceRepositories(config: RuntimeConfig): PersistenceRepositories {
  return {
    provider: 'file',
    auditRepository: new FileAuditStore(config.persistenceDir),
    reviewRepository: new FileReviewStore(config.persistenceDir),
  };
}
