'use client';

import { useState } from 'react';

import {
  Container,
  Grid,
  GridItem,
  IconButton,
  Separator,
  useBreakpointValue,
} from '@chakra-ui/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import Header from './_components/header';
import Sidebar from './_components/sidebar';

export default function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
      transition="all 0.3s ease"
    >
      <GridItem gridArea="header">
        <Header />
        <Separator />
      </GridItem>

      <GridItem
        hideBelow="lg"
        gridArea="sidebar"
        width={sidebarWidth}
        position="relative"
        borderRightWidth={1}
        borderRightStyle="solid"
        borderRightColor="gray.200"
        transition="width 0.3s ease"
      >
        <Sidebar isExpanded={isExpanded} />
        <IconButton
          size="sm"
          variant="outline"
          position="absolute"
          zIndex={1}
          top={4}
          right="-36px"
          paddingBlock={6}
          borderTopLeftRadius={0}
          borderBottomLeftRadius={0}
          borderLeftColor="gray.100"
          onClick={() => setIsExpanded(!isExpanded)}
          title={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {isExpanded ? <ChevronLeft /> : <ChevronRight />}
        </IconButton>
      </GridItem>

      <GridItem gridArea="main" overflow="auto" height="100%">
        <Container
          paddingBlock={4}
          maxWidth={['vw', 'vw', 'vw', '4xl', '6xl', '8xl']}
        >
          {children}
        </Container>
      </GridItem>
    </Grid>
  );
}
