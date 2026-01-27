import { User } from '@/drizzle/schema';
import { UserRole, UserState } from '@/utils/enum';

export const MOCK_USER: User = {
  id: 'user-123',
  email: 'vtmn1212@gmail.com',
  name: 'Dios Vo',
  emailVerified: true,
  image: null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  team_id: 'team-123',
  dob: '12/12/1999',
  phone_number: null,
  citizen_identification: null,
  join_date: '2024-02-20',
  leave_date: null,
  state: UserState.UNKNOWN,
  role: UserRole.GUEST,
};
