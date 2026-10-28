import { render, screen, setupTestLifecycle } from '@/test/utilities';

import messages from '@/i18n/messages/en';

import RootLayout, { generateMetadata } from './layout';

vi.mock('next/font/google', () => ({
  Google_Sans_Flex: () => ({ className: 'font-mock' }),
}));

vi.mock('next-intl', async () => {
  const actual = await vi.importActual<typeof import('next-intl')>(
    'next-intl',
  );
  return {
    ...actual,
    // The real provider requires a `locale`/`messages` it infers from a
    // request context that doesn't exist here, so supply them directly.
    NextIntlClientProvider: ({ children }: { children: React.ReactNode }) => (
      <actual.NextIntlClientProvider locale="en" messages={messages}>
        {children}
      </actual.NextIntlClientProvider>
    ),
  };
});

vi.mock('@vercel/analytics/next', () => ({
  Analytics: () => <div data-testid="analytics" />,
}));

vi.mock('@vercel/speed-insights/next', () => ({
  SpeedInsights: () => <div data-testid="speed-insights" />,
}));

const setup = async (children = <div>Test Content</div>) =>
  render(await RootLayout({ children }));

describe('RootLayout', () => {
  setupTestLifecycle();

  test('renders children', async () => {
    await setup();

    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  test('does not render Vercel plugins outside production', async () => {
    vi.doMock('@env', () => ({ default: { NODE_ENV: 'test' } }));
    vi.resetModules();
    const { default: Layout } = await import('./layout');

    render(await Layout({ children: <div>Test Content</div> }));

    expect(screen.queryByTestId('analytics')).not.toBeInTheDocument();
    expect(screen.queryByTestId('speed-insights')).not.toBeInTheDocument();

    vi.doUnmock('@env');
    vi.resetModules();
  });

  test('renders Vercel plugins in production', async () => {
    vi.doMock('@env', () => ({ default: { NODE_ENV: 'production' } }));
    vi.resetModules();
    const { default: Layout } = await import('./layout');

    render(await Layout({ children: <div>Test Content</div> }));

    expect(screen.getByTestId('analytics')).toBeInTheDocument();
    expect(screen.getByTestId('speed-insights')).toBeInTheDocument();

    vi.doUnmock('@env');
    vi.resetModules();
  });
});

describe('generateMetadata', () => {
  test('returns the site title and description', async () => {
    const metadata = await generateMetadata();

    expect(metadata.title).toEqual({
      default: 'SGR Portal',
      template: '%s | SGR Portal',
    });
    expect(metadata.description).toBeTruthy();
    expect(metadata.icons).toEqual({ icon: '/icon.png' });
  });
});
