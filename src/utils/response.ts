export interface Response {
  error: boolean;
  message: string;
}

/**
 * Factory class for creating standardized response objects
 */
export class ResponseFactory {
  /**
   * Create a success response
   * @param message Success message
   * @returns Response object with error: false
   */
  static success(message: string): Response {
    return {
      error: false,
      message,
    };
  }

  /**
   * Create an error response
   * @param message Error message
   * @returns Response object with error: true
   */
  static error(message: string = 'Something went wrong.'): Response {
    return {
      error: true,
      message,
    };
  }

  /**
   * Create a response from an Error object
   * @param error Error object
   * @returns Response object with error: true and message from error
   */
  static fromError(error: Error): Response {
    return this.error(error.message);
  }
}
