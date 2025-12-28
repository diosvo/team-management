import { PropsWithChildren } from 'react';

import { render as renderComponent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
export * from '@testing-library/react';

import UiProvider from '@/components/ui/provider';

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
