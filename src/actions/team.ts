'use server';

import { withAuth } from './auth';

import { getOtherTeams } from '@/db/team';

export const getOpponents = withAuth(getOtherTeams);
