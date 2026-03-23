vi.unmock('@/db/pg-error');
vi.unmock('drizzle-orm');

import { DrizzleError, DrizzleQueryError } from 'drizzle-orm';
import { DatabaseError } from 'pg';

import { PgErrorCode, getDbErrorMessage } from './pg-error';

type Options = Partial<{
  constraint: string;
  column: string;
  message: string;
}>;

const createDatabaseError = (
  code: string | undefined,
  options: Options = {},
): DatabaseError => {
  const err = new DatabaseError(
    options.message ?? 'Database error',
    100,
    'error',
  );
  err.code = code;
  if (options.constraint !== undefined) err.constraint = options.constraint;
  if (options.column !== undefined) err.column = options.column;
  return err;
};

const createQueryError = (
  code: string | undefined,
  options: Options = {},
): DrizzleQueryError =>
  new DrizzleQueryError('SELECT 1', [], createDatabaseError(code, options));

describe('PgErrorCode', () => {
  test.each([
    // Integrity constraint violations — drive the PostgresErrorHandlers map
    ['UNIQUE_VIOLATION', PgErrorCode.UNIQUE_VIOLATION, '23505'],
    ['FOREIGN_KEY_VIOLATION', PgErrorCode.FOREIGN_KEY_VIOLATION, '23503'],
    ['CHECK_VIOLATION', PgErrorCode.CHECK_VIOLATION, '23514'],
    ['NOT_NULL_VIOLATION', PgErrorCode.NOT_NULL_VIOLATION, '23502'],
    // Schema/syntax errors
    ['UNDEFINED_COLUMN', PgErrorCode.UNDEFINED_COLUMN, '42703'],
    ['UNDEFINED_TABLE', PgErrorCode.UNDEFINED_TABLE, '42P01'],
    ['SYNTAX_ERROR', PgErrorCode.SYNTAX_ERROR, '42601'],
    // Transaction & connection errors
    [
      'INVALID_TRANSACTION_STATE',
      PgErrorCode.INVALID_TRANSACTION_STATE,
      '25000',
    ],
    ['SERIALIZATION_FAILURE', PgErrorCode.SERIALIZATION_FAILURE, '40001'],
    ['CONNECTION_FAILURE', PgErrorCode.CONNECTION_FAILURE, '08006'],
    // A few others for breadth
    ['SUCCESSFUL_COMPLETION', PgErrorCode.SUCCESSFUL_COMPLETION, '00000'],
    ['DEADLOCK_DETECTED', PgErrorCode.DEADLOCK_DETECTED, '40P01'],
    ['OUT_OF_MEMORY', PgErrorCode.OUT_OF_MEMORY, '53200'],
  ])('%s → %s', (_name, actual, expected) => {
    expect(actual).toBe(expected);
  });
});

describe('getDbErrorMessage', () => {
  describe('DrizzleQueryError with a DatabaseError cause', () => {
    describe('UNIQUE_VIOLATION (23505)', () => {
      const message = 'A duplicate entry was found for a unique field.';

      test('returns the constraint name when set', () => {
        expect(
          getDbErrorMessage(
            createQueryError(PgErrorCode.UNIQUE_VIOLATION, {
              constraint: 'users_email_unique',
            }),
          ),
        ).toEqual({ message, constraint: 'users_email_unique' });
      });

      test('returns null constraint when not set', () => {
        expect(
          getDbErrorMessage(createQueryError(PgErrorCode.UNIQUE_VIOLATION)),
        ).toEqual({
          message,
          constraint: null,
        });
      });
    });

    describe('FOREIGN_KEY_VIOLATION (23503)', () => {
      const message =
        'A foreign key violation occurred. The record you are trying to link does not exist.';

      test('returns the constraint name when set', () => {
        expect(
          getDbErrorMessage(
            createQueryError(PgErrorCode.FOREIGN_KEY_VIOLATION, {
              constraint: 'orders_user_id_fkey',
            }),
          ),
        ).toEqual({ message, constraint: 'orders_user_id_fkey' });
      });

      test('returns null constraint when not set', () => {
        expect(
          getDbErrorMessage(
            createQueryError(PgErrorCode.FOREIGN_KEY_VIOLATION),
          ),
        ).toEqual({
          message,
          constraint: null,
        });
      });
    });

    describe('CHECK_VIOLATION (23514)', () => {
      const message = 'A check constraint was violated.';

      test('returns the constraint name when set', () => {
        expect(
          getDbErrorMessage(
            createQueryError(PgErrorCode.CHECK_VIOLATION, {
              constraint: 'age_positive',
            }),
          ),
        ).toEqual({ message, constraint: 'age_positive' });
      });

      test('returns null constraint when not set', () => {
        expect(
          getDbErrorMessage(createQueryError(PgErrorCode.CHECK_VIOLATION)),
        ).toEqual({
          message,
          constraint: null,
        });
      });
    });

    describe('NOT_NULL_VIOLATION (23502)', () => {
      test('returns the column name as both message interpolation and constraint when set', () => {
        expect(
          getDbErrorMessage(
            createQueryError(PgErrorCode.NOT_NULL_VIOLATION, {
              column: 'email',
            }),
          ),
        ).toEqual({
          message:
            "A required field is missing. The column 'email' cannot be null.",
          constraint: 'email',
        });
      });

      test('returns null constraint when column is not set', () => {
        expect(
          getDbErrorMessage(createQueryError(PgErrorCode.NOT_NULL_VIOLATION)),
        ).toEqual({
          message:
            "A required field is missing. The column 'undefined' cannot be null.",
          constraint: null,
        });
      });
    });

    describe('UNDEFINED_COLUMN (42703)', () => {
      test('returns the column name as constraint when set', () => {
        expect(
          getDbErrorMessage(
            createQueryError(PgErrorCode.UNDEFINED_COLUMN, {
              column: 'invalid_col',
            }),
          ),
        ).toEqual({
          message: 'An undefined column was referenced in the query.',
          constraint: 'invalid_col',
        });
      });

      test('returns null constraint when column is not set', () => {
        expect(
          getDbErrorMessage(createQueryError(PgErrorCode.UNDEFINED_COLUMN)),
        ).toEqual({
          message: 'An undefined column was referenced in the query.',
          constraint: null,
        });
      });
    });

    test.each([
      [
        PgErrorCode.SYNTAX_ERROR,
        "There's a syntax error in the database query.",
      ],
      [
        PgErrorCode.INVALID_TRANSACTION_STATE,
        'Transaction failed: a data integrity issue occurred within a database transaction.',
      ],
      [
        PgErrorCode.CONNECTION_FAILURE,
        'Database connection failed. The database may be unavailable.',
      ],
      [
        PgErrorCode.UNDEFINED_TABLE,
        'A referenced table does not exist in the database.',
      ],
      [
        PgErrorCode.SERIALIZATION_FAILURE,
        'Transaction serialization failure. Please retry the transaction as it could not be completed due to concurrent modifications.',
      ],
    ])(
      'code %s → correct static message (null constraint)',
      (code, message) => {
        expect(getDbErrorMessage(createQueryError(code))).toEqual({
          message,
          constraint: null,
        });
      },
    );

    test('uses the `default` handler when the error code is undefined', () => {
      expect(
        getDbErrorMessage(
          createQueryError(undefined, { message: 'unknown db error' }),
        ),
      ).toEqual({
        message: 'A database error occurred: unknown db error',
        constraint: null,
      });
    });

    test('falls back to an inline message for unhandled postgres error codes', () => {
      // INTEGRITY_CONSTRAINT_VIOLATION (23000) has no specific handler
      expect(
        getDbErrorMessage(
          createQueryError(PgErrorCode.INTEGRITY_CONSTRAINT_VIOLATION, {
            message: 'integrity constraint failed',
          }),
        ),
      ).toEqual({
        message: 'A database error occurred: integrity constraint failed',
        constraint: null,
      });
    });
  });

  describe('DrizzleError (non-query)', () => {
    test('returns the error message', () => {
      expect(
        getDbErrorMessage(
          new DrizzleError({ message: 'drizzle configuration error' }),
        ),
      ).toEqual({ message: 'drizzle configuration error', constraint: null });
    });

    test('returns a fallback message when the error message is empty', () => {
      expect(getDbErrorMessage(new DrizzleError({ message: '' }))).toEqual({
        message: 'An unexpected error occurred.',
        constraint: null,
      });
    });
  });

  describe('generic Error', () => {
    test('returns the error message', () => {
      expect(getDbErrorMessage(new Error('something went wrong'))).toEqual({
        message: 'something went wrong',
        constraint: null,
      });
    });

    test('returns a fallback message when the error message is empty', () => {
      expect(getDbErrorMessage(new Error(''))).toEqual({
        message: 'An unexpected error occurred.',
        constraint: null,
      });
    });
  });

  describe('unknown error type', () => {
    test.each([null, undefined, 42, 'string error', { code: 500 }])(
      'returns unknown error message for: %s',
      (error) => {
        expect(getDbErrorMessage(error)).toEqual({
          message: 'An unknown error occurred.',
          constraint: null,
        });
      },
    );
  });
});
