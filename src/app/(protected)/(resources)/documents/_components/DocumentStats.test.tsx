import { DocumentType } from '@/utils/enum';

import { MOCK_DOCUMENT_STATS } from '@/test/mocks/document';
import {
  axeInteractiveStat,
  expectNoA11yViolations,
  mockUseQueryStates,
  renderWithUI,
  screen,
  setupTestLifecycle,
} from '@/test/utilities';

import DocumentStats from './DocumentStats';

describe('DocumentStats', () => {
  const setSearchParams = vi.fn();

  const setup = (stats = MOCK_DOCUMENT_STATS, params = {}) => {
    mockUseQueryStates(params, setSearchParams);

    return renderWithUI(<DocumentStats stats={stats} />);
  };

  setupTestLifecycle();

  test('should be accessible', async () => {
    const { container } = setup();

    await expectNoA11yViolations(container, axeInteractiveStat);
  });

  test('renders the labels in Vietnamese', () => {
    renderWithUI(<DocumentStats stats={MOCK_DOCUMENT_STATS} />, {
      locale: 'vi',
    });

    for (const label of ['Tổng', 'Album', 'Video', 'Tệp']) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  test('renders all stat cards with their labels', () => {
    setup();

    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText('Albums')).toBeInTheDocument();
    expect(screen.getByText('Videos')).toBeInTheDocument();
    expect(screen.getByText('Tactics')).toBeInTheDocument();
    expect(screen.getByText('Files')).toBeInTheDocument();
  });

  test('renders the stat values and pluralizes the units', () => {
    setup({ total: 10, albums: 2, videos: 1, tactics: 3, files: 7 });

    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('documents')).toBeInTheDocument();
    expect(screen.getByText('albums')).toBeInTheDocument();
    expect(screen.getByText('video')).toBeInTheDocument();
    expect(screen.getByText('tactics')).toBeInTheDocument();
    expect(screen.getByText('files')).toBeInTheDocument();
  });

  test('resets the filters when the total card is clicked', async () => {
    const { user } = setup();

    await user.click(screen.getByText('Total'));

    expect(setSearchParams).toHaveBeenCalledWith(null);
  });

  test('filters by album type and resets to the first page when albums is clicked', async () => {
    const params = { q: 'photo' };
    const { user } = setup(MOCK_DOCUMENT_STATS, params);

    await user.click(screen.getByText('Albums'));

    expect(setSearchParams).toHaveBeenCalledWith({
      ...params,
      type: [DocumentType.ALBUM],
      page: 1,
    });
  });

  test('filters by video type when videos is clicked', async () => {
    const { user } = setup(MOCK_DOCUMENT_STATS);

    await user.click(screen.getByText('Videos'));

    expect(setSearchParams).toHaveBeenCalledWith(
      expect.objectContaining({ type: [DocumentType.VIDEO], page: 1 }),
    );
  });

  test('filters by tactic type when tactics is clicked', async () => {
    const { user } = setup({ ...MOCK_DOCUMENT_STATS, tactics: 1 });

    await user.click(screen.getByText('Tactics'));

    expect(setSearchParams).toHaveBeenCalledWith(
      expect.objectContaining({ type: [DocumentType.TACTIC], page: 1 }),
    );
  });

  test('filters by file type when files is clicked', async () => {
    const { user } = setup({ ...MOCK_DOCUMENT_STATS, files: 1 });

    await user.click(screen.getByText('Files'));

    expect(setSearchParams).toHaveBeenCalledWith(
      expect.objectContaining({ type: [DocumentType.FILE], page: 1 }),
    );
  });

  test('does not filter when a stat card with a value of 0 is clicked', async () => {
    const { user } = setup({ ...MOCK_DOCUMENT_STATS, videos: 0 });

    await user.click(screen.getByText('Videos'));

    expect(setSearchParams).not.toHaveBeenCalled();
  });
});
