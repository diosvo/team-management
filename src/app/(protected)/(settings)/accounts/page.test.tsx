import { getAccounts } from '@/actions/account';
import { MOCK_ACCOUNT } from '@/test/mocks/account';
import { renderWithUI, screen, setupTestLifecycle } from '@/test/utilities';

import AccountsPage, { generateMetadata } from './page';

vi.mock('@/actions/account', () => ({
  getAccounts: vi.fn(),
}));

const propsSpy = {
  header: undefined as unknown,
  stats: undefined as unknown,
  table: undefined as unknown,
};

vi.mock('./_components/AccountHeader', () => ({
  default: (props: unknown) => {
    propsSpy.header = props;
    return <div>AccountHeader</div>;
  },
}));
vi.mock('@/components/SearchInput', () => ({
  default: () => <div>SearchInput</div>,
}));
vi.mock('./_components/AccountStats', () => ({
  default: (props: unknown) => {
    propsSpy.stats = props;
    return <div>AccountStats</div>;
  },
}));
vi.mock('./_components/AccountTable', () => ({
  default: (props: unknown) => {
    propsSpy.table = props;
    return <div>AccountTable</div>;
  },
}));

describe('AccountsPage', () => {
  setupTestLifecycle();

  beforeEach(() => {
    vi.mocked(getAccounts).mockResolvedValue([MOCK_ACCOUNT]);
  });

  test('exposes page metadata', async () => {
    const metadata = await generateMetadata();

    expect(metadata.title).toBe('Accounts');
    expect(metadata.description).toBe(
      'Invite members and manage how they sign in.',
    );
  });

  test('renders every section', async () => {
    renderWithUI(await AccountsPage());

    ['AccountHeader', 'AccountStats', 'SearchInput', 'AccountTable'].forEach(
      (section) => {
        expect(screen.getByText(section)).toBeInTheDocument();
      },
    );
  });

  test('passes the fetched accounts to every section', async () => {
    renderWithUI(await AccountsPage());

    expect(getAccounts).toHaveBeenCalled();
    expect(propsSpy.header).toEqual({ accounts: [MOCK_ACCOUNT] });
    expect(propsSpy.stats).toEqual({ accounts: [MOCK_ACCOUNT] });
    expect(propsSpy.table).toEqual({ accounts: [MOCK_ACCOUNT] });
  });
});
