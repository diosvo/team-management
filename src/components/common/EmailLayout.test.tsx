import EmailLayout from './EmailLayout';

describe('EmailLayout', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  test('returns a string', () => {
    expect(typeof EmailLayout('content')).toBe('string');
  });

  test('renders the provided children inside the body slot', () => {
    const html = EmailLayout('<p>Hello world</p>');

    expect(html).toContain('<p>Hello world</p>');
  });

  test('renders the logo header', () => {
    const html = EmailLayout('');

    expect(html).toContain(
      '<img src="https://sgr-portal.vercel.app/icon.png" alt="icon" />',
    );
  });

  test('renders the footer with the current year', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2030-01-01'));

    const html = EmailLayout('');

    expect(html).toContain('<p>&copy; 2030 Saigon Rovers Basketball Club</p>');
  });
});
