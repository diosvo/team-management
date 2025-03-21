'use client';

import { useSearchParams } from 'next/navigation';

import { Link, Text } from '@chakra-ui/react';
import { useCallback, useEffect } from 'react';

export default function EmailConfirmationPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const onSubmit = useCallback(() => {
    console.log(token);
  }, [token]);

  useEffect(() => {
    onSubmit();
  }, [onSubmit]);

  return (
    <div>
      <h1>Email Confirmation</h1>
      <p>
        Your email has been confirmed. You can now close this tab and return to
        the application.
      </p>

      <Text fontWeight="medium">
        <Link textDecoration="underline" href="/login">
          Back to login
        </Link>
      </Text>
    </div>
  );
}
