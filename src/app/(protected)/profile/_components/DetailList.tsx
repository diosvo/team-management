'use client';

import type { PropsWithChildren, ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import {
  DataList,
  Heading,
  HStack,
  Separator,
  Stack,
  Text,
} from '@chakra-ui/react';

/** Label/value rows shared by the profile's detail cards. */
export function DetailList({ children }: PropsWithChildren) {
  return (
    <DataList.Root orientation="horizontal" gap={4}>
      {children}
    </DataList.Root>
  );
}

/** A horizontal rule with the group's title in the middle: "—— Jersey ——". */
export function SectionRule({ title }: { title: string }) {
  return (
    <HStack>
      <Separator flex={1} />
      <Heading as="h4" textStyle="xs" fontWeight="medium" color="fg.muted">
        {title}
      </Heading>
      <Separator flex={1} />
    </HStack>
  );
}

/**
 * A titled group under a labelled rule ("—— Jersey ——"). Rows sit two per
 * line while the card is wide enough for both, one per line otherwise, so it
 * adapts to the card width rather than the viewport.
 */
export function DetailSection({
  title,
  children,
}: PropsWithChildren<{ title: string }>) {
  return (
    <Stack as="section" gap={4}>
      <SectionRule title={title} />
      <DataList.Root
        orientation="horizontal"
        display="grid"
        rowGap={4}
        columnGap={6}
        // At most 2 columns, each at least 13rem; narrower cards drop to 1.
        gridTemplateColumns="repeat(auto-fit, minmax(max(13rem, calc((100% - 1.5rem) / 2)), 1fr))"
      >
        {children}
      </DataList.Root>
    </Stack>
  );
}

/** One row; an empty value reads "Not provided" rather than a bare dash. */
export function DetailItem({
  label,
  children,
}: {
  label: string;
  children?: ReactNode;
}) {
  const t = useTranslations('profile');
  const isEmpty =
    children === null ||
    children === undefined ||
    children === false ||
    children === '';

  return (
    <DataList.Item>
      {/*
       * Label column: 8rem on wide rows so values line up, but never more
       * than 40% of the row, which leaves the value room in the two-column
       * Jersey section. `minWidth` drops the recipe's fixed 120px.
       */}
      <DataList.ItemLabel width="min(40%, 8rem)" minWidth={0} flexShrink={0}>
        {label}
      </DataList.ItemLabel>
      <DataList.ItemValue minWidth={0} overflowWrap="anywhere">
        {isEmpty ? <Text color="fg.subtle">{t('notProvided')}</Text> : children}
      </DataList.ItemValue>
    </DataList.Item>
  );
}
