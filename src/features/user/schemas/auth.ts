import { z } from 'zod';

const PASSWORD_VALIDATION = {
  MIN_LENGTH: 6,
  RULES: {
    SPECIAL_CHAR: {
      test: (value: string) =>
        /[-._!"`'#%&,:;<>=@{}~\$\(\)\*\+\/\\\?\[\]\^\|]+/.test(value),
      message: 'Password must contain at least one special character',
    },
    LOWERCASE: {
      test: (value: string) => /[a-z]/.test(value),
      message: 'Password must contain at least one lowercase letter',
    },
    UPPERCASE: {
      test: (value: string) => /[A-Z]/.test(value),
      message: 'Password must contain at least one uppercase letter',
    },
    NUMBER: {
      test: (value: string) => /.*[0-9].*/.test(value),
      message: 'Password must contain at least one number',
    },
  },
};

// Field schemas - reusable components
const fields = {
  email: z.string().email(),
  name: z.string().min(1).max(128),
  password: z
    .string()
    .min(PASSWORD_VALIDATION.MIN_LENGTH, {
      message: `Password must have ${PASSWORD_VALIDATION.MIN_LENGTH} characters`,
    })
    .refine(
      PASSWORD_VALIDATION.RULES.SPECIAL_CHAR.test,
      PASSWORD_VALIDATION.RULES.SPECIAL_CHAR.message
    )
    .refine(
      PASSWORD_VALIDATION.RULES.LOWERCASE.test,
      PASSWORD_VALIDATION.RULES.LOWERCASE.message
    )
    .refine(
      PASSWORD_VALIDATION.RULES.UPPERCASE.test,
      PASSWORD_VALIDATION.RULES.UPPERCASE.message
    )
    .refine(
      PASSWORD_VALIDATION.RULES.NUMBER.test,
      PASSWORD_VALIDATION.RULES.NUMBER.message
    ),
};

// Schema definitions
export const EmailSchema = z.object({ email: fields.email });
export const PasswordSchema = z.object({ password: fields.password });
export const LoginSchema = z.object({
  email: fields.email,
  password: z.string(),
});
export const RegisterSchema = z.object({
  name: fields.name,
  email: fields.email,
  password: fields.password,
});

// Types
export type EmailValue = z.infer<typeof EmailSchema>;
export type PasswordValue = z.infer<typeof PasswordSchema>;
export type LoginValues = z.infer<typeof LoginSchema>;
export type RegisterValues = z.infer<typeof RegisterSchema>;
export type AuthValues = EmailValue | LoginValues | RegisterValues;
