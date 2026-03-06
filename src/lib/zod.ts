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
