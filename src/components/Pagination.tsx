'use client';

import {
  ButtonGroup,
  Pagination as ChakraPagination,
  IconButton,
} from '@chakra-ui/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Tooltip } from '@/components/ui/tooltip';

import Visibility from './Visibility';

type PaginationProps = {
  count: number;
  page: number;
  pageSize?: number;
  onPageChange: (details: { page: number }) => void;
};

export default function Pagination({
  count,
  page,
  pageSize = 5,
  onPageChange,
}: PaginationProps) {
  const t = useTranslations('components.pagination');

  return (
    <Visibility isVisible={count > 0}>
      <ChakraPagination.Root
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        count={count}
        page={page}
        pageSize={pageSize}
        onPageChange={onPageChange}
      >
        <ChakraPagination.PageText
          textStyle="secondary"
          format={({ pageRange, count }) =>
            t('pageText', {
              start: pageRange.start + 1,
              end: Math.min(pageRange.end, count),
              count,
            })
          }
        />
        <ButtonGroup variant="ghost" size={{ base: 'xs', sm: 'sm' }}>
          <Tooltip content={t('previousPage')}>
            <ChakraPagination.PrevTrigger asChild>
              <IconButton>
                <ChevronLeft />
              </IconButton>
            </ChakraPagination.PrevTrigger>
          </Tooltip>
          <Tooltip content={t('nextPage')}>
            <ChakraPagination.NextTrigger asChild>
              <IconButton>
                <ChevronRight />
              </IconButton>
            </ChakraPagination.NextTrigger>
          </Tooltip>
        </ButtonGroup>
      </ChakraPagination.Root>
    </Visibility>
  );
}
