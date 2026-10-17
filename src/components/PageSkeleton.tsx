import {
  Button,
  ButtonGroup,
  HStack,
  IconButton,
  Skeleton,
  Table,
} from '@chakra-ui/react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';

import FiltersSkeleton from '@/components/filters/FiltersSkeleton';
import PageHeader from '@/components/PageHeader';
import { Stat, StatGroup } from '@/components/ui/stat';

/*
 * Placeholders render the real components hidden in a `Skeleton`, so nothing
 * shifts on load. Fragments: the page shell sets the gaps.
 */

/** Placeholder for a header button: the real button, hidden, for its size. */
export function ButtonSkeleton({ label }: { label: string }) {
  return (
    <Skeleton>
      <Button>
        <Plus />
        {label}
      </Button>
    </Skeleton>
  );
}

type TitleSkeletonProps = {
  /** The page title is static, so it renders for real. */
  title: string;
  /** Labels of the header buttons, which wait on permissions. */
  actions?: Array<string>;
};

/** The page header: title on the left, actions on the right. */
export function TitleSkeleton({ title, actions = [] }: TitleSkeletonProps) {
  return (
    <PageHeader title={title}>
      {actions.length > 0
        ? actions.map((label) => <ButtonSkeleton key={label} label={label} />)
        : null}
    </PageHeader>
  );
}

/** A `StatGroup` of `count` cards. */
export function StatsSkeleton({ count }: { count: number }) {
  const t = useTranslations('components.pageSkeleton');

  return (
    <StatGroup>
      {Array.from({ length: count }, (_, index) => (
        <Skeleton key={index}>
          <Stat label={t('statLabel')} value={0} />
        </Skeleton>
      ))}
    </StatGroup>
  );
}

const cells = (columns: number, Cell: typeof Table.Cell) =>
  Array.from({ length: columns }, (_, index) => (
    <Cell key={index}>
      <Skeleton height={5} />
    </Cell>
  ));

/** A `DataTable` page of `rows` rows, followed by its pagination. */
export function TableSkeleton({ columns = 5, rows = 5 }) {
  const t = useTranslations('components.pagination');

  return (
    <>
      <Table.ScrollArea>
        <Table.Root borderWidth={1} size={{ base: 'sm', md: 'md' }}>
          <Table.Header>
            <Table.Row>{cells(columns, Table.ColumnHeader)}</Table.Row>
          </Table.Header>
          <Table.Body>
            {Array.from({ length: rows }, (_, index) => (
              <Table.Row key={index}>{cells(columns, Table.Cell)}</Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </Table.ScrollArea>

      <HStack justifyContent="space-between">
        <Skeleton height={5} width={40} />
        <Skeleton>
          <ButtonGroup variant="ghost" size={{ base: 'xs', sm: 'sm' }}>
            <IconButton aria-label={t('previousPage')}>
              <ChevronLeft />
            </IconButton>
            <IconButton aria-label={t('nextPage')}>
              <ChevronRight />
            </IconButton>
          </ButtonGroup>
        </Skeleton>
      </HStack>
    </>
  );
}

type ListPageSkeletonProps = TitleSkeletonProps &
  Partial<{
    /** Number of stat cards; omit when the page has none. */
    stats: number;
    /** The toolbar's controls, as `FiltersSkeleton` takes them. */
    toolbar: React.ComponentProps<typeof FiltersSkeleton>;
    /** Number of table columns. */
    columns: number;
  }>;

/** Loading state for a list page: header, stats, toolbar, then a table. */
export default function ListPageSkeleton({
  title,
  actions,
  stats = 0,
  toolbar,
  columns,
}: ListPageSkeletonProps) {
  return (
    <>
      <TitleSkeleton title={title} actions={actions} />
      {stats > 0 && <StatsSkeleton count={stats} />}
      <FiltersSkeleton {...toolbar} />
      <TableSkeleton columns={columns} />
    </>
  );
}
