'use client';

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
} from '@/features/user/actions/auth';
import {
  LoginSchema,
  LoginValues,
  RegisterSchema,
  RegisterValues,
} from '@/features/user/schemas/auth';
import { Response } from '@/utils/models';

import { DEFAULT_LOGIN_REDIRECT } from '@/routes';
import { signIn } from 'next-auth/react';
import {
  buttonText,
  pageTitle,
  PageType,
  togglePageText,
} from '../_helpers/utils';

export default function LoginPage() {
  const [page, setPage] = useState(PageType.Login);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isPending, startTransition] = useTransition();
  const [response, setResponse] = useState<Response>();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<RegisterValues | LoginValues>({
    resolver: zodResolver(
      page === PageType.Register ? RegisterSchema : LoginSchema
    ),
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

  const onSubmit = (data: RegisterValues | LoginValues) => {
    startTransition(() =>
      page === PageType.Register
        ? registerAction(data as RegisterValues).then(setResponse)
        : loginAction(data as LoginValues).then((data) => {
            // TODO: Add when we add 2FA
            setResponse(data);
          })
    );
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
        {page !== PageType.ResetPassword && (
          <HStack textAlign="center" fontSize={{ base: 'smaller', md: 'md' }}>
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
          <Button
            size={{ base: 'md', md: 'lg' }}
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
      <Stack>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Stack gap="6">
            {page === PageType.Register && (
              <Field
                required
                label="Full Name"
                disabled={isPending}
                invalid={
                  !!(errors as FieldErrors<RegisterValues>).name?.message
                }
                errorText={
                  (errors as FieldErrors<RegisterValues>).name?.message
                }
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

            {response?.message && (
              <Alert.Root status={response.error ? 'error' : 'success'}>
                <Alert.Indicator />
                <AlertTitle>{response.message}</AlertTitle>
              </Alert.Root>
            )}

            <Button
              type="submit"
              rounded="full"
              loading={isPending || isLoading}
            >
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
    </>
  );
}
