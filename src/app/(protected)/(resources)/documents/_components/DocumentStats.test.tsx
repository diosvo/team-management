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
    setup({ total: 10, album: 2, video: 1, tactic: 3, file: 7 });

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

  test.each([
    ['Videos', DocumentType.VIDEO],
    ['Tactics', DocumentType.TACTIC],
    ['Files', DocumentType.FILE],
  ])('filters by its type when %s is clicked', async (label, type) => {
    const { user } = setup({ ...MOCK_DOCUMENT_STATS, [type]: 1 });

    await user.click(screen.getByText(label));

    expect(setSearchParams).toHaveBeenCalledWith(
      expect.objectContaining({ type: [type], page: 1 }),
    );
  });

  test('does not filter when a stat card with a value of 0 is clicked', async () => {
    const { user } = setup({ ...MOCK_DOCUMENT_STATS, video: 0 });

    await user.click(screen.getByText('Videos'));

    expect(setSearchParams).not.toHaveBeenCalled();
  });
});
