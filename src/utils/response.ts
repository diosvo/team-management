import type { enumUnion } from './enum';

export const Status = {
  OK: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  NOT_FOUND: 404,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
} as const;
export type HttpStatus = enumUnion<typeof Status>;

export const ERROR_TYPE_BY_STATUS: Record<number, string> = {
  [Status.UNAUTHORIZED]: 'unauthorized',
  [Status.TOO_MANY_REQUESTS]: 'rate_limit',
};

export interface Response<T = undefined> {
  success: boolean;
  message: string;
  data?: T;
}

/** Factory class for creating standardized response objects */
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
