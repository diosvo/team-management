import { UserRole } from '@/utils/enum';

import { revalidate } from '@/actions/cache';
import {
  selectJerseyOrderSheet,
  selectPaymentEditorEmails,
  updateJerseyOrderSheet,
} from '@/db/jersey-order';
import {
  mockWithAuth,
  mockWithResource,
  resetMockAuthUser,
  setMockAuthUser,
} from '@/test/mocks/auth';
import { MOCK_USER } from '@/test/mocks/user';

import {
  getJerseyOrderSheet,
  getPaymentEditors,
  saveJerseyOrderSheet,
} from './jersey-order';

vi.mock('./auth', () => ({
  withAuth: mockWithAuth,
  withResource: mockWithResource,
}));

vi.mock('@/db/jersey-order', () => ({
  selectJerseyOrderSheet: vi.fn(),
  selectPaymentEditorEmails: vi.fn(),
  updateJerseyOrderSheet: vi.fn(),
}));

vi.mock('@/actions/cache', () => ({
  revalidate: { roster: vi.fn() },
}));

const ID = '1AbCdEfGhIjKlMnOpQrStUvWxYz0123456789-_xyzAB';
const SHEET = { url: `https://docs.google.com/spreadsheets/d/${ID}/edit` };
const YEAR = new Date().getFullYear();

describe('jersey-order actions', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => resetMockAuthUser());

  describe('getJerseyOrderSheet', () => {
    test("reads this year's sheet for the super admin", async () => {
      setMockAuthUser({ ...MOCK_USER, role: UserRole.SUPER_ADMIN });
      vi.mocked(selectJerseyOrderSheet).mockResolvedValue({
        url: SHEET.url,
        updated_at: new Date(),
      });

      expect(await getJerseyOrderSheet()).toMatchObject({ url: SHEET.url });
      expect(selectJerseyOrderSheet).toHaveBeenCalledWith(
        MOCK_USER.team_id,
        YEAR,
      );
    });

    test('reads it for a captain', async () => {
      setMockAuthUser({
        ...MOCK_USER,
        role: UserRole.PLAYER,
        is_captain: true,
      } as typeof MOCK_USER);
      vi.mocked(selectJerseyOrderSheet).mockResolvedValue(null);

      await getJerseyOrderSheet();

      expect(selectJerseyOrderSheet).toHaveBeenCalled();
    });

    test('returns null for other members without querying', async () => {
      setMockAuthUser({ ...MOCK_USER, role: UserRole.PLAYER });

      expect(await getJerseyOrderSheet()).toBeNull();
      expect(selectJerseyOrderSheet).not.toHaveBeenCalled();
    });
  });

  describe('getPaymentEditors', () => {
    test('lists editors for the super admin', async () => {
      setMockAuthUser({ ...MOCK_USER, role: UserRole.SUPER_ADMIN });
      vi.mocked(selectPaymentEditorEmails).mockResolvedValue([
        'admin@example.com',
      ]);

      expect(await getPaymentEditors()).toEqual(['admin@example.com']);
      expect(selectPaymentEditorEmails).toHaveBeenCalledWith(MOCK_USER.team_id);
    });

    test('lists them for a captain', async () => {
      setMockAuthUser({
        ...MOCK_USER,
        role: UserRole.PLAYER,
        is_captain: true,
      } as typeof MOCK_USER);
      vi.mocked(selectPaymentEditorEmails).mockResolvedValue([]);

      await getPaymentEditors();

      expect(selectPaymentEditorEmails).toHaveBeenCalled();
    });

    test('returns nothing for other members without querying', async () => {
      setMockAuthUser({ ...MOCK_USER, role: UserRole.PLAYER });

      expect(await getPaymentEditors()).toEqual([]);
      expect(selectPaymentEditorEmails).not.toHaveBeenCalled();
    });
  });

  describe('saveJerseyOrderSheet', () => {
    test("stores the link for the team's year and refreshes the roster", async () => {
      const result = await saveJerseyOrderSheet(ID);

      expect(result.success).toBe(true);
      expect(updateJerseyOrderSheet).toHaveBeenCalledWith(
        MOCK_USER.team_id,
        ID,
      );
      expect(revalidate.roster).toHaveBeenCalled();
    });

    test('rejects something that is not a Drive file id', async () => {
      const result = await saveJerseyOrderSheet('../../evil?x=1');

      expect(result).toMatchObject({
        success: false,
        message: 'Invalid Google Sheet link.',
      });
      expect(updateJerseyOrderSheet).not.toHaveBeenCalled();
    });

    test('reports a failed write', async () => {
      vi.mocked(updateJerseyOrderSheet).mockRejectedValueOnce(new Error('db'));

      const result = await saveJerseyOrderSheet(ID);

      expect(result).toMatchObject({
        success: false,
        message: 'Could not save the jersey sheet.',
      });
      expect(revalidate.roster).not.toHaveBeenCalled();
    });
  });
});
