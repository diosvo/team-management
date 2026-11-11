import type { ReactElement, ReactNode } from 'react';

import { loadPerformanceFilters } from '@/lib/nuqs';

import { verifySession } from '@/actions/auth';
import { getPerformanceIdentity } from '@/actions/player-performance';
import {
  MOCK_PERFORMANCE_IDENTITY,
  MOCK_PERFORMANCE_RANGE,
  MOCK_PERFORMANCE_TARGET_ID,
} from '@/test/mocks/performance';
import { renderWithUI, screen, setupTestLifecycle } from '@/test/utilities';
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
  HeaderSkeleton: ({ title }: { title: string }) => (
    <div>HeaderSkeleton {title}</div>
  ),
  SECTION_SKELETONS: {
    attendance: () => <div>AttendanceSkeleton</div>,
    testing: () => <div>TestingSkeleton</div>,
    activity: () => <div>ActivitySkeleton</div>,
    matches: () => <div>MatchesSkeleton</div>,
  },
  StatsSkeleton: () => <div>StatsSkeleton</div>,
}));
vi.mock('../_components/PerformanceLoading', () => ({
  BodySkeleton: () => <div>BodySkeleton</div>,
}));
vi.mock('../_components/PerformanceStats', () => ({
  default: ({ target_id }: { target_id: string }) => (
    <div>PerformanceStats {target_id}</div>
  ),
}));
vi.mock('../_components/PerformanceTabs', () => ({
  default: ({ active, children }: { active: string; children: ReactNode }) => (
    <section data-testid="tabs" aria-label={active}>
      {children}
    </section>
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

const IDENTITY: PerformanceIdentity = {
  ...MOCK_PERFORMANCE_IDENTITY,
  is_own: false,
  is_captain: false,
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
      params: Promise.resolve({ id: MOCK_PERFORMANCE_TARGET_ID }),
      searchParams: Promise.resolve({}),
    } as never)) as Element;
    const [header, body] = page.props.children as [Element, Element];

    return { header, body };
  };

  beforeEach(() => {
    mockLoadFilters.mockResolvedValue({
      ...MOCK_PERFORMANCE_RANGE,
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
      expect(screen.getByText('BodySkeleton')).toBeVisible();
    });

    test('titles the header skeleton for your own page', async () => {
      mockVerifySession.mockResolvedValue({
        user: { id: MOCK_PERFORMANCE_TARGET_ID },
      } as never);
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

    expect(mockGetIdentity).toHaveBeenCalledWith(MOCK_PERFORMANCE_TARGET_ID);
    expect(screen.getByTestId('header')).toHaveTextContent('Jane Doe');
  });

  describe('body', () => {
    test('renders the stats and only the open tab section', async () => {
      const { body } = await setup();

      await resolve(body);

      expect(
        screen.getByText(`PerformanceStats ${MOCK_PERFORMANCE_TARGET_ID}`),
      ).toBeVisible();
      expect(screen.getByTestId('tabs')).toHaveAccessibleName('testing');
      expect(screen.getByText('TestingSection Jane Doe')).toBeVisible();
      expect(screen.queryByText(/AttendanceSection/)).not.toBeInTheDocument();
    });

    test.each([
      ['attendance', 'AttendanceSection You'],
      ['testing', 'TestingSection You'],
      ['activity', `ActivitySection ${MOCK_PERFORMANCE_TARGET_ID}`],
      ['matches', `MatchesSection ${MOCK_PERFORMANCE_TARGET_ID}`],
    ])('renders the %s section on your own page', async (tab, text) => {
      mockLoadFilters.mockResolvedValue({
        ...MOCK_PERFORMANCE_RANGE,
        tab,
      } as never);
      mockGetIdentity.mockResolvedValue({ ...IDENTITY, is_own: true });
      const { body } = await setup();

      await resolve(body);

      expect(screen.getByText(text)).toBeVisible();
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
