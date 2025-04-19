export enum Page {
  Login = 'login',
  ResetPassword = 'reset-password',
}

export const pageTitle = {
  [Page.Login]: 'Sign in to your account',
  [Page.ResetPassword]: 'Reset password',
} as const;

export const buttonText = {
  [Page.Login]: 'Sign In',
  [Page.ResetPassword]: 'Send request password instruction',
} as const;
