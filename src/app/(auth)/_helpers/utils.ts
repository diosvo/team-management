import {
  EmailSchema,
  LoginSchema,
  RegisterSchema,
} from '@/features/user/schemas/auth';

export enum Page {
  Login = 'login',
  Register = 'register',
  ResetPassword = 'reset-password',
}

export const pageTitle = {
  [Page.Login]: 'Sign in to your account',
  [Page.Register]: 'Create a new account',
  [Page.ResetPassword]: 'Reset password',
} as const;

export const togglePageText = {
  [Page.Login]: "Don't have an account?",
  [Page.Register]: 'Already have an account?',
} as const;

export const buttonText = {
  [Page.Login]: 'Sign In',
  [Page.Register]: 'Sign Up',
  [Page.ResetPassword]: 'Send request password instructions',
} as const;

export const FormValues = {
  [Page.Login]: LoginSchema,
  [Page.Register]: RegisterSchema,
  [Page.ResetPassword]: EmailSchema,
};
