export class PersistenceError extends Error {
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'PersistenceError';
    if (cause) {
      this.cause = cause;
    }
  }
}
