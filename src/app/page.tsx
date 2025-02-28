'use client';

import {
  Box,
  Button,
  Grid,
  GridItem,
  Heading,
  SimpleGrid,
  Text,
} from '@chakra-ui/react';

import TextEditor from '@/components/text-editor';
import { ColorModeButton } from '@/components/ui/color-mode';
import { useResponsive } from '@/contexts/responsive-provider';
import { useState } from 'react';

const Main = () => {
  const { isMobile, isTablet, isDesktop } = useResponsive();

  return (
    <>
      <ColorModeButton />
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

      {/* RBAC Content Section */}
      <Box
        position="relative"
        p={4}
        border="1px solid"
        borderColor="gray.200"
        my={4}
      >
        {(() => {
          const [content, setContent] = useState('Hello!');
          const [userRole, setUserRole] = useState('read'); // For demo
          const [isEditing, setIsEditing] = useState(false);

          // Toggle role for demo purposes
          const toggleRole = () =>
            setUserRole(userRole === 'read' ? 'write' : 'read');

          return (
            <>
              <Box mb={2}>
                <Text>Current Role: {userRole}</Text>
                <Button onClick={toggleRole} size="sm" mr={2}>
                  Toggle Role
                </Button>
                {userRole === 'write' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsEditing(true)}
                  >
                    Edit
                  </Button>
                )}
              </Box>

              <TextEditor
                editable={userRole === 'write' && isEditing}
                content={content}
                onCancel={() => {
                  setIsEditing(false);
                }}
                onSave={(newContent) => {
                  setContent(newContent);
                  setIsEditing(false);
                }}
              />
            </>
          );
        })()}
      </Box>
    </>
  );
};

export default Main;
