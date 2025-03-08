'use client';

import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState, useTransition } from 'react';

import {
  Alert,
  AlertTitle,
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
import { Chrome, Facebook } from 'lucide-react';
import { useForm } from 'react-hook-form';

import { Field } from '@/components/ui/field';
import { login } from '@/features/auth/actions/login';
import { LoginSchema, LoginValues } from '@/features/auth/schemas/auth';
import { Response } from '@/utils/models';
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
  const [isPending, startTransition] = useTransition();

  const [page, setPage] = useState(PageType.Login);
  const [authenticated, setAuthenticated] = useState<boolean>(false);
  const [response, setResponse] = useState<Response>();

  useEffect(() => {
    if (authenticated) {
      const next = searchParams.get('next') || '/';
      window.location.href = next;
    }
  }, [authenticated, searchParams]);

  const onSubmit = (data: LoginValues) => {
    startTransition(() => {
      login(data).then(setResponse);
    });
  };

  const handleSocialLogin = useCallback((platform: string) => {
    console.log(`${platform} login clicked`);
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
              disabled={isPending}
              invalid={!!errors.email?.message}
              errorText={errors.email?.message}
            >
              <Input type="email" autoFocus {...register('email')} />
            </Field>

            {page !== PageType.ResetPassword && (
              <Field
                required
                label="Password"
                disabled={isPending}
                invalid={!!errors.password?.message}
                errorText={errors.password?.message}
              >
                <Input type="password" {...register('password')} />
              </Field>
            )}

            {page === PageType.Login && (
              <Text fontWeight="medium">
                <Link
                  fontSize="sm"
                  textDecoration="underline"
                  onClick={() => setPage(PageType.ResetPassword)}
                >
                  Forgot your password?
                </Link>
              </Text>
            )}

            {response && (
              <Alert.Root status={response.error ? 'error' : 'success'}>
                <Alert.Indicator />
                <AlertTitle>{response.message}</AlertTitle>
              </Alert.Root>
            )}

            <Button type="submit" loading={isPending} rounded="full">
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
