import { z } from 'zod';

export const ResetPasswordSchema = z.object({
  email: z.string().email(),
});

export const LoginSchema = ResetPasswordSchema.extend({
  password: z.string(),
});

export const RegisterSchema = LoginSchema.extend({
  name: z.string().min(1).max(128),
});

export type LoginValues = z.infer<typeof LoginSchema>;
export type RegisterValues = z.infer<typeof RegisterSchema>;
export type ResetPasswordValue = z.infer<typeof ResetPasswordSchema>;
export type AuthValues = LoginValues | RegisterValues | ResetPasswordValue;
