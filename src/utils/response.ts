export interface Response<T = null> {
  error: boolean;
  message: string;
  data: T;
}

/**
 * Factory class for creating standardized response objects
 */
export class ResponseFactory {
  /**
   * Create a success response
   * @param message Success message
   * @param data Optional data payload
   * @returns Response object with error: false
   */
  static success<T = null>(message: string, data: T = null as T): Response<T> {
    return {
      error: false,
      message,
      data,
    };
  }

  /**
   * Create an error response
   * @param message Error message
   * @returns Response object with error: true and null data
   */
  static error<T = null>(
    message: string = 'Something went wrong.'
  ): Response<T> {
    return {
      error: true,
      message,
      data: null as T,
    };
  }

  /**
   * Create a response from an Error object
   * @param error Error object
   * @returns Response object with error: true and null data
   */
  static fromError<T = null>(error: Error): Response<T> {
    return this.error<T>(error.message);
  }
}
