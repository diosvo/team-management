import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const RegisterSchema = LoginSchema.extend({
  name: z.string().min(1).max(128),
});

export type LoginValues = z.infer<typeof LoginSchema>;
export type RegisterValues = z.infer<typeof RegisterSchema>;
