'use client';

import { Link, Text } from '@chakra-ui/react';

interface EmailTemplateProps {
  token: string;
}

export default function EmailTemplate({ token }: EmailTemplateProps) {
  const confirmLink = `http://localhost:3000/confirmation-email?token=${token}`;

  return (
    <Text>
      Click &nbsp;<Link href={confirmLink}>here</Link>&nbsp; to confirm email.
    </Text>
  );
}
