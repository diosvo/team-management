export interface Response {
  success: boolean;
  message: string;
  error?: string;
  errors?: Record<string, Array<string>>;
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
      errors: undefined,
    };
  }

  static errors(message: string, errors: Response['errors']): Response {
    return {
      success: false,
      message,
      errors,
    };
  }

  static fromError(error: Error): Response {
    return this.error(error.message || 'An unknown error occurred.');
  }
}
