import { ResponseFactory } from './response';

describe('ResponseFactory', () => {
  describe('success', () => {
    const cases = [
      {
        with: 'provided message',
        message: 'Operation completed successfully',
      },
      {
        with: 'empty message',
        message: '',
      },
    ];

    test.each(cases)('returns success response with $with', ({ message }) => {
      const result = ResponseFactory.success(message);

      expect(result).toEqual({
        success: true,
        message,
      });
    });
  });

  describe('error', () => {
    const cases = [
      {
        with: 'provided message',
        input: 'Operation failed',
        expected: 'Operation failed',
      },
      {
        with: 'empty message',
        input: undefined,
        expected: 'Something went wrong.',
      },
    ];

    test.each(cases)(
      'returns error response with $with',
      ({ input, expected }) => {
        const result = ResponseFactory.error(input);

        expect(result).toEqual({
          success: false,
          message: expected,
        });
      },
    );
  });

  describe('fromError', () => {
    const cases = [
      {
        with: 'provided message',
        error: new Error('Custom error message'),
        expected: 'Custom error message',
      },
      {
        with: 'default message',
        error: new Error(''),
        expected: 'An unknown error occurred.',
      },
    ];

    test.each(cases)(
      'returns error response from Error object with $with',
      ({ error, expected }) => {
        const result = ResponseFactory.fromError(error);

        expect(result).toEqual({
          success: false,
          message: expected,
        });
      },
    );
  });
});
