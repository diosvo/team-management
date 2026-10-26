import { renderWithUI, screen } from '@/test/utilities';

import { Field } from './field';

describe('Field', () => {
  const setup = (errorText: React.ReactNode, locale: 'en' | 'vi' = 'en') =>
    renderWithUI(
      <Field label="Name" invalid errorText={errorText}>
        <input />
      </Field>,
      { locale },
    );

  test.each([
    ['en', 'This field is required.'],
    ['vi', 'Vui lòng nhập trường này.'],
  ] as const)('translates a validation key in %s', (locale, message) => {
    setup('required', locale);

    expect(screen.getByText(message)).toBeInTheDocument();
  });

  test('renders any other message verbatim', () => {
    setup('Name is taken.');

    expect(screen.getByText('Name is taken.')).toBeInTheDocument();
  });

  test('renders a node as it is', () => {
    setup(<strong>Bold error</strong>);

    expect(screen.getByText('Bold error').tagName).toBe('STRONG');
  });

  test('renders no error text without an error', () => {
    const { container } = setup(undefined);

    expect(
      container.querySelector('[data-part="error-text"]'),
    ).not.toBeInTheDocument();
  });
});
