'use client';

import {
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogRoot,
  DialogTitle,
} from '@/components/ui/dialog';
import Visibility from '@/components/visibility';
import { User } from '@/drizzle/schema';
import { LOCALE } from '@/utils/constant';
import { UserRole } from '@/utils/enum';
import { colorState } from '@/utils/helper';
import {
  Badge,
  Button,
  DialogTrigger,
  HStack,
  Icon,
  Separator,
  Text,
  VStack,
} from '@chakra-ui/react';
import {
  CalendarDays,
  CircleUserRound,
  LucideClock9,
  Mail,
  ShieldCheck,
  UserIcon,
} from 'lucide-react';

interface UserInfoProps {
  user: User;
}

export default function UserInfo({ user }: UserInfoProps) {
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
                <HStack gap={1}>
                  <Mail size={14} color="GrayText" />
                  <Text color="GrayText">Email:</Text>
                  {user.email}
                </HStack>
                <HStack gap={1}>
                  <CalendarDays size={14} color="GrayText" />
                  <Text color="GrayText">DOB:</Text>
                  {new Date(user.dob as string).toLocaleDateString(LOCALE)}
                </HStack>
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
                <HStack gap={1}>
                  <LucideClock9 size={14} color="GrayText" />
                  <Text color="GrayText">Joined:</Text>
                  {user.join_date.toLocaleDateString(LOCALE)}
                </HStack>
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
                  <HStack gap={1}>
                    <Text color="GrayText">Created:</Text>
                    {user.created_at.toLocaleDateString(LOCALE)}
                  </HStack>
                  <HStack gap={1}>
                    <Text color="GrayText">Last Update:</Text>
                    {user.updated_at.toLocaleDateString(LOCALE)}
                  </HStack>
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
