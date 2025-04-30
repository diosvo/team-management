import {
  Box,
  Center,
  Grid,
  GridItem,
  Separator,
  Spinner,
  Text,
  VStack,
} from '@chakra-ui/react';

import { Suspense } from 'react';
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
      <GridItem gridArea="header" bg="white">
        <Header />
        <Separator />
      </GridItem>

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

      <GridItem gridArea="main">
        <Suspense
          fallback={
            <Center h="full">
              <VStack gap={4}>
                <Spinner
                  size="xl"
                  color="tomato"
                  css={{ '--spinner-track-color': 'colors.gray.200' }}
                />
                <Text fontSize="xl">Loading...</Text>
              </VStack>
            </Center>
          }
        >
          <Box p={4}>{children}</Box>
        </Suspense>
      </GridItem>
    </Grid>
  );
}
