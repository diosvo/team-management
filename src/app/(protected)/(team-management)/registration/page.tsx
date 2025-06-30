import { Metadata } from 'next';

import { getRoster } from '@/features/user/actions/user';
import { UserRole, UserState } from '@/utils/enum';

import RegistrationPageClient from './_components/main';

export const metadata: Metadata = {
  title: 'Tournament Registration',
  description: 'Register players for the tournament',
};

export default async function RegistrationPage() {
  const users = await getRoster({
    query: '',
    role: [UserRole.PLAYER],
    state: [UserState.ACTIVE],
  });

  return <RegistrationPageClient users={users} />;
}
