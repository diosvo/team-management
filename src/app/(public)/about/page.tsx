import PageTitle from '@/components/page-title';
import {
  Box,
  Center,
  Container,
  HStack,
  IconButton,
  Link,
  List,
  Separator,
  Text,
  Timeline,
  VStack,
} from '@chakra-ui/react';
import { Facebook, Infinity, Instagram, Music2 } from 'lucide-react';
import { Timestamp } from '../../(protected)/_helpers/Timestamp';

export default function LandingPage() {
  return (
    <Box>
      {/* <Header>
        <Button>{user ? 'Go to Dashboard' : 'Login'}</Button>
      </Header> */}
      <VStack padding={8}>
        <Container maxWidth="4xl">
          <VStack gap={6}>
            <PageTitle size="4xl">Tiny but mighty</PageTitle>
            <Text>Our journey of dedication, teamwork, and excellence</Text>

            <HStack gap={4}>
              <Link href="#">
                <IconButton
                  variant="surface"
                  aria-label="Facebook"
                  colorPalette="blue"
                  rounded="full"
                >
                  <Facebook />
                </IconButton>
              </Link>
              <Link href="#">
                <IconButton
                  variant="surface"
                  aria-label="Instagram"
                  colorPalette="orange"
                  rounded="full"
                >
                  <Instagram />
                </IconButton>
              </Link>
              <Link href="#">
                <IconButton
                  variant="surface"
                  aria-label="Tiktok"
                  rounded="full"
                >
                  <Music2 />
                </IconButton>
              </Link>
            </HStack>
            <PageTitle marginBlock={8}>Our Journey</PageTitle>
          </VStack>

          <Timeline.Root size="xl" variant="outline">
            <Timeline.Item>
              <Timeline.Content flex="1" alignItems="flex-end">
                <Timeline.Title>Feb 2024</Timeline.Title>
              </Timeline.Content>
              <Timeline.Connector>
                <Timeline.Separator />
                <Timeline.Indicator />
              </Timeline.Connector>
              <Timeline.Content flex="1">
                <Timeline.Title>"Good things take time"</Timeline.Title>
              </Timeline.Content>
            </Timeline.Item>

            <Timeline.Item>
              <Timeline.Content flex="1" alignItems="flex-end">
                <Timeline.Title>2025</Timeline.Title>
              </Timeline.Content>
              <Timeline.Connector>
                <Timeline.Separator />
                <Timeline.Indicator />
              </Timeline.Connector>
              <Timeline.Content flex="1">
                <Timeline.Title>First achievements</Timeline.Title>
                <List.Root fontSize="sm" marginLeft="4">
                  <List.Item>Runner up 3x3 VBL</List.Item>
                  <List.Item>
                    Bronze medal - Ocean Basketball League 5x5
                  </List.Item>
                </List.Root>
              </Timeline.Content>
            </Timeline.Item>

            <Timeline.Item>
              <Timeline.Content flex="1" />
              <Timeline.Connector>
                <Timeline.Separator />
                <Timeline.Indicator>
                  <Infinity />
                </Timeline.Indicator>
              </Timeline.Connector>
              <Timeline.Content flex="1" />
            </Timeline.Item>
          </Timeline.Root>
        </Container>
      </VStack>

      <Separator />
      <Center marginTop={4} fontSize="sm">
        &copy; <Timestamp /> Saigon Rovers Portal. Built with passion and
        dedication.
      </Center>
    </Box>
  );
}
