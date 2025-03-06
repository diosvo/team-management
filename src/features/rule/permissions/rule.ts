import { UserRole } from '@/db/schema/user';

export function canExecute({ role }: { role?: UserRole }) {
  return ['CAPTAIN', 'SUPER_ADMIN'].includes(role!);
}
