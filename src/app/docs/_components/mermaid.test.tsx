import { act, render, waitFor } from '@testing-library/react';

import { Mermaid } from './mermaid';

const mermaid = vi.hoisted(() => ({
  initialize: vi.fn(),
  render: vi.fn(async () => ({ svg: '<svg id="diagram"></svg>' })),
}));

vi.mock('mermaid', () => ({ default: mermaid }));

let reportIntersection: (isIntersecting: boolean) => void;
const disconnect = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal(
    'IntersectionObserver',
    vi.fn(function (callback: IntersectionObserverCallback) {
      reportIntersection = (isIntersecting) =>
        callback(
          [{ isIntersecting } as IntersectionObserverEntry],
          {} as IntersectionObserver,
        );
      return { observe: vi.fn(), disconnect };
    }),
  );
});

describe('Mermaid', () => {
  test('waits until the diagram is on screen before rendering', async () => {
    const { container } = render(<Mermaid chart="flowchart LR; A-->B" />);

    act(() => reportIntersection(false));
    expect(mermaid.render).not.toHaveBeenCalled();

    act(() => reportIntersection(true));

    await waitFor(() => {
      expect(container.querySelector('#diagram')).toBeInTheDocument();
    });
    expect(mermaid.render).toHaveBeenCalledOnce();
    expect(disconnect).toHaveBeenCalled();
  });

  test('stops observing on unmount', () => {
    const { unmount } = render(<Mermaid chart="flowchart LR; A-->B" />);

    unmount();

    expect(disconnect).toHaveBeenCalled();
    expect(mermaid.render).not.toHaveBeenCalled();
  });
});
