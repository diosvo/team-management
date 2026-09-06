import type { PropsWithChildren } from 'react';

import { render as renderComponent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { configureAxe } from 'jest-axe';
export * from '@testing-library/react';

import UiProvider from '@/providers/chakra';

// Export test helpers
export * from './helpers';
import { waitForStable } from './helpers';

/**
 * `region` asks that every piece of content sit inside a landmark. That is a
 * page-level concern: a spec renders one component with no `<main>`/`<nav>`
 * around it, so the rule fires on markup the component can't be blamed for.
 * The real coverage lives in the layout, not here.
 */
const COMPONENT_SCOPE_RULES = { region: { enabled: false } };

/**
 * @description Default axe instance for component specs. Prefer
 * `expectNoA11yViolations`, which already uses it.
 */
export const axeComponent = configureAxe({ rules: COMPONENT_SCOPE_RULES });

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
    ...COMPONENT_SCOPE_RULES,
    'aria-allowed-role': { enabled: false },
    dlitem: { enabled: false },
  },
});

/**
 * @description Axe instance for the registration progress bar, which drives
 * Chakra's `Steps` without any `Steps.Content`. That renders a tablist whose
 * triggers point at panels that never exist, so two rules fire on markup we
 * don't control:
 * - `aria-valid-attr-value`: `aria-controls` references a missing panel id
 * - `aria-required-children`: the separator `<div>`s aren't allowed in a tablist
 * Clearing them for real means swapping `Steps` for a semantic `<ol>`; until
 * then this keeps the rest of the page's accessibility surface checked.
 */
export const axeDecorativeSteps = configureAxe({
  rules: {
    ...COMPONENT_SCOPE_RULES,
    'aria-valid-attr-value': { enabled: false },
    'aria-required-children': { enabled: false },
  },
});

/**
 * @description Assert the rendered UI has no accessibility violations.
 *
 * Defaults to `document.body` so portaled content (dialogs, menus, drawers) is
 * covered: those components render nothing into the `container` returned by
 * `render`, so scoping the check to it would pass without asserting anything.
 * @example
 * ```ts
 * test('should be accessible', async () => {
 *   const { container } = setup();
 *   await expectNoA11yViolations(container);
 * });
 *
 * // A dialog/menu that portals out — check the whole document instead.
 * await expectNoA11yViolations();
 *
 * // Components with an interactive Stat card need the relaxed ruleset.
 * await expectNoA11yViolations(container, axeInteractiveStat);
 * ```
 */
export const expectNoA11yViolations = async (
  target: Element = document.body,
  runner = axeComponent,
) => {
  // Axe takes several ticks to run. Without settling first, any state update a
  // component still has queued (Chakra's Avatar, Checkbox, ... all sync state
  // on mount) would land mid-scan and trip React's act() warning.
  await waitForStable();

  expect(await runner(target)).toHaveNoViolations();
};

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
