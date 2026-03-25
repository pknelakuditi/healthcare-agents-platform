import { describe, expect, it } from 'vitest';
import {
  InMemoryRateLimitRepository,
  InMemoryReplayProtectionRepository,
} from '../packages/perimeter/src/index.js';

describe('InMemoryRateLimitRepository', () => {
  it('tracks requests within a fixed window', () => {
    const repository = new InMemoryRateLimitRepository();
    const first = repository.consume('client-1', 0, 60000, 2);
    const second = repository.consume('client-1', 1000, 60000, 2);
    const third = repository.consume('client-1', 2000, 60000, 2);

    expect(first.allowed).toBe(true);
    expect(second.allowed).toBe(true);
    expect(third.allowed).toBe(false);
    expect(third.retryAfterSeconds).toBeGreaterThan(0);
  });
});

describe('InMemoryReplayProtectionRepository', () => {
  it('rejects duplicate claims until the nonce expires', () => {
    const repository = new InMemoryReplayProtectionRepository();

    expect(repository.claim('client-1:nonce-1', 0, 60)).toBe(true);
    expect(repository.claim('client-1:nonce-1', 1000, 60)).toBe(false);
    expect(repository.claim('client-1:nonce-1', 61000, 60)).toBe(true);
  });
});
