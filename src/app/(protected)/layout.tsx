'use client';

import { useRouter } from 'next/navigation';
import { PropsWithChildren, Suspense, useEffect, useState } from 'react';

import { Grid, GridItem, Stack } from '@chakra-ui/react';

import { toaster } from '@/components/ui/toaster';

import authClient from '@/lib/auth-client';
import { LOGIN_PATH } from '@/routes';

import Header from './_components/AppHeader';
import Breadcrumbs from './_components/Breadcrumbs';
import Sidebar from './_components/Sidebar';

export default function AuthenticatedLayout({ children }: PropsWithChildren) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const sidebarWidth = isExpanded ? '224px' : '64px';

  const { data: session, isPending } = authClient.useSession();

  // Polling-detected expiry
  useEffect(() => {
    if (!isPending && session == null) {
      router.replace(LOGIN_PATH);
    }
  }, [session, isPending, router]);

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
      templateAreas={{
        base: `
          "header"
          "main"
        `,
        lg: `
          "header header"
          "sidebar main"
        `,
      }}
      transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
    >
      <GridItem gridArea="header">
        <Header />
      </GridItem>

      <GridItem
        hideBelow="lg"
        gridArea="sidebar"
        width={sidebarWidth}
        position="relative"
        backgroundColor="gray.50"
        borderRightWidth={1}
        borderRightStyle="solid"
        borderRightColor="gray.200"
        transition="width 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
      >
        <Sidebar isExpanded={isExpanded} setIsExpanded={setIsExpanded} />
      </GridItem>

      <GridItem gridArea="main" overflow="auto" height="100%">
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
