import type { RuntimeConfig } from '../../config/src/index.js';

export class ReviewerAuthorizationError extends Error {
  constructor(reviewerId: string) {
    super(`Reviewer ${reviewerId} is not authorized to approve or reject requests.`);
    this.name = 'ReviewerAuthorizationError';
  }
}

export function assertReviewerAuthorized(reviewerId: string, config: RuntimeConfig): void {
  if (!config.authorizedReviewerIds.includes(reviewerId)) {
    throw new ReviewerAuthorizationError(reviewerId);
  }
}
