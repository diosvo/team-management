'use client';

import { useSearchParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';

import {
  Alert,
  Button,
  Container,
  Flex,
  Heading,
  HStack,
  Input,
  Link,
  Separator,
  Stack,
  Text,
  VStack,
} from '@chakra-ui/react';
import { Chrome, CircleX, Facebook } from 'lucide-react';

import { Field } from '@/components/ui/field';

enum PageType {
  Login = 'login',
  Register = 'register',
  ResetPassword = 'reset-password',
}

export default function LoginPage() {
  const searchParams = useSearchParams();

  const [page, setPage] = useState(PageType.Login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (authenticated) {
      // Redirect to previous page or home page
      const next = searchParams.get('next') || '/';
      window.location.href = next;
    }
  }, [authenticated, searchParams]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, type: 'credentials' }),
      });

      if (res.ok) {
        setAuthenticated(true);
      } else {
        setError('Invalid credentials');
      }
    } catch (error) {
      setError('Internal server error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxW="2xl" py="24">
      <VStack mb="6">
        <Heading textAlign="center" size="2xl">
          {
            {
              [PageType.Login]: 'Sign in to your account',
              [PageType.Register]: 'Create a new account',
              [PageType.ResetPassword]: 'Reset password',
            }[page]
          }
        </Heading>
        {page !== PageType.ResetPassword && (
          <HStack textAlign="center" fontSize="sm">
            <Text color="gray.600">
              {
                {
                  [PageType.Login]: "Don't have an account?",
                  [PageType.Register]: 'Already have an account?',
                  [PageType.ResetPassword]: '',
                }[page]
              }
            </Text>
            <Text color="back.900" fontWeight="medium">
              <Link
                textDecoration="underline"
                onClick={() =>
                  setPage(
                    page === PageType.Login ? PageType.Register : PageType.Login
                  )
                }
              >
                Sign {page === PageType.Login ? 'Up' : 'In'}
              </Link>
            </Text>
          </HStack>
        )}
      </VStack>

      {page !== PageType.ResetPassword && (
        <>
          <Stack>
            <Flex gap="3">
              <Button
                flex="1"
                variant="outline"
                rounded="xl"
                onClick={() => {
                  setIsLoading(true);
                  // Implement Facebook login or API call here
                  console.log('Facebook login clicked');
                  setIsLoading(false);
                }}
              >
                <Facebook color="#1877F2" /> Continue with Facebook
              </Button>

              <Button
                flex="1"
                variant="outline"
                rounded="xl"
                onClick={() => {
                  setIsLoading(true);
                  // Implement Google login or API call here
                  console.log('Google login clicked');
                  setIsLoading(false);
                }}
              >
                <Chrome color="#0F9D58" /> Continue with Google
              </Button>
            </Flex>
          </Stack>

          <HStack my="6">
            <Separator flex="1" />
            <Text fontSize="sm" flexShrink="0" color="gray.600">
              Or continue with
            </Text>
            <Separator flex="1" />
          </HStack>
        </>
      )}

      <Stack>
        <form onSubmit={handleSubmit}>
          <Stack gap="5">
            <Field label="Email" required>
              <Input
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEmail(e.target.value)
                }
                type="email"
                autoFocus
              />
            </Field>

            {page !== PageType.ResetPassword && (
              <Field label="Password" required>
                <Input
                  value={password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setPassword(e.target.value)
                  }
                  type="password"
                />
              </Field>
            )}

            {page === PageType.Login && (
              <Text fontWeight="medium">
                <Link
                  fontSize="sm"
                  color="black"
                  textDecoration="underline"
                  href="#"
                  onClick={() => setPage(PageType.ResetPassword)}
                >
                  Forgot your password?
                </Link>
              </Text>
            )}

            {error && (
              <Alert.Root status="error">
                <Alert.Indicator>
                  <CircleX absoluteStrokeWidth />
                </Alert.Indicator>
                <Alert.Title>{error}</Alert.Title>
              </Alert.Root>
            )}

            <Button type="submit" loading={isLoading} rounded="full">
              {
                {
                  [PageType.Login]: 'Sign In',
                  [PageType.Register]: 'Sign Up',
                  [PageType.ResetPassword]:
                    'Send request password instructions',
                }[page]
              }
            </Button>

            {page === PageType.ResetPassword && (
              <Text fontSize="sm" fontWeight="medium" textAlign="center">
                <Link
                  textDecoration="underline"
                  href="#"
                  onClick={() => setPage(PageType.Login)}
                >
                  Go back to sign in
                </Link>
              </Text>
            )}
          </Stack>
        </form>
      </Stack>
    </Container>
  );
}
