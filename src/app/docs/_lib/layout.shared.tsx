import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';

import { appName, gitConfig } from './shared';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <>
          <img src="/docs/logo.webp" alt={appName} className="h-8 w-auto" />
          <span className="rounded-md border px-1.5 py-0.5 text-xs font-normal text-fd-muted-foreground">
            v1.0
          </span>
        </>
      ),
    },
    githubUrl: `https://github.com/${gitConfig.user}/${gitConfig.repo}`,
    // The main app is light-only; docs follow it (see RootProvider in the
    // docs layout), so there is no theme to switch.
    themeSwitch: { enabled: false },
  };
}
