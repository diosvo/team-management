import { renderWithUI, screen } from '@/test/utilities';

import DataTable, { type Column } from './DataTable';

type Row = { id: string; name: string; selectable: boolean };

const ROWS: Array<Row> = [
  { id: 'a', name: 'Alice', selectable: true },
  { id: 'b', name: 'Bob', selectable: false },
  { id: 'c', name: 'Carol', selectable: true },
];

const COLUMNS: Array<Column<Row>> = [
  { header: 'Name', cell: (row) => row.name },
];

const baseProps = {
  columns: COLUMNS,
  rowId: (row: Row) => row.id,
  currentData: ROWS,
  totalCount: ROWS.length,
  page: 1,
  onPageChange: vi.fn(),
  empty: { title: 'Nothing here' },
};

describe('DataTable', () => {
  test('renders a header and a cell per row', () => {
    renderWithUI(<DataTable {...baseProps} />);

    expect(screen.getByText('Name')).toBeInTheDocument();
    ['Alice', 'Bob', 'Carol'].forEach((name) =>
      expect(screen.getByText(name)).toBeInTheDocument(),
    );
  });

  test('shows the empty state when there is no data', () => {
    renderWithUI(<DataTable {...baseProps} currentData={[]} totalCount={0} />);

    expect(screen.getByText('Nothing here')).toBeInTheDocument();
  });

  test('omits the checkbox column when selection is absent', () => {
    renderWithUI(<DataTable {...baseProps} />);

    expect(
      screen.queryByRole('checkbox', { name: 'Select all rows' }),
    ).not.toBeInTheDocument();
  });

  test('calls onRowClick with the clicked item', async () => {
    const onRowClick = vi.fn();
    const { user } = renderWithUI(
      <DataTable {...baseProps} onRowClick={onRowClick} />,
    );

    await user.click(screen.getByText('Carol'));

    expect(onRowClick).toHaveBeenCalledWith(ROWS[2]);
  });

  test('select-all selects only the selectable rows', async () => {
    const setSelection = vi.fn();
    const { user } = renderWithUI(
      <DataTable
        {...baseProps}
        selection={{
          canSelect: true,
          items: ROWS,
          selection: [],
          setSelection,
          isSelectable: (row) => row.selectable,
          onDelete: vi.fn(),
        }}
      />,
    );

    await user.click(screen.getByRole('checkbox', { name: 'Select all rows' }));

    expect(setSelection).toHaveBeenCalledWith(['a', 'c']);
  });

  test('marks the non-selectable row checkbox as disabled', () => {
    const { container } = renderWithUI(
      <DataTable
        {...baseProps}
        selection={{
          canSelect: true,
          items: ROWS,
          selection: [],
          setSelection: vi.fn(),
          isSelectable: (row) => row.selectable,
          onDelete: vi.fn(),
        }}
      />,
    );

    // 3 rows, one of which (Bob) is not selectable. Chakra reflects the
    // disabled state via `data-disabled` on the checkbox root.
    expect(container.querySelectorAll('label[data-disabled]')).toHaveLength(1);
  });
});
