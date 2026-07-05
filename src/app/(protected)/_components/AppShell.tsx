'use client';

import { useRouter } from 'next/navigation';
import { PropsWithChildren, Suspense, useEffect, useState } from 'react';

import { Grid, GridItem, Stack } from '@chakra-ui/react';

import { toaster } from '@/components/ui/toaster';
import { useSessionContext } from '@/providers/session';
import { LOGIN_PATH } from '@/routes';

import Header from './AppHeader';
import Breadcrumbs from './Breadcrumbs';
import Sidebar from './Sidebar';

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
      height="100vh"
      templateRows="auto 1fr"
      templateColumns={{ base: '1fr', lg: `${sidebarWidth} 1fr` }}
      transition="grid-template-columns 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
    >
      <GridItem colSpan={{ base: 1, lg: 2 }}>
        <Header />
      </GridItem>

      <GridItem
        hideBelow="lg"
        backgroundColor="gray.50"
        borderRightWidth="1px"
        borderRightColor="gray.200"
      >
        <Sidebar isExpanded={isExpanded} setIsExpanded={setIsExpanded} />
      </GridItem>

      <GridItem overflow="auto">
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
