import { Team } from '@/drizzle/schema';

export const MOCK_TEAM: Team = {
  team_id: 'sgr',
  name: 'Saigon Rovers Basketball Club',
  is_default: true,
  email: 'sgrovers.bball@gmail.com',
  establish_year: 2024,
  logo_url: 'https://example.com/logos/sgrovers.png',
  created_at: new Date('2024-02-20'),
  updated_at: new Date('2024-02-20'),
};

export const MOCK_AWAY_TEAM: Team = {
  team_id: 'hcmc',
  name: 'Ho Chi Minh City Basketball Club',
  is_default: false,
  email: 'hcm.bbal@gmail.com',
  establish_year: 2020,
  logo_url: 'https://example.com/logos/hcm.png',
  created_at: new Date('2026-01-01'),
  updated_at: new Date('2026-01-01'),
};
