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

    test('attaches the provided data payload', () => {
      const data = { image: 'users/1/avatar.png' };

      const result = ResponseFactory.success('Uploaded', data);

      expect(result).toEqual({
        success: true,
        message: 'Uploaded',
        data,
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
});
