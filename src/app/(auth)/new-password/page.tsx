'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useTransition } from 'react';

import { Button, Heading, Input, Link, Stack, VStack } from '@chakra-ui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { Alert } from '@/components/ui/alert';
import { Field } from '@/components/ui/field';

import { getDefaults } from '@/lib/zod';
import { LOGIN_PATH } from '@/routes';
import { Response } from '@/utils/response';

import { changePassword } from '@/features/user/actions/auth';
import { PasswordSchema, PasswordValue } from '@/features/user/schemas/auth';

export default function NewPasswordPage() {
  const {
    register,
    reset,
    handleSubmit,
    formState: { isValid, errors },
  } = useForm({
    mode: 'onChange',
    resolver: zodResolver(PasswordSchema),
    defaultValues: getDefaults(PasswordSchema),
  });

  const [response, setResponse] = useState<Response>();
  const [isPending, startTransition] = useTransition();

  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const onSubmit = (value: PasswordValue) => {
    startTransition(() => {
      changePassword(value, token as string).then((response: Response) => {
        setResponse(response);

        if (!response.error) reset();
      });
    });
  };

  return (
    <VStack gap="6" alignItems="center">
      <Heading textAlign="center" size={{ base: 'xl', md: '2xl' }}>
        Change password
      </Heading>
      <Stack width="full">
        <form onSubmit={handleSubmit(onSubmit)}>
          <Stack gap="6">
            <Field
              required
              label="Password"
              disabled={isPending}
              invalid={Boolean(errors.password)}
              errorText={errors.password?.message}
            >
              <Input
                autoFocus
                type="password"
                placeholder="******"
                {...register('password')}
              />
            </Field>
            {response && (
              <Alert
                status={response.error ? 'error' : 'success'}
                title={response.message}
              />
            )}
            <Button
              type="submit"
              width="full"
              borderRadius="full"
              loadingText="Submitting..."
              loading={isPending}
              disabled={!isValid || isPending}
            >
              Submit
            </Button>
          </Stack>
        </form>
      </Stack>
      <Link
        fontSize="sm"
        fontWeight="500"
        variant="underline"
        href={LOGIN_PATH}
      >
        Go to login
      </Link>
    </VStack>
  );
}
