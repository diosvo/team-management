import type { SavedRegistration } from '@/app/(protected)/(team-management)/registration/_helpers/use-saved-registrations';

import { MOCK_LEAGUE } from './league';

/** A registration saved from the default roster for the mock league. */
export const MOCK_SAVED_REGISTRATION: SavedRegistration = {
  id: 'saved-1',
  leagueName: MOCK_LEAGUE.name,
  playerCount: 12,
  filename: 'summer-league',
  // "pdf" base64-encoded.
  pdfBase64: 'cGRm',
  savedAt: '2026-01-01T09:00:00.000Z',
};
