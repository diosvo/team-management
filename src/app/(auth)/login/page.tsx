'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';

import { Button, Heading, Input, Link, VStack } from '@chakra-ui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { FieldErrors, useForm } from 'react-hook-form';

import { Alert } from '@/components/ui/alert';
import { Field } from '@/components/ui/field';

import { getDefaults } from '@/lib/zod';
import { DEFAULT_LOGIN_REDIRECT } from '@/routes';
import { Response } from '@/utils/response';
import { buttonText, Page, pageTitle } from '../_helpers/utils';

import {
  login as loginAction,
  requestResetPassword,
} from '@/features/user/actions/auth';
import { LoginSchema, LoginValues } from '@/features/user/schemas/auth';

export default function LoginPage() {
  const [page, setPage] = useState(Page.Login);
  const [response, setResponse] = useState<Response>();

  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const callbackUrl = searchParams.get('callbackUrl') || DEFAULT_LOGIN_REDIRECT;

  const {
    register,
    handleSubmit,
    formState: { isValid, errors },
    reset,
  } = useForm({
    resolver: zodResolver(LoginSchema),
    defaultValues: getDefaults(LoginSchema),
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
      <Heading
        size={{ base: 'xl', md: '2xl' }}
        marginBottom={6}
        textAlign="center"
      >
        {pageTitle[page]}
      </Heading>

      <VStack
        as="form"
        gap={4}
        alignItems="stretch"
        onSubmit={handleSubmit(onSubmit)}
      >
        <>
          <Field
            required
            label="Email"
            disabled={isPending}
            invalid={!!errors.email}
            errorText={errors.email?.message}
          >
            <Input
              type="email"
              autoFocus
              autoComplete="email"
              {...register('email')}
            />
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

              <Link
                fontSize="sm"
                fontWeight={500}
                textDecoration="underline"
                onClick={() => setPage(Page.ResetPassword)}
              >
                Forgot your password?
              </Link>
            </>
          )}

          {response && (
            <Alert
              status={response.error ? 'error' : 'success'}
              title={response.message}
            />
          )}

          {page === Page.Login && (
            <input type="hidden" name="redirectTo" value={callbackUrl} />
          )}
          <Button
            type="submit"
            borderRadius="full"
            loadingText="Directing..."
            loading={isPending}
            disabled={!isValid || isPending}
          >
            {buttonText[page]}
          </Button>

          {page === Page.ResetPassword && (
            <Link
              fontSize="sm"
              alignSelf="center"
              fontWeight={500}
              textDecoration="underline"
              onClick={() => setPage(Page.Login)}
            >
              Go back to sign in
            </Link>
          )}
        </>
      </VStack>
    </>
  );
}
