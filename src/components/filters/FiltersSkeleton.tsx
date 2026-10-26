import { Box, Button, HStack, Skeleton } from '@chakra-ui/react';
import { CalendarSearch, SlidersHorizontal } from 'lucide-react';
import { useTranslations } from 'next-intl';

import {
  CONTROL_HEIGHT,
  CONTROLS_ROW_PROPS,
  SEARCH_SLOT_PROPS,
  TOOLBAR_PROPS,
} from './layout';

type FiltersSkeletonProps = Partial<{
  /** Trigger text of the inline date window, e.g. "This year". */
  date: string;
  /** Whether the page has categorical filters (the Filters button). */
  filters: boolean;
  /** Text of a right-aligned action, e.g. "Date" for a select. */
  action: string;
}>;

/** `Filters` placeholder; hidden real buttons set the widths. */
export default function FiltersSkeleton({
  date,
  filters = false,
  action,
}: FiltersSkeletonProps) {
  const tCommon = useTranslations('common');
  const hasControls = Boolean(date || filters || action);

  return (
    <HStack {...TOOLBAR_PROPS}>
      <Skeleton {...SEARCH_SLOT_PROPS} height={CONTROL_HEIGHT} />
      {hasControls && (
        <HStack {...CONTROLS_ROW_PROPS}>
          {date && (
            // Like `DateRangePicker`: fills the row on phones, fits its text from `sm`.
            <Skeleton
              width={{ base: 'full', sm: 'auto' }}
              flexShrink={{ base: 1, sm: 0 }}
              minWidth={0}
            >
              <Button variant="outline" width="full">
                <CalendarSearch />
                {date}
              </Button>
            </Skeleton>
          )}
          {filters && (
            <Skeleton>
              <Button variant="outline">
                <SlidersHorizontal />
                {tCommon('filters')}
              </Button>
            </Skeleton>
          )}
          {action && (
            <Box marginInlineStart="auto">
              <Skeleton>
                <Button variant="outline">{action}</Button>
              </Skeleton>
            </Box>
          )}
        </HStack>
      )}
    </HStack>
  );
}
