import { UserRole } from '@/db/schema/user';

export function canCreateRule({ role }: { role?: UserRole }) {
  return ['CAPTAIN', 'SUPER_ADMIN'].includes(role!);
}
