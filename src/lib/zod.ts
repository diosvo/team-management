import { z } from 'zod';

export function getDefaults<T extends z.ZodRawShape>(
  schema: z.ZodObject<T>,
  item?: Partial<z.infer<z.ZodObject<T>>>
) {
  const defaults = Object.fromEntries(
    Object.entries(schema.shape).map(([key, value]) => [
      key,
      value instanceof z.ZodDefault
        ? (value._zod.def.defaultValue as z.infer<z.ZodObject<T>>)
        : undefined,
    ])
  );

  return { ...defaults, ...item } as z.infer<z.ZodObject<T>>;
}
