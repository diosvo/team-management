'use client';

import { PropsWithChildren, Suspense, useState } from 'react';

import {
  Container,
  Grid,
  GridItem,
  Separator,
  useBreakpointValue,
} from '@chakra-ui/react';

import Header from './_components/AppHeader';
import Sidebar from './_components/Sidebar';

export default function AuthenticatedLayout({ children }: PropsWithChildren) {
  const smallDevice = useBreakpointValue({
    base: true,
    sm: true,
    md: true,
    lg: false,
  });
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const sidebarWidth = isExpanded ? '224px' : '64px';

  return (
    <Grid
      height="100vh"
      templateRows="auto 1fr"
      templateColumns={smallDevice ? '1fr' : `${sidebarWidth} 1fr`}
      templateAreas={
        smallDevice
          ? `
        "header"
        "main"
      `
          : `
        "header header"
        "sidebar main"
      `
      }
      transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
    >
      <GridItem gridArea="header">
        <Header smallDevice={!!smallDevice} />
        <Separator />
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
        <Container
          paddingBlock={6}
          maxWidth={['vw', 'vw', 'vw', '5xl', '6xl', '8xl']}
        >
          <Suspense>{children}</Suspense>
        </Container>
      </GridItem>
    </Grid>
  );
}
