import { AccountStatus } from '@/utils/enum';

import {
  MOCK_ACCOUNT,
  MOCK_EXPIRED_ACCOUNT,
  MOCK_INVITED_ACCOUNT,
} from '@/test/mocks/account';
import {
  axeInteractiveStat,
  expectNoA11yViolations,
  mockUseQueryStates,
  renderWithUI,
  screen,
  setupTestLifecycle,
} from '@/test/utilities';

import AccountStats from './AccountStats';

const ACCOUNTS = [
  MOCK_ACCOUNT,
  { ...MOCK_ACCOUNT, id: 'user-2' },
  MOCK_INVITED_ACCOUNT,
  MOCK_EXPIRED_ACCOUNT,
];

describe('AccountStats', () => {
  const setSearchParams = vi.fn();

  const setup = (accounts = ACCOUNTS, params = {}) => {
    mockUseQueryStates(params, setSearchParams);

    return renderWithUI(<AccountStats accounts={accounts} />);
  };

  setupTestLifecycle();

  test('should be accessible', async () => {
    const { container } = setup();

    await expectNoA11yViolations(container, axeInteractiveStat);
  });

  test('counts accounts per sign-in status', () => {
    setup();

    const value = (label: string) =>
      screen.getByText(label).parentElement?.textContent;

    expect(value('Total accounts')).toContain('4');
    expect(value('Activated')).toContain('2');
    expect(value('Invited')).toContain('1');
    expect(value('Link expired')).toContain('1');
  });

  test('clears the filters from the total card', async () => {
    const { user } = setup();

    await user.click(screen.getByText('Total accounts'));

    expect(setSearchParams).toHaveBeenCalledWith(null);
  });

  test('filters to a status and keeps the other params', async () => {
    const { user } = setup(ACCOUNTS, { q: 'linh', page: 3 });

    await user.click(screen.getByText('Link expired'));

    expect(setSearchParams).toHaveBeenCalledWith(
      expect.objectContaining({
        q: 'linh',
        status: [AccountStatus.LINK_EXPIRED],
        page: 1,
      }),
    );
  });
});
