import AnalyticsReport from './AnalyticsReport';

describe('AnalyticsReport', () => {
  const PERIOD = '01/01/2026 - 31/12/2026';

  test('returns an HTML string', () => {
    expect(typeof AnalyticsReport({ period: PERIOD })).toBe('string');
  });

  test('names the reporting period in the body', () => {
    const html = AnalyticsReport({ period: PERIOD });

    expect(html).toContain(`<strong>${PERIOD}</strong>`);
  });

  test('tells the reader to open the attachment', () => {
    const html = AnalyticsReport({ period: PERIOD });

    expect(html).toContain('Click the attachment link to open or download it.');
  });

  test('wraps the body in the shared email layout', () => {
    const html = AnalyticsReport({ period: PERIOD });

    expect(html).toContain('https://sgr-portal.vercel.app/icon.png');
    expect(html).toContain(
      `&copy; ${new Date().getFullYear()} Saigon Rovers Basketball Club`,
    );
  });
});
