'use client';

import { Suspense, useEffect, useState } from 'react';

import {
  Container,
  Grid,
  GridItem,
  IconButton,
  Separator,
  useBreakpointValue,
} from '@chakra-ui/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import Loading from '@/components/loading';

import { usePathname } from 'next/navigation';
import Header from './_components/header';
import Sidebar from './_components/sidebar';

export default function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isMobile = useBreakpointValue({ base: true, md: false });
  const [isExpanded, setIsExpanded] = useState(false);
  const sidebarWidth = isExpanded ? '224px' : '64px';

  const toggleSidebar = () => {
    setIsExpanded(!isExpanded);
  };

  // Auto-collapse sidebar on mobile
  useEffect(() => {
    if (isMobile) {
      setIsExpanded(false);
    }
  }, [isMobile]);

  // Add this import at the top

  // Then add this code for route change detection
  const pathname = usePathname();

  // Close sidebar when route changes on mobile devices
  useEffect(() => {
    if (isMobile) {
      setIsExpanded(false);
    }
  }, [pathname, isMobile]);

  return (
    <Grid
      h="100vh"
      templateRows="auto 1fr"
      templateColumns={isMobile ? '1fr' : `${sidebarWidth} 1fr`}
      templateAreas={
        isMobile
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
        hideBelow="xl"
        gridArea="sidebar"
        width={sidebarWidth}
        position="relative"
        borderRightWidth="1px"
        borderRightStyle="solid"
        borderRightColor="gray.200"
        transition="width 0.3s ease"
      >
        <Sidebar isExpanded={isExpanded} />
        <IconButton
          size="sm"
          variant="outline"
          position="absolute"
          top={4}
          right="-36px"
          paddingBlock={6}
          borderTopLeftRadius={0}
          borderBottomLeftRadius={0}
          borderLeftColor="white"
          onClick={toggleSidebar}
          title={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {isExpanded ? <ChevronLeft /> : <ChevronRight />}
        </IconButton>
      </GridItem>

      <GridItem gridArea="main">
        <Suspense fallback={<Loading />}>
          <Container
            paddingBlock={3}
            paddingInline={{ base: 0, md: 8, xl: 12 }}
            maxWidth={{ base: 'sm', md: '6xl', lg: '8xl' }}
          >
            {children}
          </Container>
        </Suspense>
      </GridItem>
    </Grid>
  );
}
