'use client';

import { useEffect, useState, useTransition } from 'react';

import {
  Button,
  Heading,
  Input,
  Link,
  Stack,
  Text,
  VStack,
} from '@chakra-ui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { FieldErrors, useForm } from 'react-hook-form';

import { Alert } from '@/components/ui/alert';
import { Field } from '@/components/ui/field';

import { Response } from '@/utils/response';
import { buttonText, Page, pageTitle } from '../_helpers/utils';

import {
  login as loginAction,
  requestResetPassword,
} from '@/features/user/actions/auth';
import { LoginSchema, LoginValues } from '@/features/user/schemas/auth';

export default function LoginPage() {
  const [page, setPage] = useState(Page.Login);
  const [isPending, startTransition] = useTransition();
  const [response, setResponse] = useState<Response>();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  useEffect(() => {
    reset();
    setResponse(undefined);
  }, [page, reset, setResponse]);

  const onSubmit = (data: LoginValues) => {
    startTransition(() => {
      const action =
        page === Page.Login ? loginAction(data) : requestResetPassword(data);

      return action.then(setResponse);
    });
  };

  return (
    <>
      <VStack mb="6">
        <Heading textAlign="center" size={{ base: 'xl', md: '2xl' }}>
          {pageTitle[page]}
        </Heading>
      </VStack>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack gap="6">
          <Field
            required
            label="Email"
            disabled={isPending}
            invalid={!!errors.email}
            errorText={errors.email?.message}
          >
            <Input type="email" autoFocus {...register('email')} />
          </Field>

          {page === Page.Login && (
            <>
              <Field
                required
                label="Password"
                disabled={isPending}
                invalid={!!(errors as FieldErrors<LoginValues>).password}
                errorText={
                  (errors as FieldErrors<LoginValues>).password?.message
                }
              >
                <Input
                  type="password"
                  placeholder="******"
                  {...register('password')}
                />
              </Field>

              <Text fontWeight="medium">
                <Link
                  fontSize="sm"
                  textDecoration="underline"
                  onClick={() => setPage(Page.ResetPassword)}
                >
                  Forgot your password?
                </Link>
              </Text>
            </>
          )}

          {response && (
            <Alert
              status={response.error ? 'error' : 'success'}
              title={response.message}
            />
          )}

          <Button type="submit" rounded="full" loading={isPending}>
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
