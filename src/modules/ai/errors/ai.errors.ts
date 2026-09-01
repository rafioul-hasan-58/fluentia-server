/**
 * Thrown when the AI response fails schema validation even after a retry.
 */
export class AiValidationError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'AiValidationError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Thrown when an underlying OpenAI API or network error occurs.
 */
export class AiServiceError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'AiServiceError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
