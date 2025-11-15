import { Metadata } from 'next';

import RegistrationPageClient from './_components/RegistrationPageClient';

export const metadata: Metadata = {
  title: 'Tournament Registration',
  description: 'Register players for the tournament',
};

export default async function RegistrationPage() {
  return <RegistrationPageClient />;
}
