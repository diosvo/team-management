import { Mock } from 'vitest';

import { MOCK_USER } from '@/test/mocks/user';
import { renderWithUI, screen } from '@/test/utilities';

import { getRoster } from '@/actions/user';

import RosterPage from './page';

vi.mock('@/actions/user', () => ({
  getRoster: vi.fn(),
}));

// Child components are covered by their own tests; render lightweight markers
// here and capture the props the page wires through to them.
const propsSpy = {
  table: undefined as unknown,
};

vi.mock('./_components/RosterHeader', () => ({
  default: () => <div>RosterHeader</div>,
}));
vi.mock('./_components/RosterFilters', () => ({
  default: () => <div>RosterFilters</div>,
}));
vi.mock('./_components/RosterTable', () => ({
  default: (props: unknown) => {
    propsSpy.table = props;
    return <div>RosterTable</div>;
  },
}));

describe('RosterPage', () => {
  const mockGetRoster = getRoster as unknown as Mock;

  const setup = async (users: Array<typeof MOCK_USER> = [MOCK_USER]) => {
    mockGetRoster.mockResolvedValue(users);

    return renderWithUI(await RosterPage());
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders all roster sections', async () => {
    await setup();

    expect(screen.getByText('RosterHeader')).toBeInTheDocument();
    expect(screen.getByText('RosterFilters')).toBeInTheDocument();
    expect(screen.getByText('RosterTable')).toBeInTheDocument();
  });

  test('fetches the roster', async () => {
    await setup();

    expect(mockGetRoster).toHaveBeenCalled();
  });

  test('passes the fetched users to the table', async () => {
    await setup([MOCK_USER]);

    expect(propsSpy.table).toEqual({ users: [MOCK_USER] });
  });
});
