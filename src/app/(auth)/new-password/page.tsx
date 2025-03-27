'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';

import {
  Alert,
  AlertTitle,
  Button,
  Heading,
  Input,
  Link,
  Stack,
  Text,
  VStack,
} from '@chakra-ui/react';
import { zodResolver } from '@hookform/resolvers/zod';

import { Field } from '@/components/ui/field';
import { changePassword } from '@/features/user/actions/auth';
import { PasswordSchema, PasswordValue } from '@/features/user/schemas/auth';
import { LOGIN_PATH } from '@/routes';
import { Response } from '@/utils/response';

export default function NewPasswordPage() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PasswordValue>({
    resolver: zodResolver(PasswordSchema),
    defaultValues: {
      password: '',
    },
  });

  const [response, setResponse] = useState<Response>();
  const [isPending, startTransition] = useTransition();

  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const onSubmit = (value: PasswordValue) => {
    startTransition(() => {
      changePassword(value, token as string).then(setResponse);
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
              <Alert.Root status={response?.error ? 'error' : 'success'}>
                <Alert.Indicator />
                <AlertTitle>{response?.message}</AlertTitle>
              </Alert.Root>
            )}
            <Button
              type="submit"
              width="full"
              rounded="full"
              loadingText="Submitting..."
              loading={isPending}
            >
              Submit
            </Button>
          </Stack>
        </form>
      </Stack>
      <Text fontWeight="medium">
        <Link textDecoration="underline" href={LOGIN_PATH}>
          Go to login
        </Link>
      </Text>
    </VStack>
  );
}
