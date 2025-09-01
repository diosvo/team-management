'use client';

import NextLink from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState, useTransition } from 'react';

import {
  Button,
  Link as ChakraLink,
  Heading,
  Input,
  List,
  VStack,
} from '@chakra-ui/react';
import { CircleCheck, CircleDashed } from 'lucide-react';

import { Alert } from '@/components/ui/alert';
import { Field } from '@/components/ui/field';

import { LOGIN_PATH } from '@/routes';
import { Response } from '@/utils/response';

import { changePassword } from '@/features/user/actions/auth';

const PASSWORD_RULES = [
  {
    text: 'Be at least 8 characters long',
    regex: /.{8,}/,
  },
  {
    text: 'Be at most 128 characters long',
    regex: /^.{8,128}$/,
  },
  {
    text: 'Contain at least one letter',
    regex: /[a-zA-Z]/,
  },
  {
    text: 'Contain at least one number',
    regex: /[0-9]/,
  },
  {
    text: 'Contain at least one special character',
    regex: /[^a-zA-Z0-9]/,
  },
] as const;

export default function NewPasswordPage() {
  const [password, setPassword] = useState<string>('');
  const [response, setResponse] = useState<Response>();
  const [isPending, startTransition] = useTransition();

  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const isValid = PASSWORD_RULES.every((rule) => rule.regex.test(password));

  const onSubmit = (value: string) => {
    startTransition(async () => {
      const { error, message } = await changePassword(value, token);

      setResponse({ error, message });
      if (!error) setPassword('');
    });
  };

  return (
    <VStack gap={6}>
      <Heading textAlign="center" size={{ base: 'xl', md: '2xl' }}>
        Change password
      </Heading>
      <VStack
        as="form"
        width="full"
        gap={6}
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(password);
        }}
      >
        <>
          <Field required label="Password" disabled={isPending}>
            <Input
              autoFocus
              value={password}
              type="password"
              placeholder="******"
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>

          <List.Root variant="plain" alignSelf="self-start">
            {PASSWORD_RULES.map((rule, index) => {
              const matched = rule.regex.test(password);
              return (
                <List.Item
                  key={index}
                  fontSize="sm"
                  color={matched ? 'inherit' : 'GrayText'}
                >
                  <List.Indicator
                    asChild
                    color={matched ? 'green.500' : 'gray.400'}
                  >
                    {matched ? (
                      <CircleCheck size={14} />
                    ) : (
                      <CircleDashed size={14} />
                    )}
                  </List.Indicator>
                  {rule.text}
                </List.Item>
              );
            })}
          </List.Root>
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
        </>
      </VStack>
      <ChakraLink
        fontSize="sm"
        fontWeight={500}
        textDecoration="underline"
        asChild
      >
        <NextLink href={LOGIN_PATH}>Go back to sign in</NextLink>
      </ChakraLink>
    </VStack>
  );
}
