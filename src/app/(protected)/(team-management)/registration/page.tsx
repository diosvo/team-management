import type { Metadata } from 'next';

import RegistrationIntro from './_components/RegistrationIntro';
import RegistrationPageClient from './_components/main';

export const metadata: Metadata = {
  title: 'Tournament Registration',
  description: 'Register players for the tournament',
};

export default async function RegistrationPage() {
  return (
    <>
      <RegistrationIntro />
      <RegistrationPageClient />
    </>
  );
}
