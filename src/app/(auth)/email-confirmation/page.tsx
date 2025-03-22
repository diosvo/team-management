'use client';

import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import {
  Alert,
  AlertTitle,
  Link,
  Spinner,
  Text,
  VStack,
} from '@chakra-ui/react';

import { newVerification } from '@/features/user/actions/verification-token';
import { Response, ResponseFactory } from '@/utils/response';

export default function EmailConfirmationPage() {
  const [response, setResponse] = useState<Response>();

  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const onSubmit = useCallback(async () => {
    if (!token) {
      setResponse(ResponseFactory.error('Missing token to verify!'));
      return;
    }

    newVerification(token as string).then(setResponse);
  }, [token]);

  useEffect(() => {
    onSubmit();
  }, [onSubmit]);

  return (
    <VStack gap="6" alignItems="center" justifyContent="center">
      {response == null ? (
        <>
          <Text color="gray.600">Confirming your email address...</Text>
          <Spinner size="lg" color="colorPalette.600" colorPalette="blue" />
        </>
      ) : (
        <>
          <Text color="gray.600">{response?.error ? 'Hmmm...' : 'Yeah!'}</Text>
          <Alert.Root status={response?.error ? 'error' : 'success'}>
            <Alert.Indicator />
            <AlertTitle>{response?.message}</AlertTitle>
          </Alert.Root>
        </>
      )}
      <Text fontWeight="medium">
        <Link textDecoration="underline" href="/login">
          Go to login
        </Link>
      </Text>
    </VStack>
  );
}
