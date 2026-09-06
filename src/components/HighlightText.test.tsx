import { expectNoA11yViolations, renderWithUI, screen } from '@/test/utilities';

import HighlightText from './HighlightText';

describe('HighlightText', () => {
  const setup = (query: string | string[], text: string) =>
    renderWithUI(<HighlightText query={query}>{text}</HighlightText>);

  test('should be accessible', async () => {
    const { container } = setup('hello', 'Say hello to the world');

    await expectNoA11yViolations(container);
  });

  test('renders the full text', () => {
    const { container } = setup('hello', 'Say hello to the world');

    // Highlight splits the text across nodes; check the combined text content.
    expect(container.textContent).toBe('Say hello to the world');
  });

  test('wraps the matching substring in a mark element', () => {
    const { container } = setup('hello', 'Say hello to the world');

    const mark = container.querySelector('mark');
    expect(mark).toBeInTheDocument();
    expect(mark).toHaveTextContent('hello');
  });

  test('is case-insensitive', () => {
    const { container } = setup('HELLO', 'Say hello to the world');

    expect(container.querySelector('mark')).toHaveTextContent('hello');
  });

  test('highlights the first occurrence when the query appears multiple times', () => {
    const { container } = setup('hello', 'hello world, hello again');

    // Chakra UI's Highlight marks only the first occurrence of a string query.
    const marks = container.querySelectorAll('mark');
    expect(marks).toHaveLength(1);
    expect(marks[0]).toHaveTextContent('hello');
  });

  test('renders the text unchanged when the query does not match', () => {
    const { container } = setup('xyz', 'Say hello to the world');

    expect(container.querySelector('mark')).not.toBeInTheDocument();
    expect(screen.getByText('Say hello to the world')).toBeInTheDocument();
  });

  test('joins array children with a comma', () => {
    const { container } = renderWithUI(
      <HighlightText query="beta">{['alpha', 'beta', 'gamma']}</HighlightText>,
    );

    expect(container.textContent).toBe('alpha, beta, gamma');
    expect(container.querySelector('mark')).toHaveTextContent('beta');
  });

  test('highlights multiple queries when an array is provided', () => {
    const { container } = setup(['hello', 'world'], 'Say hello to the world');

    const marks = container.querySelectorAll('mark');
    expect(marks).toHaveLength(2);
    const markedText = Array.from(marks).map((m) => m.textContent);
    expect(markedText).toEqual(expect.arrayContaining(['hello', 'world']));
  });
});
