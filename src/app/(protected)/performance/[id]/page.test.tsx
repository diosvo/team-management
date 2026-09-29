import type { ReactElement, ReactNode } from 'react';

import { renderWithUI, screen, setupTestLifecycle } from '@/test/utilities';

import { verifySession } from '@/actions/auth';
import { getPerformanceIdentity } from '@/actions/player-performance';
import { loadPerformanceFilters } from '@/lib/nuqs';
import type { PerformanceIdentity } from '@/types/performance';

import PerformancePage, { generateMetadata } from './page';

vi.mock('@/actions/auth', () => ({ verifySession: vi.fn() }));
vi.mock('@/actions/player-performance', () => ({
  getPerformanceIdentity: vi.fn(),
}));
vi.mock('@/lib/nuqs', () => ({ loadPerformanceFilters: vi.fn() }));

// Child components are covered by their own tests; render lightweight markers
// and surface the props the page wires through to them.
vi.mock('../_components/PerformanceHeader', () => ({
  default: ({ identity }: { identity: PerformanceIdentity }) => (
    <div data-testid="header">{identity.name}</div>
  ),
}));
vi.mock('../_components/PerformanceSkeleton', () => ({
  ActivitySkeleton: () => <div>ActivitySkeleton</div>,
  AttendanceSkeleton: () => <div>AttendanceSkeleton</div>,
  BodySkeleton: ({ tab }: { tab: string }) => <div>BodySkeleton {tab}</div>,
  HeaderSkeleton: ({ title }: { title: string }) => (
    <div>HeaderSkeleton {title}</div>
  ),
  MatchesSkeleton: () => <div>MatchesSkeleton</div>,
  StatsSkeleton: () => <div>StatsSkeleton</div>,
  TestingSkeleton: () => <div>TestingSkeleton</div>,
}));
vi.mock('../_components/PerformanceStats', () => ({
  default: ({ target_id }: { target_id: string }) => (
    <div>PerformanceStats {target_id}</div>
  ),
}));
vi.mock('../_components/PerformanceTabs', () => ({
  default: (sections: Record<string, ReactNode>) => (
    <div data-testid="tabs">
      {Object.entries(sections).map(([tab, section]) => (
        <section key={tab} aria-label={tab}>
          {section}
        </section>
      ))}
    </div>
  ),
}));
vi.mock('../_components/Sections', () => ({
  ActivitySection: ({ target_id }: { target_id: string }) => (
    <div>ActivitySection {target_id}</div>
  ),
  AttendanceSection: ({ subject }: { subject: string }) => (
    <div>AttendanceSection {subject}</div>
  ),
  MatchesSection: ({ target_id }: { target_id: string }) => (
    <div>MatchesSection {target_id}</div>
  ),
  TestingSection: ({ subject }: { subject: string }) => (
    <div>TestingSection {subject}</div>
  ),
}));

const PLAYER_ID = 'player-1';
const RANGE = { from: '2026-01-01', to: '2026-12-31' };

const IDENTITY: PerformanceIdentity = {
  id: PLAYER_ID,
  name: 'Jane Doe',
  is_own: false,
  is_player: true,
  is_captain: false,
  jersey_number: 7,
  position: 'center',
};

type Element = ReactElement<{
  children?: ReactNode;
  fallback?: ReactNode;
}>;

// The header and body are async server components streamed into their own
// <Suspense>; resolve each one the way the server would before rendering it.
const resolve = async (boundary: Element) => {
  const section = boundary.props.children as ReactElement<object>;
  const Component = section.type as (props: object) => Promise<ReactElement>;

  return renderWithUI(await Component(section.props));
};

describe('PerformancePage', () => {
  const mockVerifySession = vi.mocked(verifySession);
  const mockGetIdentity = vi.mocked(getPerformanceIdentity);
  const mockLoadFilters = vi.mocked(loadPerformanceFilters);

  setupTestLifecycle();

  const setup = async () => {
    const page = (await PerformancePage({
      params: Promise.resolve({ id: PLAYER_ID }),
      searchParams: Promise.resolve({}),
    } as never)) as Element;
    const [header, body] = page.props.children as [Element, Element];

    return { header, body };
  };

  beforeEach(() => {
    mockLoadFilters.mockResolvedValue({
      ...RANGE,
      tab: 'testing',
    } as never);
    mockVerifySession.mockResolvedValue({ user: { id: 'admin-1' } } as never);
    mockGetIdentity.mockResolvedValue(IDENTITY);
  });

  test('exposes page metadata', async () => {
    const metadata = await generateMetadata();

    expect(metadata.title).toBe('Performance');
    expect(metadata.description).toBe(
      'Attendance, test results and match statistics for a player',
    );
  });

  describe('fallbacks', () => {
    test('titles the header skeleton for another player', async () => {
      const { header, body } = await setup();

      renderWithUI(
        <>
          {header.props.fallback}
          {body.props.fallback}
        </>,
      );

      expect(screen.getByText('HeaderSkeleton Performance')).toBeVisible();
      expect(screen.getByText('BodySkeleton testing')).toBeVisible();
    });

    test('titles the header skeleton for your own page', async () => {
      mockVerifySession.mockResolvedValue({ user: { id: PLAYER_ID } } as never);
      const { header } = await setup();

      renderWithUI(<>{header.props.fallback}</>);

      expect(screen.getByText('HeaderSkeleton My Performance')).toBeVisible();
    });

    test('treats a missing session as another player', async () => {
      mockVerifySession.mockResolvedValue(null);
      const { header } = await setup();

      renderWithUI(<>{header.props.fallback}</>);

      expect(screen.getByText('HeaderSkeleton Performance')).toBeVisible();
    });
  });

  test('renders the header with the player identity', async () => {
    const { header } = await setup();

    await resolve(header);

    expect(mockGetIdentity).toHaveBeenCalledWith(PLAYER_ID);
    expect(screen.getByTestId('header')).toHaveTextContent('Jane Doe');
  });

  describe('body', () => {
    test('renders the stats and every tab section for a player', async () => {
      const { body } = await setup();

      await resolve(body);

      expect(screen.getByText(`PerformanceStats ${PLAYER_ID}`)).toBeVisible();
      expect(screen.getByText('AttendanceSection Jane Doe')).toBeVisible();
      expect(screen.getByText('TestingSection Jane Doe')).toBeVisible();
      expect(screen.getByText(`ActivitySection ${PLAYER_ID}`)).toBeVisible();
      expect(screen.getByText(`MatchesSection ${PLAYER_ID}`)).toBeVisible();
    });

    test('calls the player "You" on your own page', async () => {
      mockGetIdentity.mockResolvedValue({ ...IDENTITY, is_own: true });
      const { body } = await setup();

      await resolve(body);

      expect(screen.getByText('AttendanceSection You')).toBeVisible();
      expect(screen.getByText('TestingSection You')).toBeVisible();
    });

    test('explains another user is not a player', async () => {
      mockGetIdentity.mockResolvedValue({ ...IDENTITY, is_player: false });
      const { body } = await setup();

      await resolve(body);

      expect(screen.getByText('Players only')).toBeVisible();
      expect(screen.getByText('Jane Doe is not a player')).toBeVisible();
      expect(
        screen.getByText(
          'Attendance, test results and box scores are recorded for players only.',
        ),
      ).toBeVisible();
      expect(screen.queryByTestId('tabs')).not.toBeInTheDocument();
    });

    test('explains your own account has no performance data', async () => {
      mockGetIdentity.mockResolvedValue({
        ...IDENTITY,
        is_own: true,
        is_player: false,
      });
      const { body } = await setup();

      await resolve(body);

      expect(
        screen.getByText('No performance data for this account'),
      ).toBeVisible();
    });
  });
});
