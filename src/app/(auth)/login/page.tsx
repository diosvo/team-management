'use client';

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
import {
  buttonText,
  pageTitle,
  PageType,
  togglePageText,
} from '../_helpers/utils';

export default function LoginPage() {
  const [page, setPage] = useState(PageType.Login);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    clearErrors,
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
  const [isPending, startTransition] = useTransition();
  const [response, setResponse] = useState<Response>();

  useEffect(() => {
    reset();
    clearErrors();
  }, [page, reset, clearErrors]);

  const onSubmit = (data: RegisterValues | LoginValues) => {
    startTransition(() => {
      page === PageType.Register
        ? registerAction(data as RegisterValues).then(setResponse)
        : loginAction(data as LoginValues).then(setResponse);
    });
  };

  const handleSocialLogin = useCallback((platform: string) => {
    console.log(`${platform} login clicked`);
  }, []);

  return (
    <Container maxW="xl" p="8" rounded="lg" backgroundColor="white" shadow="lg">
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
          <Flex direction={{ base: 'column', md: 'row' }} gap="3">
            <Button
              flex={{ base: 'none', md: '1' }}
              rounded="xl"
              variant="outline"
              onClick={() => handleSocialLogin('Facebook')}
              disabled
            >
              <Facebook color="#1877F2" /> Continue with Facebook
            </Button>
            <Button
              size={{ base: 'sm', md: 'md' }}
              flex={{ base: 'none', md: '1' }}
              rounded="xl"
              variant="outline"
              onClick={() => handleSocialLogin('Google')}
              disabled
            >
              <Chrome color="#0F9D58" /> Continue with Google
            </Button>
          </Flex>
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

            {response && (
              <Alert.Root status={response.error ? 'error' : 'success'}>
                <Alert.Indicator />
                <AlertTitle>{response.message}</AlertTitle>
              </Alert.Root>
            )}

            <Button type="submit" rounded="full" loading={isPending}>
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
