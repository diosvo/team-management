'use server';

import { getTeam as getAction } from '@/db/team';
import { cache } from 'react';

export const getTeam = cache(async () => await getAction());
