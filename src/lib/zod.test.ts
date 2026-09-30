import { z } from 'zod';

import { getDefaults } from './zod';

describe('getDefaults', () => {
  test('returns defaults from schema with default values', () => {
    const schema = z.object({
      name: z.string().default('Dios'),
      age: z.number().default(26),
      active: z.boolean().default(true),
    });

    const result = getDefaults(schema);

    expect(result).toEqual({
      name: 'Dios',
      age: 26,
      active: true,
    });
  });

  test('returns undefined for fields without default values', () => {
    const schema = z.object({
      name: z.string(),
      age: z.number(),
      email: z.string().optional(),
    });

    const result = getDefaults(schema);

    expect(result).toEqual({
      name: undefined,
      age: undefined,
      email: undefined,
    });
  });

  test('returns mixed defaults and undefined for partial schema', () => {
    const schema = z.object({
      name: z.string().default('Jane'),
      age: z.number(),
      role: z.string().default('user'),
    });

    const result = getDefaults(schema);

    expect(result).toEqual({
      name: 'Jane',
      age: undefined,
      role: 'user',
    });
  });

  test('merges provided item with defaults', () => {
    const schema = z.object({
      name: z.string().default('Dios'),
      age: z.number().default(26),
      active: z.boolean().default(true),
    });

    const item = { name: 'Kitu', age: 30 };
    const result = getDefaults(schema, item);

    expect(result).toEqual({
      name: 'Kitu',
      age: 30,
      active: true,
    });
  });

  test('overrides defaults with partial item values', () => {
    const schema = z.object({
      name: z.string().default('Dios'),
      age: z.number().default(26),
      email: z.string().default('dios@example.com'),
    });

    const item = { email: 'kitu@example.com' };
    const result = getDefaults(schema, item);

    expect(result).toEqual({
      name: 'Dios',
      age: 26,
      email: 'kitu@example.com',
    });
  });

  test('handles empty schema', () => {
    const schema = z.object({});
    const result = getDefaults(schema);

    expect(result).toEqual({});
  });

  test('handles item with extra properties not in schema', () => {
    const schema = z.object({
      name: z.string().default('Dios'),
    });

    const item = { name: 'Kitu', extra: 'value' };
    const result = getDefaults(schema, item as any);

    expect(result).toEqual({
      name: 'Kitu',
      extra: 'value',
    });
  });

  test('handles complex default values', () => {
    const schema = z.object({
      tags: z.array(z.string()).default(['tag1', 'tag2']),
      config: z.object({ theme: z.string() }).default({ theme: 'dark' }),
      count: z.number().default(0),
    });

    const result = getDefaults(schema);

    expect(result).toEqual({
      tags: ['tag1', 'tag2'],
      config: { theme: 'dark' },
      count: 0,
    });
  });

  test('handles null and false as default values', () => {
    const schema = z.object({
      value: z.null().default(null),
      disabled: z.boolean().default(false),
      empty: z.string().default(''),
    });

    const result = getDefaults(schema);

    expect(result).toEqual({
      value: null,
      disabled: false,
      empty: '',
    });
  });
});
