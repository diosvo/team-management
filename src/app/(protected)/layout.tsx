import { Suspense } from 'react';

import { Grid, GridItem, Separator } from '@chakra-ui/react';

import Loading from '@/components/loading';
import Header from './_components/header';
import Sidebar from './_components/sidebar';

export default function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Grid
      h="100vh"
      templateRows="auto 1fr"
      templateColumns="224px 1fr"
      templateAreas={`
        "header header"
        "sidebar main"
      `}
    >
      {/* Header */}
      <GridItem gridArea="header" bg="white">
        <Header />
        <Separator />
      </GridItem>

      {/* Sidebar */}
      <GridItem
        gridArea="sidebar"
        w="224px"
        bg="white"
        borderRightWidth="1px"
        borderRightStyle="solid"
        borderRightColor="gray.300"
      >
        <Sidebar />
      </GridItem>

      {/* Main Content */}
      <GridItem gridArea="main" p="4" overflow="auto">
        <Suspense fallback={<Loading />}>{children}</Suspense>
      </GridItem>
    </Grid>
  );
}
