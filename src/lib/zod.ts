import type { FieldErrors } from 'react-hook-form';
import { z } from 'zod';

type ZodItem<T extends z.ZodRawShape> = z.infer<z.ZodObject<T>>;

export function getDefaults<T extends z.ZodRawShape>(
  schema: z.ZodObject<T>,
  item?: Partial<ZodItem<T>>,
) {
  const defaults = Object.fromEntries(
    Object.entries(schema.shape).map(([key, value]) => [
      key,
      value instanceof z.ZodDefault
        ? (value._zod.def.defaultValue as ZodItem<T>)
        : undefined,
    ]),
  );

  return { ...defaults, ...item } as ZodItem<T>;
}

/** The `.max()` of a string field, seen through `.nullable()`, `.optional()` and `.default()`. */
export function getMaxLength(schema: z.ZodType): number | undefined {
  let inner: unknown = schema;
  while (
    inner instanceof z.ZodNullable ||
    inner instanceof z.ZodOptional ||
    inner instanceof z.ZodDefault
  ) {
    inner = inner.unwrap();
  }

  if (!(inner instanceof z.ZodString)) return undefined;

  return inner.maxLength ?? undefined;
}

export function onError(errors: FieldErrors) {
  if (process.env.NODE_ENV === 'development') {
    console.error('[zod validation]:', errors);
  }
}
