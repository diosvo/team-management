'use client';

import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

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
import { zodResolver } from '@hookform/resolvers/zod';
import { Chrome, CircleX, Facebook } from 'lucide-react';
import { useForm } from 'react-hook-form';

import { Field } from '@/components/ui/field';
import { LoginSchema, LoginValues } from '../_helpers/schemas';
import {
  buttonText,
  pageTitle,
  PageType,
  togglePageText,
} from '../_helpers/utils';

export default function LoginPage() {
  const searchParams = useSearchParams();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const [page, setPage] = useState(PageType.Login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (authenticated) {
      const next = searchParams.get('next') || '/';
      window.location.href = next;
    }
  }, [authenticated, searchParams]);

  const onSubmit = (data: LoginValues) => {
    console.log(data);
    console.log(errors);
  };

  // const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  //   e.preventDefault();
  //   setIsLoading(true);
  //   try {
  //     const res = await fetch('/api/login', {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify({ email, password, type: 'credentials' }),
  //     });
  //     res.ok ? setAuthenticated(true) : setError('Invalid credentials');
  //   } catch {
  //     setError('Internal server error');
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  const handleSocialLogin = useCallback((platform: string) => {
    setIsLoading(true);
    console.log(`${platform} login clicked`);
    setIsLoading(false);
  }, []);

  return (
    <Container maxW="2xl" py="24">
      <VStack mb="6">
        <Heading textAlign="center" size="2xl">
          {pageTitle[page]}
        </Heading>
        {page !== PageType.ResetPassword && (
          <HStack textAlign="center" fontSize="sm">
            <Text color="gray.600">{togglePageText[page]}</Text>
            <Text fontWeight="medium">
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
                onClick={() => handleSocialLogin('Facebook')}
              >
                <Facebook color="#1877F2" /> Continue with Facebook
              </Button>
              <Button
                flex="1"
                variant="outline"
                rounded="xl"
                onClick={() => handleSocialLogin('Google')}
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
        <form onSubmit={handleSubmit(onSubmit)}>
          <Stack gap="6">
            <Field
              required
              label="Email"
              invalid={!!errors.email?.message}
              errorText={errors.email?.message}
            >
              <Input
                type="email"
                value={email}
                autoFocus
                {...register('email')}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEmail(e.target.value)
                }
              />
            </Field>

            {page !== PageType.ResetPassword && (
              <Field
                required
                label="Password"
                invalid={!!errors.password?.message}
                errorText={errors.password?.message}
              >
                <Input
                  type="password"
                  value={password}
                  {...register('password')}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setPassword(e.target.value)
                  }
                />
              </Field>
            )}

            {page === PageType.Login && (
              <Text fontWeight="medium">
                <Link
                  fontSize="sm"
                  color="black"
                  textDecoration="underline"
                  onClick={() => setPage(PageType.ResetPassword)}
                >
                  Forgot your password?
                </Link>
              </Text>
            )}

            {error && (
              <Alert.Root status="error">
                <Alert.Indicator>
                  <CircleX />
                </Alert.Indicator>
                <Alert.Title>{error}</Alert.Title>
              </Alert.Root>
            )}

            <Button type="submit" loading={isLoading} rounded="full">
              {buttonText[page]}
            </Button>

            {page === PageType.ResetPassword && (
              <Text fontSize="sm" fontWeight="medium" textAlign="center">
                <Link
                  textDecoration="underline"
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
