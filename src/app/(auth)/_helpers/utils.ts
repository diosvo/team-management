import {
  LoginSchema,
  RegisterSchema,
  ResetPasswordSchema,
} from '@/features/user/schemas/auth';

export enum PageType {
  Login = 'login',
  Register = 'register',
  ResetPassword = 'reset-password',
}

export const pageTitle = {
  [PageType.Login]: 'Sign in to your account',
  [PageType.Register]: 'Create a new account',
  [PageType.ResetPassword]: 'Reset password',
} as const;

export const togglePageText = {
  [PageType.Login]: "Don't have an account?",
  [PageType.Register]: 'Already have an account?',
} as const;

export const buttonText = {
  [PageType.Login]: 'Sign In',
  [PageType.Register]: 'Sign Up',
  [PageType.ResetPassword]: 'Send request password instructions',
} as const;

export const formSchema = {
  [PageType.Login]: LoginSchema,
  [PageType.Register]: RegisterSchema,
  [PageType.ResetPassword]: ResetPasswordSchema,
};
