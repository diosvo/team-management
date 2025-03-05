'use client';

import { useState } from 'react';
import { z } from 'zod';

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

import { toaster } from '@/components/ui/toaster';
import { createRule } from '@/features/rule/actions/rule';
import { ruleSchema } from '@/features/rule/schemas/rule';

const Main = () => {
  const { isMobile, isTablet, isDesktop } = useResponsive();
  const [content, setContent] = useState('Hello!');
  const [userRole, setUserRole] = useState('read'); // For demo
  const [isEditing, setIsEditing] = useState(false);

  async function onSubmit(values: z.infer<typeof ruleSchema>) {
    const result = await createRule(values);
    const { error, message: description } = result;

    if (error) {
      toaster.error({ description });
    } else {
      setContent(values.content);
      setIsEditing(false);
      toaster.success({ description });
    }

    return result;
  }

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
        <>
          <Box mb={2}>
            <Text>Current Role: {userRole}</Text>
            <Button
              onClick={() =>
                setUserRole(userRole === 'read' ? 'write' : 'read')
              }
              size="sm"
              mr={2}
            >
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
            onCancel={() => setIsEditing(false)}
            onSave={async (newContent) =>
              await onSubmit({
                content: newContent,
                team_id: '3234d8a0-dd24-438d-a15e-27c64579eeb1',
              })
            }
          />
        </>
      </Box>
    </>
  );
};

export default Main;
