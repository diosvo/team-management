import { GithubInfo } from 'fumadocs-ui/components/github-info';
import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';

import { docsUrl } from './i18n';
import { appName, gitConfig } from './shared';

export function baseOptions(lang?: string): BaseLayoutProps {
  return {
    nav: {
      url: docsUrl([], lang),
      title: (
        <>
          <img src="/docs/logo.webp" alt={appName} className="h-8 w-auto" />
          <span className="rounded-md border px-1.5 py-0.5 text-xs font-normal text-fd-muted-foreground">
            v1.0
          </span>
        </>
      ),
    },
    links: [
      {
        type: 'custom',
        children: (
          <GithubInfo
            owner={gitConfig.user}
            repo={gitConfig.repo}
            token={process.env.GITHUB_TOKEN}
          />
        ),
      },
    ],
    // The main app is light-only; docs follow it (see RootProvider in the
    // docs layout), so there is no theme to switch.
    themeSwitch: { enabled: false },
  };
}
