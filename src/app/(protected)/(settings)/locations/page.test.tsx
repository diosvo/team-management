import {
  expectNoA11yViolations,
  renderWithUI,
  screen,
  setupTestLifecycle,
} from '@/test/utilities';

import { getLocations } from '@/actions/location';

import LocationsPage, { generateMetadata } from './page';

vi.mock('@/actions/location', () => ({ getLocations: vi.fn() }));

vi.mock('@/components/SearchInput', () => ({
  default: () => <div data-testid="search" />,
}));

vi.mock('./_components/LocationHeader', () => ({
  default: () => <div data-testid="header" />,
}));
vi.mock('./_components/LocationTable', () => ({
  default: ({ locations }: { locations: Array<unknown> }) => (
    <div data-testid="table">{locations.length}</div>
  ),
}));

describe('LocationsPage', () => {
  const mockGetLocations = vi.mocked(getLocations);

  setupTestLifecycle();

  beforeEach(() => {
    mockGetLocations.mockResolvedValue([{ location_id: '1' }] as never);
  });

  test('exposes page metadata', async () => {
    const metadata = await generateMetadata();

    expect(metadata.title).toBe('Locations');
  });

  test('should be accessible', async () => {
    const { container } = renderWithUI(await LocationsPage());

    await expectNoA11yViolations(container);
  });

  test('renders every section with the fetched locations', async () => {
    renderWithUI(await LocationsPage());

    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('search')).toBeInTheDocument();
    expect(screen.getByTestId('table')).toHaveTextContent('1');
  });
});
