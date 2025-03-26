import { z } from 'zod';

const MIN_LENGTH = 6;
const FIELD_VALIDATION = {
  TEST: {
    SPECIAL_CHAR: (value: string) =>
      /[-._!"`'#%&,:;<>=@{}~\$\(\)\*\+\/\\\?\[\]\^\|]+/.test(value),
    LOWERCASE: (value: string) => /[a-z]/.test(value),
    UPPERCASE: (value: string) => /[A-Z]/.test(value),
    NUMBER: (value: string) => /.*[0-9].*/.test(value),
  },
  MSG: {
    MIN_LEN: `Password must have ${MIN_LENGTH} characters`,
    SPECIAL_CHAR: 'Password must contain at least one special character',
    LOWERCASE: 'Password must contain at least one lowercase letter',
    UPPERCASE: 'Password must contain at least one uppercase letter',
    NUMBER: 'Password must contain at least one number',
  },
};

export const PasswordSchema = z.object({
  password: z
    .string()
    .min(MIN_LENGTH, {
      message: FIELD_VALIDATION.MSG.MIN_LEN,
    })
    .refine(
      FIELD_VALIDATION.TEST.SPECIAL_CHAR,
      FIELD_VALIDATION.MSG.SPECIAL_CHAR
    )
    .refine(FIELD_VALIDATION.TEST.LOWERCASE, FIELD_VALIDATION.MSG.LOWERCASE)
    .refine(FIELD_VALIDATION.TEST.UPPERCASE, FIELD_VALIDATION.MSG.UPPERCASE)
    .refine(FIELD_VALIDATION.TEST.NUMBER, FIELD_VALIDATION.MSG.NUMBER),
});

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
export type PasswordValue = z.infer<typeof PasswordSchema>;
export type ResetPasswordValue = z.infer<typeof ResetPasswordSchema>;
export type AuthValues = LoginValues | RegisterValues | ResetPasswordValue;
