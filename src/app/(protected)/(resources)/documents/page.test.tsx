import { getDocuments } from '@/actions/document';
import { MOCK_DOCUMENT, MOCK_DOCUMENT_STATS } from '@/test/mocks/document';
import {
  expectNoA11yViolations,
  renderWithUI,
  screen,
  setupTestLifecycle,
} from '@/test/utilities';

import DocumentsPage, { generateMetadata } from './page';

vi.mock('@/actions/document', () => ({ getDocuments: vi.fn() }));

vi.mock('./_components/DocumentHeader', () => ({
  default: () => <div data-testid="header" />,
}));
vi.mock('./_components/DocumentStats', () => ({
  default: ({ stats }: { stats: { total: number } }) => (
    <div data-testid="stats">{stats.total}</div>
  ),
}));
vi.mock('./_components/DocumentFilters', () => ({
  default: () => <div data-testid="filters" />,
}));
vi.mock('./_components/DocumentGrid', () => ({
  default: ({ data }: { data: Array<unknown> }) => (
    <div data-testid="grid">{data.length}</div>
  ),
}));

describe('DocumentsPage', () => {
  setupTestLifecycle();

  beforeEach(() => {
    vi.mocked(getDocuments).mockResolvedValue({
      stats: MOCK_DOCUMENT_STATS,
      data: [MOCK_DOCUMENT],
    });
  });

  test('exposes page metadata', async () => {
    const metadata = await generateMetadata();

    expect(metadata.title).toBe('Documents');
    expect(metadata.description).toBe(
      'Photo albums, videos, tactics and files shared from Google Drive.',
    );
  });

  test('should be accessible', async () => {
    const { container } = renderWithUI(await DocumentsPage());

    await expectNoA11yViolations(container);
  });

  test('renders every section with the fetched data', async () => {
    renderWithUI(await DocumentsPage());

    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('stats')).toHaveTextContent(
      String(MOCK_DOCUMENT_STATS.total),
    );
    expect(screen.getByTestId('filters')).toBeInTheDocument();
    expect(screen.getByTestId('grid')).toHaveTextContent('1');
  });
});
