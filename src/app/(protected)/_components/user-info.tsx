'use client';

import { ReactNode, RefObject } from 'react';

import {
  Badge,
  HStack,
  Icon,
  IconButton,
  Separator,
  Text,
  VStack,
} from '@chakra-ui/react';
import { formatDistanceToNow } from 'date-fns';
import {
  CalendarDays,
  CircleUserRound,
  LucideClock9,
  Mail,
  Pencil,
  ShieldCheck,
} from 'lucide-react';

import {
  dialog,
  DialogBody,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import Visibility from '@/components/visibility';

import { User } from '@/drizzle/schema';
import { formatDate, formatDatetime } from '@/utils/formatter';
import { colorState } from '@/utils/helper';

import { Tooltip } from '@/components/ui/tooltip';
import EditProfile from './edit-profile';

export interface UserInfoProps {
  isAdmin: boolean;
  user: User;
  selectionRef: RefObject<Nullable<HTMLDivElement>>;
}

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

export default function UserInfo({
  isAdmin,
  user,
  selectionRef,
}: UserInfoProps) {
  const openEditProfileDialog = () => {
    dialog.update('profile', {
      children: (
        <EditProfile
          user={user}
          isAdmin={isAdmin}
          selectionRef={selectionRef}
        />
      ),
      closeOnInteractOutside: false,
    });
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle display="flex" alignItems="center" gap={2}>
          <Tooltip content="Edit profile" positioning={{ placement: 'top' }}>
            <Icon _hover={{ cursor: 'pointer', color: 'tomato' }}>
              <CircleUserRound onClick={openEditProfileDialog} />
            </Icon>
          </Tooltip>
          <Text>{user.name}</Text>
        </DialogTitle>
        {user.details.jersey_number && (
          <DialogDescription>#{user.details.jersey_number}</DialogDescription>
        )}
      </DialogHeader>
      <DialogBody>
        <VStack align="stretch">
          <VStack>
            <HStack width="full">
              <Separator flex="1" />
              <Text flexShrink="0" fontSize="sm" color="GrayText">
                Personal
              </Text>
              <Tooltip
                content="Edit profile"
                positioning={{ placement: 'top' }}
              >
                <IconButton
                  size="2xs"
                  variant="ghost"
                  aria-label="Edit user information"
                  onClick={openEditProfileDialog}
                >
                  <Pencil />
                </IconButton>
              </Tooltip>
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
                  rounded="full"
                  colorPalette={colorState(user.state)}
                >
                  {user.state}
                </Badge>
                <HStack>
                  <HStack gap={1}>
                    <ShieldCheck size={14} color="GrayText" />
                    <Text color="GrayText">Roles:</Text>
                    <Badge variant="outline" rounded="full">
                      {user.role}
                    </Badge>
                  </HStack>

                  {user.details.position && (
                    <HStack gap={1}>
                      <Text color="GrayText">/ Position:</Text>
                      <Badge variant="outline" rounded="full">
                        {user.details.position}
                      </Badge>
                    </HStack>
                  )}
                </HStack>
              </HStack>
              {user.join_date && (
                <InfoItem label="Joined" icon={LucideClock9}>
                  {formatDate(user.join_date)}
                  <Text fontSize="sm" color="GrayText">
                    (
                    {formatDistanceToNow(user.join_date, {
                      addSuffix: true,
                    })}
                    )
                  </Text>
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
                  {formatDatetime(user.updated_at)}
                </InfoItem>
              </VStack>
            </VStack>
          </Visibility>
        </VStack>
      </DialogBody>
    </>
  );
}
