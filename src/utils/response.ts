export interface Response {
  success: boolean;
  message: string;
}

/**
 * @description Factory class for creating standardized response objects
 */
export class ResponseFactory {
  static success(message: string): Response {
    return {
      success: true,
      message,
    };
  }

  static error(message: string = 'Something went wrong.'): Response {
    return {
      success: false,
      message,
    };
  }

  static fromError(error: Error): Response {
    return this.error(error.message || 'An unknown error occurred.');
  }
}
