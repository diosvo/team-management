import { z } from 'zod';

export function getDefaults<T extends z.ZodRawShape>(
  schema: z.ZodObject<T>,
  item?: Partial<z.infer<z.ZodObject<T>>>
) {
  // Get default values from the schema
  const defaults = Object.fromEntries(
    Object.entries(schema.shape).map(([key, value]) => {
      if (value instanceof z.ZodDefault) {
        return [key, value._zod.def.defaultValue];
      }
      return [key, undefined];
    })
  );

  // Override with provided item values
  if (item) {
    Object.entries(item).forEach(([key, value]) => {
      if (value !== undefined) {
        defaults[key] = value;
      }
    });
  }

  return defaults as z.infer<z.ZodObject<T>>;
}
