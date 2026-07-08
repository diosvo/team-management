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

/** Build a `selection` prop with sane defaults, overridable per test. */
const withSelection = (overrides = {}) => ({
  canSelect: true,
  items: ROWS,
  selection: [] as Array<string>,
  setSelection: vi.fn(),
  isSelectable: (row: Row) => row.selectable,
  onDelete: vi.fn(),
  ...overrides,
});

describe('DataTable', () => {
  test('renders a header and a cell per row', () => {
    renderWithUI(<DataTable {...baseProps} />);

    expect(screen.getByText('Name')).toBeInTheDocument();
    ['Alice', 'Bob', 'Carol'].forEach((name) =>
      expect(screen.getByText(name)).toBeInTheDocument(),
    );
  });

  test('applies column alignment and header/cell props', () => {
    const columns: Array<Column<Row>> = [
      {
        header: 'Name',
        align: 'right',
        headerProps: { className: 'name-header' },
        cellProps: { className: 'name-cell' },
        cell: (row) => row.name,
      },
    ];
    const { container } = renderWithUI(
      <DataTable {...baseProps} columns={columns} />,
    );

    expect(container.querySelector('th.name-header')).toBeInTheDocument();
    expect(container.querySelectorAll('td.name-cell')).toHaveLength(
      ROWS.length,
    );
  });

  test('passes the row index to the cell renderer', () => {
    const columns: Array<Column<Row>> = [
      { header: '#', cell: (_row, index) => `row-${index}` },
    ];
    renderWithUI(<DataTable {...baseProps} columns={columns} />);

    expect(screen.getByText('row-0')).toBeInTheDocument();
    expect(screen.getByText('row-1')).toBeInTheDocument();
    expect(screen.getByText('row-2')).toBeInTheDocument();
  });

  test('falls back to a dash when a cell renders nullish', () => {
    const columns: Array<Column<Row>> = [{ header: 'Maybe', cell: () => null }];
    renderWithUI(<DataTable {...baseProps} columns={columns} />);

    expect(screen.getAllByText('-')).toHaveLength(ROWS.length);
  });

  test('shows the empty state (with description and icon) when there is no data', () => {
    renderWithUI(
      <DataTable
        {...baseProps}
        currentData={[]}
        totalCount={0}
        empty={{
          title: 'Nothing here',
          description: 'Try again later',
          icon: <span data-testid="empty-icon" />,
        }}
      />,
    );

    expect(screen.getByText('Nothing here')).toBeInTheDocument();
    expect(screen.getByText('Try again later')).toBeInTheDocument();
    expect(screen.getByTestId('empty-icon')).toBeInTheDocument();
  });

  test('renders the empty state across the checkbox + data columns when selectable', () => {
    const { container } = renderWithUI(
      <DataTable
        {...baseProps}
        currentData={[]}
        totalCount={0}
        selection={withSelection()}
      />,
    );

    // colSpan = columns (1) + checkbox column (1).
    expect(container.querySelector('td[colspan="2"]')).toBeInTheDocument();
  });

  describe('without selection', () => {
    test('omits the checkbox column', () => {
      renderWithUI(<DataTable {...baseProps} />);

      expect(
        screen.queryByRole('checkbox', { name: 'Select all rows' }),
      ).not.toBeInTheDocument();
    });

    test('does not render the selection action bar', () => {
      renderWithUI(<DataTable {...baseProps} />);

      expect(screen.queryByText('Delete')).not.toBeInTheDocument();
    });
  });

  test('omits the checkbox column when canSelect is false', () => {
    renderWithUI(
      <DataTable
        {...baseProps}
        selection={withSelection({ canSelect: false })}
      />,
    );

    expect(
      screen.queryByRole('checkbox', { name: 'Select all rows' }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('Delete')).not.toBeInTheDocument();
  });

  describe('row click', () => {
    test('calls onRowClick with the clicked item', async () => {
      const onRowClick = vi.fn();
      const { user } = renderWithUI(
        <DataTable {...baseProps} onRowClick={onRowClick} />,
      );

      await user.click(screen.getByText('Carol'));

      expect(onRowClick).toHaveBeenCalledWith(ROWS[2]);
    });

    test('stops propagation so toggling a checkbox never triggers the row click', async () => {
      const onRowClick = vi.fn();
      const { container, user } = renderWithUI(
        <DataTable
          {...baseProps}
          onRowClick={onRowClick}
          selection={withSelection()}
        />,
      );

      // The checkbox lives in the first cell of the row; clicking that cell
      // must not bubble up to the row's onClick handler.
      const checkboxCell = container.querySelector('tbody tr td');
      await user.click(checkboxCell as Element);

      expect(onRowClick).not.toHaveBeenCalled();
    });
  });

  describe('select-all checkbox', () => {
    test('selects only the selectable rows', async () => {
      const setSelection = vi.fn();
      const { user } = renderWithUI(
        <DataTable
          {...baseProps}
          selection={withSelection({ setSelection })}
        />,
      );

      await user.click(
        screen.getByRole('checkbox', { name: 'Select all rows' }),
      );

      expect(setSelection).toHaveBeenCalledWith(['a', 'c']);
    });

    test('clears the selection when all selectable rows are already selected', async () => {
      const setSelection = vi.fn();
      const { user } = renderWithUI(
        <DataTable
          {...baseProps}
          selection={withSelection({ selection: ['a', 'c'], setSelection })}
        />,
      );

      await user.click(
        screen.getByRole('checkbox', { name: 'Select all rows' }),
      );

      expect(setSelection).toHaveBeenCalledWith([]);
    });

    test('is indeterminate when only some selectable rows are selected', () => {
      const { container } = renderWithUI(
        <DataTable
          {...baseProps}
          selection={withSelection({ selection: ['a'] })}
        />,
      );

      expect(
        container.querySelector('[aria-label="Select all rows"]'),
      ).toHaveAttribute('data-state', 'indeterminate');
    });

    test('is disabled when no row is selectable', () => {
      renderWithUI(
        <DataTable
          {...baseProps}
          selection={withSelection({ isSelectable: () => false })}
        />,
      );

      expect(
        screen.getByRole('checkbox', { name: 'Select all rows' }),
      ).toBeDisabled();
    });

    test('is disabled while the selection prop is disabled', () => {
      renderWithUI(
        <DataTable
          {...baseProps}
          selection={withSelection({ disabled: true })}
        />,
      );

      expect(
        screen.getByRole('checkbox', { name: 'Select all rows' }),
      ).toBeDisabled();
    });
  });

  describe('row checkbox', () => {
    test('marks the non-selectable row checkbox as disabled', () => {
      const { container } = renderWithUI(
        <DataTable {...baseProps} selection={withSelection()} />,
      );

      // 3 rows, one of which (Bob) is not selectable. Chakra reflects the
      // disabled state via `data-disabled` on the checkbox root.
      expect(container.querySelectorAll('label[data-disabled]')).toHaveLength(
        1,
      );
    });

    test('disables every row checkbox while the selection prop is disabled', () => {
      const { container } = renderWithUI(
        <DataTable
          {...baseProps}
          selection={withSelection({ disabled: true })}
        />,
      );

      // All 3 rows + the select-all checkbox reflect the disabled state.
      expect(container.querySelectorAll('label[data-disabled]')).toHaveLength(
        4,
      );
    });

    test('reflects the checked state and marks the selected row', () => {
      const { container } = renderWithUI(
        <DataTable
          {...baseProps}
          selection={withSelection({ selection: ['a'] })}
        />,
      );

      expect(
        screen.getAllByRole('checkbox', { name: 'Select row' })[0],
      ).toBeChecked();
      expect(container.querySelectorAll('tr[data-selected]')).toHaveLength(1);
    });

    test('adds the row id when checking an unselected row', async () => {
      const setSelection = vi.fn();
      const { user } = renderWithUI(
        <DataTable
          {...baseProps}
          selection={withSelection({ setSelection })}
        />,
      );

      await user.click(
        screen.getAllByRole('checkbox', { name: 'Select row' })[0],
      );

      const updater = setSelection.mock.calls[0][0];
      expect(updater(['x'])).toEqual(['x', 'a']);
    });

    test('removes the row id when unchecking a selected row', async () => {
      const setSelection = vi.fn();
      const { user } = renderWithUI(
        <DataTable
          {...baseProps}
          selection={withSelection({ selection: ['a'], setSelection })}
        />,
      );

      await user.click(
        screen.getAllByRole('checkbox', { name: 'Select row' })[0],
      );

      const updater = setSelection.mock.calls[0][0];
      expect(updater(['a', 'z'])).toEqual(['z']);
    });
  });

  describe('selection action bar', () => {
    test('opens with custom actions and a delete button once rows are selected', () => {
      renderWithUI(
        <DataTable
          {...baseProps}
          selection={withSelection({
            selection: ['a'],
            actions: <button>Archive</button>,
          })}
        />,
      );

      expect(screen.getByText('Archive')).toBeInTheDocument();
      expect(screen.getByText('Delete')).toBeInTheDocument();
      expect(screen.getByText('1 selected')).toBeInTheDocument();
    });
  });

  test('treats a row as selectable by default when isSelectable is omitted', () => {
    const { container } = renderWithUI(
      <DataTable
        {...baseProps}
        selection={withSelection({ isSelectable: undefined })}
      />,
    );

    // No row is disabled, and select-all pools every row.
    expect(container.querySelectorAll('label[data-disabled]')).toHaveLength(0);
  });
});
