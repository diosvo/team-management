'use client';

import { ReactNode, useTransition } from 'react';

import {
  Badge,
  Button,
  DialogTrigger,
  HStack,
  Icon,
  Input,
  InputGroup,
  Separator,
  Spinner,
  Text,
  VStack,
} from '@chakra-ui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  CalendarDays,
  Check,
  CircleUserRound,
  LucideClock9,
  Mail,
  ShieldCheck,
  UserIcon,
  X,
} from 'lucide-react';
import { useForm } from 'react-hook-form';

import {
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogRoot,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field } from '@/components/ui/field';
import Visibility from '@/components/visibility';

import { User } from '@/drizzle/schema';
import { UserRole } from '@/utils/enum';
import { formatDate } from '@/utils/formatter';
import { colorState } from '@/utils/helper';

import { toaster } from '@/components/ui/toaster';
import { updateUserInfo } from '@/features/user/actions/user';
import {
  UpdateUserSchema,
  UpdateUserValues,
} from '@/features/user/schemas/user';

interface InfoItemProps {
  label: string;
  children: ReactNode;
  icon?: React.ElementType;
}

function InfoItem({ icon: IconComponent, label, children }: InfoItemProps) {
  return (
    <HStack gap={1}>
      {IconComponent && <IconComponent size={14} color="GrayText" />}
      <Text color="GrayText">{label}:</Text>
      {children}
    </HStack>
  );
}

interface UserInfoProps {
  user: User;
}

export default function UserInfo({ user }: UserInfoProps) {
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(UpdateUserSchema),
    defaultValues: {
      dob: user.dob as string,
    },
  });

  const onSubmit = (values: UpdateUserValues) => {
    startTransition(async () => {
      const { error, message: description } = await updateUserInfo(
        user.user_id,
        values
      );

      toaster.create({
        type: error ? 'error' : 'success',
        description,
      });
    });
  };

  return (
    <DialogRoot>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          p={1}
          gap={2}
          width="full"
          height="max-content"
          focusVisibleRing="none"
          justifyContent="flex-start"
        >
          <Icon as={UserIcon} size="sm" />
          {user.name}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle display="flex" alignItems="center" gap={2}>
            <CircleUserRound />
            <Text>{user.name}</Text>
          </DialogTitle>
          <DialogDescription>#5</DialogDescription>
        </DialogHeader>
        <DialogBody>
          <VStack align="stretch">
            <VStack gap={2}>
              <HStack width="full">
                <Separator flex="1" />
                <Text flexShrink="0" fontSize="sm" color="GrayText">
                  Personal
                </Text>
                <Separator flex="1" />
              </HStack>
              <VStack width="full" align="stretch">
                <InfoItem label="Email" icon={Mail}>
                  {user.email}
                </InfoItem>
                <InfoItem label="DOB" icon={CalendarDays}>
                  <form onSubmit={handleSubmit(onSubmit)}>
                    <Field
                      width="132px"
                      disabled={isPending}
                      invalid={!!errors.dob}
                    >
                      <InputGroup
                        endElement={
                          isPending ? (
                            <Spinner
                              size="xs"
                              borderWidth="1px"
                              color="GrayText"
                            />
                          ) : (
                            <Icon
                              size="xs"
                              as={!!errors.dob ? X : Check}
                              color={!!errors.dob ? 'tomato' : 'green'}
                            />
                          )
                        }
                      >
                        <Input
                          size="sm"
                          variant="flushed"
                          placeholder="YYYY-MM-DD"
                          {...register('dob')}
                        />
                      </InputGroup>
                    </Field>
                  </form>
                </InfoItem>
              </VStack>
            </VStack>

            <VStack gap={2}>
              <HStack width="full">
                <Separator flex="1" />
                <Text flexShrink="0" fontSize="sm" color="GrayText">
                  Team
                </Text>
                <Separator flex="1" />
              </HStack>
              <VStack width="full" align="stretch">
                <HStack justifyContent="space-between">
                  <Badge
                    variant="surface"
                    width="max-content"
                    borderRadius="full"
                    colorPalette={colorState(user.state)}
                  >
                    {user.state}
                  </Badge>

                  <HStack gap={1}>
                    <ShieldCheck size={14} color="GrayText" />
                    <Text color="GrayText">Roles:</Text>
                    {user.roles.map((role: string) => (
                      <Badge
                        key={role}
                        variant="outline"
                        width="max-content"
                        borderRadius="full"
                      >
                        {role}
                      </Badge>
                    ))}
                  </HStack>
                </HStack>
                {user.join_date && (
                  <InfoItem label="Joined" icon={LucideClock9}>
                    {formatDate(user.join_date)}
                  </InfoItem>
                )}
              </VStack>
            </VStack>

            <Visibility isVisible={user.roles.includes(UserRole.SUPER_ADMIN)}>
              <VStack gap={2}>
                <HStack width="full">
                  <Separator flex="1" />
                  <Text flexShrink="0" fontSize="sm" color="GrayText">
                    System
                  </Text>
                  <Separator flex="1" />
                </HStack>
                <VStack width="full" align="stretch">
                  <InfoItem label="Created">
                    {formatDate(user.created_at)}
                  </InfoItem>
                  <InfoItem label="Last Update">
                    {formatDate(user.updated_at)}
                  </InfoItem>
                </VStack>
              </VStack>
            </Visibility>
          </VStack>
        </DialogBody>
        <DialogCloseTrigger />
      </DialogContent>
    </DialogRoot>
  );
}
