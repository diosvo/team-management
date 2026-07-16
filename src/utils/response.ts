export interface Response<T = undefined> {
  success: boolean;
  message: string;
  data?: T;
}

/**
 * @description Factory class for creating standardized response objects
 */
export class ResponseFactory {
  static success<T = undefined>(message: string, data?: T): Response<T> {
    return {
      success: true,
      message,
      data,
    };
  }

  static error(message: string = 'Something went wrong.'): Response {
    return {
      success: false,
      message,
    };
  }
}
