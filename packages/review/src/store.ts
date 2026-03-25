import { randomUUID } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import type { AgentTask, ReviewDecisionRecord, ReviewRequest } from '../../agents/shared/src/index.js';

function ensureJsonFile(filePath: string): void {
  mkdirSync(path.dirname(filePath), { recursive: true });
  if (!existsSync(filePath)) {
    writeFileSync(filePath, '[]\n', 'utf-8');
  }
}

function readReviews(filePath: string): ReviewRequest[] {
  ensureJsonFile(filePath);
  return JSON.parse(readFileSync(filePath, 'utf-8')) as ReviewRequest[];
}

function writeReviews(filePath: string, reviews: ReviewRequest[]): void {
  ensureJsonFile(filePath);
  writeFileSync(filePath, `${JSON.stringify(reviews, null, 2)}\n`, 'utf-8');
}

export class FileReviewStore {
  private readonly filePath: string;

  constructor(baseDir: string) {
    this.filePath = path.join(baseDir, 'review-requests.json');
  }

  create(task: AgentTask, workflowId: string, reason: string): ReviewRequest {
    const reviews = readReviews(this.filePath);
    const review: ReviewRequest = {
      reviewId: randomUUID(),
      requestId: task.requestId,
      task,
      workflowId,
      submittedAt: new Date().toISOString(),
      status: 'pending',
      reason,
    };
    reviews.push(review);
    writeReviews(this.filePath, reviews);
    return review;
  }

  list(): ReviewRequest[] {
    return readReviews(this.filePath);
  }

  get(reviewId: string): ReviewRequest | undefined {
    return this.list().find((review) => review.reviewId === reviewId);
  }

  decide(reviewId: string, status: 'approved' | 'rejected', decision: ReviewDecisionRecord): ReviewRequest {
    const reviews = readReviews(this.filePath);
    const index = reviews.findIndex((review) => review.reviewId === reviewId);
    if (index === -1) {
      throw new Error(`Unknown review request: ${reviewId}`);
    }
    const current = reviews[index];
    if (!current) {
      throw new Error(`Review request ${reviewId} could not be loaded.`);
    }
    if (current.status !== 'pending') {
      throw new Error(`Review request ${reviewId} has already been ${current.status}.`);
    }
    const updated: ReviewRequest = {
      ...current,
      status,
      reviewDecision: decision,
    };
    reviews[index] = updated;
    writeReviews(this.filePath, reviews);
    return updated;
  }
}
