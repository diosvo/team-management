import { UserRole } from '@/drizzle/schema/user';

export function canExecute({ role }: { role?: UserRole }) {
  return ['CAPTAIN', 'SUPER_ADMIN'].includes(role!);
}
