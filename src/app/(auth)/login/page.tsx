'use client';

import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState, useTransition } from 'react';

import {
  Alert,
  AlertTitle,
  Button,
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
import { Chrome } from 'lucide-react';
import { FieldErrors, useForm } from 'react-hook-form';

import { Field } from '@/components/ui/field';
import {
  login as loginAction,
  register as registerAction,
  requestResetPassword,
} from '@/features/user/actions/auth';
import {
  AuthValues,
  EmailValue,
  LoginValues,
  RegisterValues,
} from '@/features/user/schemas/auth';
import { DEFAULT_LOGIN_REDIRECT } from '@/routes';
import { Response, ResponseFactory } from '@/utils/response';

import {
  buttonText,
  FormValues,
  Page,
  pageTitle,
  togglePageText,
} from '../_helpers/utils';

export default function LoginPage() {
  const [page, setPage] = useState(Page.Login);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isPending, startTransition] = useTransition();
  const [response, setResponse] = useState<Response>();

  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AuthValues>({
    resolver: zodResolver(FormValues[page]),
    defaultValues: {
      email: '',
      password: '',
      name: '',
    },
  });

  useEffect(() => {
    reset();
    setResponse(undefined);
  }, [page, reset, setResponse]);

  useEffect(() => {
    if (error) {
      // Show an error message from AuthError
      const messages = {
        OAuthAccountNotLinked: 'Email already in use!',
      } as Record<string, string>;
      setResponse(ResponseFactory.error(messages[error]));
    }
  }, [error, setResponse]);

  const onSubmit = (data: AuthValues) => {
    startTransition(() => {
      if (page === Page.Register) {
        return registerAction(data as RegisterValues).then(setResponse);
      }

      if (page === Page.Login) {
        loginAction(data as LoginValues).then((data) => {
          // TODO: Add when we add 2FA
          setResponse(data);
        });
      }

      if (page === Page.ResetPassword) {
        return requestResetPassword(data as EmailValue).then(setResponse);
      }
    });
  };

  const handleSocialLogin = useCallback(
    async (provider: 'google' | 'facebook') => {
      try {
        setIsLoading(true);
        await signIn(provider, {
          redirectTo: DEFAULT_LOGIN_REDIRECT,
        });
      } catch {
        setIsLoading(false);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return (
    <>
      <VStack mb="6">
        <Heading textAlign="center" size={{ base: 'xl', md: '2xl' }}>
          {pageTitle[page]}
        </Heading>
        {page !== Page.ResetPassword && (
          <HStack textAlign="center" fontSize={{ base: 'smaller', md: 'md' }}>
            <Text color="gray.600">{togglePageText[page]}</Text>
            <Text fontWeight="medium">
              <Link
                textDecoration="underline"
                onClick={() =>
                  setPage(page === Page.Login ? Page.Register : Page.Login)
                }
              >
                Sign {page === Page.Login ? 'Up' : 'In'}
              </Link>
            </Text>
          </HStack>
        )}
      </VStack>

      {page !== Page.ResetPassword && (
        <>
          <Button
            width="full"
            rounded="xl"
            variant="outline"
            disabled={isPending || isLoading}
            onClick={() => handleSocialLogin('google')}
          >
            <Chrome color="#0F9D58" /> Continue with Google
          </Button>
          <HStack my="6">
            <Separator flex="1" />
            <Text fontSize="sm" flexShrink="0" color="gray.600">
              OR
            </Text>
            <Separator flex="1" />
          </HStack>
        </>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack gap="6">
          {page === Page.Register && (
            <Field
              required
              label="Full Name"
              disabled={isPending}
              invalid={!!(errors as FieldErrors<RegisterValues>).name?.message}
              errorText={(errors as FieldErrors<RegisterValues>).name?.message}
            >
              <Input {...register('name')} />
            </Field>
          )}

          <Field
            required
            label="Email"
            disabled={isPending}
            invalid={!!errors.email?.message}
            errorText={errors.email?.message}
          >
            <Input type="email" autoFocus {...register('email')} />
          </Field>

          {page !== Page.ResetPassword && (
            <Field
              required
              label="Password"
              disabled={isPending}
              invalid={
                !!(errors as FieldErrors<RegisterValues>).password?.message
              }
              errorText={
                (errors as FieldErrors<RegisterValues>).password?.message
              }
            >
              <Input
                type="password"
                placeholder="******"
                {...register('password')}
              />
            </Field>
          )}

          {page === Page.Login && (
            <Text fontWeight="medium">
              <Link
                fontSize="sm"
                textDecoration="underline"
                onClick={() => setPage(Page.ResetPassword)}
              >
                Forgot your password?
              </Link>
            </Text>
          )}

          {response?.message && (
            <Alert.Root status={response.error ? 'error' : 'success'}>
              <Alert.Indicator />
              <AlertTitle>{response.message}</AlertTitle>
            </Alert.Root>
          )}

          <Button type="submit" rounded="full" loading={isPending || isLoading}>
            {buttonText[page]}
          </Button>

          {page === Page.ResetPassword && (
            <Text fontSize="sm" fontWeight="medium" textAlign="center">
              <Link
                textDecoration="underline"
                onClick={() => setPage(Page.Login)}
              >
                Go back to sign in
              </Link>
            </Text>
          )}
        </Stack>
      </form>
    </>
  );
}
