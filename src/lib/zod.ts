import { z } from 'zod';

export function getDefaults<T extends z.ZodRawShape>(schema: z.ZodObject<T>) {
  return Object.fromEntries(
    Object.entries(schema.shape).map(([key, value]) => {
      if (value instanceof z.ZodDefault)
        return [key, value._zod.def.defaultValue];
      return [key, undefined];
    })
  );
}
