import { PropsWithChildren } from 'react';

import { render as renderComponent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { configureAxe } from 'jest-axe';
export * from '@testing-library/react';

import UiProvider from '@/providers/chakra';

/**
 * @description Axe instance for components containing an interactive `Stat`
 * card. A clickable Stat renders a `<dl>` carrying role="button", which
 * intentionally trips two rules that don't apply to this pattern:
 * - `aria-allowed-role`: the button role on a `<dl>` element
 * - `dlitem`: its `<dt>`/`<dd>` no longer read as inside a list once the
 *   `<dl>` adopts the button role
 * Both are disabled here so the rest of the accessibility surface is still
 * checked. Tests without an interactive Stat should keep using `axe` from
 * `jest-axe` directly.
 */
export const axeInteractiveStat = configureAxe({
  rules: {
    'aria-allowed-role': { enabled: false },
    dlitem: { enabled: false },
  },
});

type RenderOptions = Parameters<typeof renderComponent>[1];

/**
 * @description Utility function to render components with userEvent
 */
export const render = (ui: React.ReactElement, options?: RenderOptions) => {
  const result = renderComponent(ui, options);

  return {
    ...result,
    user: userEvent.setup(),
  };
};

/**
 * @description Utility function to render components with UiProvider (Chakra UI)
 */
export const renderWithUI: typeof render = (Component, options) => {
  const Wrapper = ({ children }: PropsWithChildren) => (
    <UiProvider>{children}</UiProvider>
  );

  return render(Component, { ...options, wrapper: Wrapper });
};
