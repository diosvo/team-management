import { Location } from '@/drizzle/schema';

export const MOCK_LOCATION: Location = {
  location_id: 'location-123',
  name: 'Saigon Rovers Stadium',
  address: '123 Ho Chi Minh City, Vietnam',
  created_at: new Date('2026-01-01'),
  updated_at: new Date('2026-01-01'),
};

export const MOCK_LOCATION_2: Location = {
  location_id: 'loc-2',
  name: 'Bien Hoa Stadium',
  address: 'Vietnam',
  created_at: new Date('2026-01-01'),
  updated_at: new Date('2026-01-01'),
};
