'use client';

import { useRouter } from 'next/navigation';
import { type PropsWithChildren, Suspense, useEffect, useState } from 'react';

import { Grid, GridItem, Stack } from '@chakra-ui/react';

import { toaster } from '@/components/ui/toaster';
import { useSessionContext } from '@/providers/session';
import { LOGIN_PATH } from '@/routes';

import { REDUCED_MOTION_CSS, SIDEBAR_TRANSITION } from '../_helpers/utils';
import Header from './AppHeader';
import Breadcrumbs from './Breadcrumbs';
import Sidebar, { SidebarToggle } from './Sidebar';

export default function AppShell({ children }: PropsWithChildren) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(true);
  const { isAuthenticated, isLoading } = useSessionContext();

  const sidebarWidth = isExpanded ? '224px' : '64px';

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(LOGIN_PATH);
    }
  }, [isAuthenticated, isLoading, router]);

  // Unmount cleanup (covers server action redirect case)
  useEffect(() => {
    return () => {
      setTimeout(() => toaster.dismiss());
    };
  }, []);

  return (
    <Grid
      height="100dvh"
      templateRows="auto 1fr"
      templateColumns={{ base: '1fr', lg: `${sidebarWidth} 1fr` }}
      transition={`grid-template-columns ${SIDEBAR_TRANSITION}`}
      css={REDUCED_MOTION_CSS}
    >
      <GridItem colSpan={{ base: 1, lg: 2 }}>
        <Header />
      </GridItem>

      <GridItem
        hideBelow="lg"
        minHeight={0}
        backgroundColor="gray.50"
        borderRightWidth="1px"
        borderRightColor="gray.200"
      >
        <Sidebar isExpanded={isExpanded}>
          <SidebarToggle
            isExpanded={isExpanded}
            onToggle={() => setIsExpanded((prev) => !prev)}
          />
        </Sidebar>
      </GridItem>

      <GridItem position="relative" overflow="auto">
        <Suspense>
          <Stack
            hideFrom="lg"
            paddingBlock={2}
            paddingInline={{ base: 4, lg: 6 }}
          >
            <Breadcrumbs />
          </Stack>
          <Stack gap={{ base: 4, lg: 6 }} padding={{ base: 4, lg: 6 }}>
            {children}
          </Stack>
        </Suspense>
      </GridItem>
    </Grid>
  );
}
