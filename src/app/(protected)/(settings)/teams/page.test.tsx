import { Mock } from 'vitest';

import { MOCK_TEAM } from '@/test/mocks/team';
import { renderWithUI, screen } from '@/test/utilities';

import { getTeams } from '@/actions/team';

import TeamsPage from './page';

vi.mock('@/actions/team', () => ({
  getTeams: vi.fn(),
}));

const propsSpy = {
  table: undefined as unknown,
};

vi.mock('./_components/TeamHeader', () => ({
  default: () => <div>TeamHeader</div>,
}));
vi.mock('@/components/SearchInput', () => ({
  default: () => <div>SearchInput</div>,
}));
vi.mock('./_components/TeamTable', () => ({
  default: (props: unknown) => {
    propsSpy.table = props;
    return <div>TeamTable</div>;
  },
}));

describe('TeamsPage', () => {
  const mockGetTeams = getTeams as unknown as Mock;

  const setup = async (teams: Array<typeof MOCK_TEAM> = [MOCK_TEAM]) => {
    mockGetTeams.mockResolvedValue(teams);

    return renderWithUI(await TeamsPage());
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders all team sections', async () => {
    await setup();

    expect(screen.getByText('TeamHeader')).toBeInTheDocument();
    expect(screen.getByText('SearchInput')).toBeInTheDocument();
    expect(screen.getByText('TeamTable')).toBeInTheDocument();
  });

  test('fetches the teams', async () => {
    await setup();

    expect(mockGetTeams).toHaveBeenCalled();
  });

  test('passes the fetched teams to the table', async () => {
    await setup([MOCK_TEAM]);

    expect(propsSpy.table).toEqual({ teams: [MOCK_TEAM] });
  });
});
