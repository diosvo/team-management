import { z } from 'zod';

// Field schemas - reusable components
const fields = {
  name: z.string().min(6, { message: 'Be at least 6 characters long.' }).trim(),
  email: z.string().email({ message: 'Please enter a valid email.' }).trim(),
  password: z
    .string()
    .min(8, { message: 'Be at least 8 characters long.' })
    .regex(/[a-zA-Z]/, { message: 'Contain at least one letter.' })
    .regex(/[0-9]/, { message: 'Contain at least one number.' })
    .regex(/[^a-zA-Z0-9]/, {
      message: 'Contain at least one special character.',
    })
    .trim(),
};

// Schema definitions
export const EmailSchema = z.object({ email: fields.email });
export const PasswordSchema = z.object({ password: fields.password });
export const LoginSchema = z.object({
  email: fields.email,
  password: z.string(),
});

// Types
export type EmailValue = z.infer<typeof EmailSchema>;
export type PasswordValue = z.infer<typeof PasswordSchema>;
export type LoginValues = z.infer<typeof LoginSchema>;
export type AuthValues = EmailValue | LoginValues;
