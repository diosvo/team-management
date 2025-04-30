import { Box, Flex, Heading, Skeleton } from '@chakra-ui/react';

export default function Loading() {
  return (
    <Box>
      <Heading as="h1" size="xl">
        Team Roster
      </Heading>

      {/* RosterActions skeleton */}
      <Flex my={4} justifyContent="space-between" alignItems="center">
        <Skeleton height="40px" width="250px" />
        <Skeleton height="40px" width="120px" />
      </Flex>

      {/* <RosterTableSkeleton /> */}
    </Box>
  );
}
