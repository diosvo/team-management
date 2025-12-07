import PageTitle from '@/components/PageTitle';
import {
  Card,
  Flex,
  Separator,
  SimpleGrid,
  Span,
  Text,
} from '@chakra-ui/react';

export default function DashboardPage() {
  return (
    <>
      <PageTitle title="Dashboard" />
      <SimpleGrid
        columns={{ base: 1, md: 2, lg: 3, xl: 4 }}
        gap={4}
        marginBlock={6}
      >
        <Card.Root size="sm">
          <Card.Header>
            <Card.Title>Upcoming Matches</Card.Title>
            <Card.Description>Next 2 scheduled matches</Card.Description>
          </Card.Header>
          <Card.Body gap="2">
            <Flex alignItems="center" gap={4}>
              <Separator
                size="md"
                height="4"
                orientation="vertical"
                borderColor="tomato"
              />
              <Text>
                <Span textStyle="sm">vs.</Span> Sharks
              </Text>
              <Text marginLeft="auto">Dec 28</Text>
            </Flex>
            <Flex alignItems="center" gap={4}>
              <Separator size="md" orientation="vertical" height="4" />
              <Text>
                <Span textStyle="sm">vs.</Span> Phoenix
              </Text>
              <Text marginLeft="auto">Dec 29</Text>
            </Flex>
          </Card.Body>
        </Card.Root>
      </SimpleGrid>
    </>
  );
}
