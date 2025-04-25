'use client';

import { ReactNode } from 'react';

import { Badge, HStack, Separator, Text, VStack } from '@chakra-ui/react';
import {
  CalendarDays,
  CircleUserRound,
  LucideClock9,
  Mail,
  ShieldCheck,
} from 'lucide-react';

import {
  DialogBody,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import Visibility from '@/components/visibility';

import { User } from '@/drizzle/schema';
import { formatDate } from '@/utils/formatter';
import { colorState } from '@/utils/helper';

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
  isAdmin: boolean;
  user: User;
}

export default function UserInfo({ isAdmin, user }: UserInfoProps) {
  return (
    <>
      <DialogHeader>
        <DialogTitle display="flex" alignItems="center" gap={1}>
          <CircleUserRound />
          <Text>{user.name}</Text>
        </DialogTitle>
        <DialogDescription>#5</DialogDescription>
      </DialogHeader>
      <DialogBody>
        <VStack align="stretch">
          <VStack>
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
                {formatDate(user.dob)}
              </InfoItem>
            </VStack>
          </VStack>
          <VStack>
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
                    <Badge key={role} variant="outline" borderRadius="full">
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
          <Visibility isVisible={isAdmin}>
            <VStack>
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
    </>
  );
}
