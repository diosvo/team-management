'use client';

import {
  Box,
  Grid,
  GridItem,
  Heading,
  SimpleGrid,
  Text,
} from '@chakra-ui/react';

import { useResponsive } from '@/contexts/responsive-provider';

const Main = () => {
  const { isMobile, isTablet, isDesktop } = useResponsive();

  return (
    <>
      <div>
        {isMobile && 'mobile'}
        {isTablet && 'tablet'}
        {isDesktop && 'desktop'}
      </div>

      <Text fontSize={['sm', 'md', 'lg', 'xl']}>
        This text adapts across breakpoints
      </Text>

      <Heading fontSize={{ base: '24px', md: '36px', lg: '48px' }}>
        Responsive Heading
      </Heading>

      <Grid
        templateColumns={{
          base: '1fr',
          md: 'repeat(2, 1fr)',
          lg: 'repeat(3, 1fr)',
        }}
        gap={4}
        p={4}
      >
        {[1, 2, 3].map((i) => (
          <GridItem key={i}>
            <Box p={4} bg="gray.100">
              Content {i}
            </Box>
          </GridItem>
        ))}
      </Grid>

      <SimpleGrid
        columns={{ base: 1, md: 2, lg: 3 }}
        gap={4}
        p={4}
        maxW="1200px"
        mx="auto"
      >
        {[1, 2, 3].map((i) => (
          <GridItem key={i}>
            <Box p={4} bg="gray.100">
              Content {i}
            </Box>
          </GridItem>
        ))}
      </SimpleGrid>
    </>
  );
};

export default Main;
