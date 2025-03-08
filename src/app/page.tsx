'use client';

import { useState } from 'react';

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
import { toaster } from '@/components/ui/toaster';
import { useResponsive } from '@/contexts/responsive-provider';

import { executeRule, getRule } from '@/features/rule/actions/rule';
import { RuleValues } from '@/features/rule/schemas/rule';
import Link from 'next/link';

export default function MainPage() {
  const { isMobile, isTablet, isDesktop } = useResponsive();
  const [content, setContent] = useState('');
  const [userRole, setUserRole] = useState('read'); // For demo
  const [isEditing, setIsEditing] = useState(false);

  async function onSubmit(values: RuleValues) {
    const { error, message: description } = await executeRule(values);

    if (error) {
      toaster.error({ description });
    } else {
      setContent(values.content);
      setIsEditing(false);
      toaster.success({ description });
    }
  }

  return (
    <>
      <ColorModeButton />
      <Button variant="outline" asChild>
        <Link href="/login" color="white">
          Login
        </Link>
      </Button>

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
            <Button
              size="sm"
              variant="outline"
              colorScheme="blue"
              onClick={async () => {
                const rule = await getRule(
                  '8c309243-f194-49df-b00a-5b2fb2bab727'
                );

                if (rule) {
                  setContent(rule.content);
                }
              }}
            >
              Call
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
                team_id: '8c309243-f194-49df-b00a-5b2fb2bab727',
              })
            }
          />
        </>
      </Box>
    </>
  );
}
