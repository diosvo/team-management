'use client';

import {
  ButtonGroup,
  Pagination as ChakraPagination,
  IconButton,
} from '@chakra-ui/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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
  return (
    <Visibility isVisible={count > 0}>
      <ChakraPagination.Root
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        marginTop={4}
        count={count}
        page={page}
        pageSize={pageSize}
        onPageChange={onPageChange}
      >
        <ChakraPagination.PageText format="long" fontSize={14} />
        <ButtonGroup variant="ghost" size={{ base: 'xs', sm: 'sm' }}>
          <Tooltip content="Previous page">
            <ChakraPagination.PrevTrigger asChild>
              <IconButton>
                <ChevronLeft />
              </IconButton>
            </ChakraPagination.PrevTrigger>
          </Tooltip>
          <Tooltip content="Next page">
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
