'use client';

import NextLink, { type LinkProps, useLinkStatus } from 'next/link';
import { useTranslations } from 'next-intl';
import {
  IconButton,
  type IconButtonProps,
  Spinner,
  Table,
  type TableCellProps,
  type TableColumnHeaderProps,
  type TableRootProps,
} from '@chakra-ui/react';
import type { LucideIcon } from 'lucide-react';

import Pagination from '@/components/Pagination';
import SelectionActionBar from '@/components/SelectionActionBar';
import { Checkbox } from '@/components/ui/checkbox';
import { EmptyState } from '@/components/ui/empty-state';
import { Tooltip } from '@/components/ui/tooltip';
import { toggleSelection } from '@/hooks/use-table-state';

/**
 * Hidden until hovered or focused; always visible on touch devices. Hovered
 * rows use a subtle palette, so the action stays slightly stronger to remain
 * readable.
 */
const ROW_ACTION_CSS = {
  opacity: 0,
  transition: 'opacity 0.15s ease-in-out',
  // A clicked action stays visible while its route loads.
  'tr:hover &, tr:focus-within &, &:has([data-pending])': { opacity: 1 },
  '@media (hover: none)': { opacity: 1 },
} as const;

/**
 * Shows a spinner while the route is pending; must render inside the `Link`.
 */
function RowActionIcon({ icon: Icon }: { icon: LucideIcon }) {
  const { pending } = useLinkStatus();

  return pending ? (
    <Spinner size="xs" borderWidth={1.5} data-pending="" />
  ) : (
    <Icon size={14} />
  );
}

type RowActionBaseProps = { label: string } & Omit<
  IconButtonProps,
  'aria-label'
>;

/**
 * Shared look of a per-row action: a small ghost icon button with a tooltip,
 * shown on row hover. Swallows the click so the row's own `onRowClick` stays
 * out of it.
 */
function RowActionBase({ label, onClick, ...props }: RowActionBaseProps) {
  return (
    <Tooltip content={label}>
      <IconButton
        size="xs"
        variant="ghost"
        aria-label={label}
        css={ROW_ACTION_CSS}
        _hover={{ backgroundColor: 'gray.muted' }}
        {...props}
        onClick={(event) => {
          event.stopPropagation();
          onClick?.(event);
        }}
      />
    </Tooltip>
  );
}

type RowActionProps = {
  label: string;
  href: LinkProps['href'];
  icon: LucideIcon;
};

/** Per-row icon link: navigation, with a spinner while the route loads. */
export function RowAction({ label, href, icon }: RowActionProps) {
  return (
    <RowActionBase label={label} asChild>
      <NextLink href={href}>
        <RowActionIcon icon={icon} />
      </NextLink>
    </RowActionBase>
  );
}

type RowActionButtonProps = {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  loading?: boolean;
} & Pick<IconButtonProps, 'colorPalette'>;

/** Per-row icon button: an action that stays on the page. */
export function RowActionButton({
  icon: Icon,
  onClick,
  loading,
  ...props
}: RowActionButtonProps) {
  return (
    <RowActionBase
      {...props}
      loading={loading}
      // Keeps the button visible while its action runs
      data-pending={loading ? '' : undefined}
      onClick={() => onClick()}
    >
      <Icon size={14} />
    </RowActionBase>
  );
}

export type Column<T> = Required<{
  header: React.ReactNode;
  cell: (item: T, index: number) => React.ReactNode;
}> &
  Partial<{
    align: 'left' | 'center' | 'right';
    cellProps: TableCellProps;
    headerProps: TableColumnHeaderProps;
  }>;

type Selection<T> = Required<{
  canSelect: boolean;
  items: Array<T>;
  selection: Array<string>;
  onDelete: () => void;
  setSelection: React.Dispatch<React.SetStateAction<Array<string>>>;
}> &
  Partial<{
    disabled: boolean;
    actions: React.ReactNode;
    isSelectable: (item: T) => boolean;
  }>;

type DataTableProps<T> = Required<{
  columns: Array<Column<T>>;
  currentData: Array<T>;
  rowId: (item: T) => string;
  page: number;
  totalCount: number;
  empty: { title: string; description?: string; icon?: React.ReactNode };
  onPageChange: (details: { page: number }) => void;
}> &
  Partial<{
    pageSize: number;
    selection: Selection<T>;
    onRowClick: (item: T) => void;
    /** Rows that ignore `onRowClick` (e.g. the viewer's own, read-only). */
    isRowClickable: (item: T) => boolean;
  }> &
  TableRootProps;

export default function DataTable<T>({
  columns,
  currentData,
  totalCount,
  page,
  pageSize,
  empty,
  selection,
  rowId,
  onPageChange,
  onRowClick,
  isRowClickable,
  ...rootProps
}: DataTableProps<T>) {
  const t = useTranslations('components.dataTable');
  const activeSelection = selection?.canSelect ? selection : null;
  const colSpan = columns.length + (activeSelection ? 1 : 0);

  const canSelectRow = (item: T) =>
    activeSelection?.isSelectable?.(item) ?? true;
  const selectableItems = activeSelection?.items.filter(canSelectRow) ?? [];
  const selectionCount = activeSelection?.selection.length ?? 0;
  const hasSelection = selectionCount > 0;
  const indeterminate = hasSelection && selectionCount < selectableItems.length;

  return (
    <>
      <Table.ScrollArea>
        <Table.Root
          borderWidth={1}
          size={{ base: 'sm', md: 'md' }}
          interactive={totalCount > 0}
          {...rootProps}
        >
          <Table.Header>
            <Table.Row>
              {activeSelection && (
                <Table.ColumnHeader width={6}>
                  <Checkbox
                    top={0.5}
                    aria-label={t('selectAllRows')}
                    disabled={
                      activeSelection.disabled || selectableItems.length === 0
                    }
                    checked={
                      indeterminate ? 'indeterminate' : selectionCount > 0
                    }
                    onCheckedChange={(changes) =>
                      activeSelection.setSelection(
                        changes.checked ? selectableItems.map(rowId) : [],
                      )
                    }
                  />
                </Table.ColumnHeader>
              )}
              {columns.map((column, index) => (
                <Table.ColumnHeader
                  key={index}
                  textAlign={column.align}
                  {...column.headerProps}
                >
                  {column.header}
                </Table.ColumnHeader>
              ))}
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {currentData.length > 0 ? (
              currentData.map((item, rowIndex) => {
                const id = rowId(item);
                const clickable =
                  onRowClick && (isRowClickable?.(item) ?? true);
                return (
                  <Table.Row
                    key={id}
                    data-selected={
                      activeSelection?.selection.includes(id) ? '' : undefined
                    }
                    _hover={{ cursor: clickable ? 'pointer' : 'default' }}
                    onClick={clickable ? () => onRowClick(item) : undefined}
                  >
                    {activeSelection && (
                      <Table.Cell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          top={0.5}
                          aria-label={t('selectRow')}
                          disabled={
                            activeSelection.disabled || !canSelectRow(item)
                          }
                          checked={activeSelection.selection.includes(id)}
                          onCheckedChange={(changes) =>
                            activeSelection.setSelection(
                              toggleSelection(id, changes.checked === true),
                            )
                          }
                        />
                      </Table.Cell>
                    )}
                    {columns.map((column, index) => (
                      <Table.Cell
                        key={index}
                        textAlign={column.align}
                        {...column.cellProps}
                      >
                        {column.cell(item, rowIndex) ?? '-'}
                      </Table.Cell>
                    ))}
                  </Table.Row>
                );
              })
            ) : (
              <Table.Row>
                <Table.Cell colSpan={colSpan}>
                  <EmptyState
                    title={empty.title}
                    description={empty.description}
                    icon={empty.icon}
                  />
                </Table.Cell>
              </Table.Row>
            )}
          </Table.Body>
        </Table.Root>
      </Table.ScrollArea>

      <Pagination
        count={totalCount}
        page={page}
        pageSize={pageSize}
        onPageChange={onPageChange}
      />

      {activeSelection && (
        <SelectionActionBar
          open={hasSelection}
          selectionCount={selectionCount}
          onDelete={activeSelection.onDelete}
        >
          {activeSelection.actions}
        </SelectionActionBar>
      )}
    </>
  );
}
