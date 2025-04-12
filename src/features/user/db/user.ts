import { db } from '@/drizzle';
import { UserTable } from '@/drizzle/schema';
import logger from '@/lib/logger';
import { cache } from 'react';

export const getUsers = cache(async () => {
  try {
    return await db.select().from(UserTable);
  } catch {
    logger.warn('An error when fetching users');
    return [];
  }
});
