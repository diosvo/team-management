import { axe } from 'jest-axe';
import { useForm } from 'react-hook-form';
import { SWRConfig } from 'swr';

import { renderWithUI, screen, waitFor } from '@/test/utilities';

import SearchableSelect from './SearchableSelect';

type MockItem = {
  id: string;
  name: string;
};

const mockItems: Array<MockItem> = [
  { id: '1', name: 'Item 1' },
  { id: '2', name: 'Item 2' },
  { id: '3', name: 'Item 3' },
];

const mockAction = vi.fn().mockResolvedValue(mockItems);

const itemToString = (item: MockItem) => item.name;
const itemToValue = (item: MockItem) => item.id;

const baseProps = {
  label: 'items',
  action: mockAction,
  itemToString,
  itemToValue,
};

// Wraps the given UI in an isolated SWR cache to prevent test cross-contamination
const withFreshSWR = (ui: React.ReactElement) => (
  <SWRConfig value={{ provider: () => new Map() }}>{ui}</SWRConfig>
);

describe('SearchableSelect', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('uncontrolled mode', () => {
    describe('multiple', () => {
      const onChange = vi.fn();

      const defaultProps = {
        ...baseProps,
        controlledMode: false as const,
        multiple: true as const,
        value: [] as Array<MockItem>,
        onChange,
      };

      const setup = (overrides = {}) =>
        renderWithUI(
          withFreshSWR(<SearchableSelect {...defaultProps} {...overrides} />),
        );

      test('should be accessible', async () => {
        const { container } = setup();
        await waitFor(() => expect(mockAction).toHaveBeenCalled());

        const result = await axe(container);
        expect(result).toHaveNoViolations();
      });

      test('renders with label', async () => {
        setup();
        await waitFor(() => expect(mockAction).toHaveBeenCalled());
        expect(screen.getByText(/Select items/)).toBeInTheDocument();
      });

      test('displays empty state when no items found', async () => {
        const emptyAction = vi.fn().mockResolvedValue([]);
        const { user } = setup({ action: emptyAction });

        await waitFor(() => expect(emptyAction).toHaveBeenCalled());

        await user.click(screen.getByPlaceholderText('Type to search'));
        expect(screen.getByText('No items found.')).toBeInTheDocument();
      });

      test('renders items when dropdown is opened', async () => {
        const { user } = setup();

        await waitFor(() => expect(mockAction).toHaveBeenCalled());

        await user.click(screen.getByPlaceholderText('Type to search'));

        expect(await screen.findByText('Item 1')).toBeInTheDocument();
        expect(screen.getByText('Item 2')).toBeInTheDocument();
        expect(screen.getByText('Item 3')).toBeInTheDocument();
      });

      test('filters items based on input', async () => {
        const { user } = setup();

        await waitFor(() => expect(mockAction).toHaveBeenCalled());

        const input = screen.getByPlaceholderText('Type to search');
        await user.click(input);
        await screen.findByText('Item 1');

        await user.type(input, '1');

        await waitFor(() => {
          expect(screen.getByText('Item 1')).toBeInTheDocument();
          expect(screen.queryByText('Item 2')).not.toBeInTheDocument();
        });
      });

      test('calls onChange with the selected items', async () => {
        const { user } = setup();

        await waitFor(() => expect(mockAction).toHaveBeenCalled());

        await user.click(screen.getByPlaceholderText('Type to search'));
        await user.click(await screen.findByText('Item 1'));

        expect(onChange).toHaveBeenCalledWith([mockItems[0]]);
      });

      test('shows maxItems warning and does not call onChange when limit exceeded', async () => {
        const { user } = setup({
          maxItems: 2,
          value: [mockItems[0], mockItems[1]],
        });

        await waitFor(() => expect(mockAction).toHaveBeenCalled());

        await user.click(screen.getByPlaceholderText('Type to search'));
        await user.click(await screen.findByText('Item 3'));

        expect(onChange).not.toHaveBeenCalled();
      });

      test('renders custom items with renderItem prop', async () => {
        const renderItem = (item: MockItem) => <div>Custom: {item.name}</div>;
        const { user } = setup({ renderItem });

        await waitFor(() => expect(mockAction).toHaveBeenCalled());

        await user.click(screen.getByPlaceholderText('Type to search'));

        expect(await screen.findByText('Custom: Item 1')).toBeInTheDocument();
      });
    });

    describe('single', () => {
      const onChange = vi.fn();

      const defaultProps = {
        ...baseProps,
        controlledMode: false as const,
        multiple: false as const,
        value: null as Nullable<MockItem>,
        onChange,
      };

      const setup = (overrides = {}) =>
        renderWithUI(
          withFreshSWR(<SearchableSelect {...defaultProps} {...overrides} />),
        );

      test('should be accessible', async () => {
        const { container } = setup();
        await waitFor(() => expect(mockAction).toHaveBeenCalled());

        const result = await axe(container);
        expect(result).toHaveNoViolations();
      });

      test('renders with label', async () => {
        setup();
        await waitFor(() => expect(mockAction).toHaveBeenCalled());
        expect(screen.getByText(/Select items/)).toBeInTheDocument();
      });

      test('displays empty state when no items found', async () => {
        const emptyAction = vi.fn().mockResolvedValue([]);
        const { user } = setup({ action: emptyAction });

        await waitFor(() => expect(emptyAction).toHaveBeenCalled());

        await user.click(screen.getByPlaceholderText('Type to search'));
        expect(screen.getByText('No items found.')).toBeInTheDocument();
      });

      test('renders items when dropdown is opened', async () => {
        const { user } = setup();

        await waitFor(() => expect(mockAction).toHaveBeenCalled());

        await user.click(screen.getByPlaceholderText('Type to search'));

        expect(await screen.findByText('Item 1')).toBeInTheDocument();
        expect(screen.getByText('Item 2')).toBeInTheDocument();
        expect(screen.getByText('Item 3')).toBeInTheDocument();
      });

      test('calls onChange with a single item (not an array)', async () => {
        const { user } = setup();

        await waitFor(() => expect(mockAction).toHaveBeenCalled());

        await user.click(screen.getByPlaceholderText('Type to search'));
        await user.click(await screen.findByText('Item 1'));

        expect(onChange).toHaveBeenCalledWith(mockItems[0]);
      });
    });
  });

  describe('controlled mode', () => {
    describe('multiple', () => {
      type FormValues = { field: string[] };

      const ControlledMultiple = () => {
        const { control } = useForm<FormValues>({
          defaultValues: { field: [] },
        });
        return (
          <SearchableSelect
            {...baseProps}
            controlledMode={true}
            multiple={true}
            control={control}
            name="field"
          />
        );
      };

      const setup = () => renderWithUI(withFreshSWR(<ControlledMultiple />));

      test('renders with label', async () => {
        setup();
        await waitFor(() => expect(mockAction).toHaveBeenCalled());
        expect(screen.getByText(/Select items/)).toBeInTheDocument();
      });

      test('renders items when dropdown is opened', async () => {
        const { user } = setup();

        await waitFor(() => expect(mockAction).toHaveBeenCalled());

        await user.click(screen.getByPlaceholderText('Type to search'));

        expect(await screen.findByText('Item 1')).toBeInTheDocument();
        expect(screen.getByText('Item 2')).toBeInTheDocument();
        expect(screen.getByText('Item 3')).toBeInTheDocument();
      });

      test('updates form value with string IDs on selection', async () => {
        const ControlledMultipleWithDisplay = () => {
          const { control, watch } = useForm<FormValues>({
            defaultValues: { field: [] },
          });
          const value = watch('field');
          return (
            <>
              <SearchableSelect
                {...baseProps}
                controlledMode={true}
                multiple={true}
                control={control}
                name="field"
              />
              <div data-testid="form-value">{JSON.stringify(value)}</div>
            </>
          );
        };

        const { user } = renderWithUI(
          withFreshSWR(<ControlledMultipleWithDisplay />),
        );

        await waitFor(() => expect(mockAction).toHaveBeenCalled());

        await user.click(screen.getByPlaceholderText('Type to search'));
        await user.click(await screen.findByText('Item 1'));

        expect(screen.getByTestId('form-value')).toHaveTextContent('["1"]');
      });

      test('shows field validation error', async () => {
        const ControlledMultipleWithError = () => {
          const { control, setError } = useForm<FormValues>({
            defaultValues: { field: [] },
          });
          return (
            <>
              <button
                onClick={() =>
                  setError('field', { message: 'Field is required' })
                }
              >
                Trigger Error
              </button>
              <SearchableSelect
                {...baseProps}
                controlledMode={true}
                multiple={true}
                control={control}
                name="field"
              />
            </>
          );
        };

        const { user } = renderWithUI(
          withFreshSWR(<ControlledMultipleWithError />),
        );

        await user.click(screen.getByText('Trigger Error'));

        expect(
          await screen.findByText('Field is required'),
        ).toBeInTheDocument();
      });
    });

    describe('single', () => {
      type FormValues = { field: string | null };

      const ControlledSingle = () => {
        const { control } = useForm<FormValues>({
          defaultValues: { field: null },
        });
        return (
          <SearchableSelect
            {...baseProps}
            controlledMode={true}
            multiple={false}
            control={control}
            name="field"
          />
        );
      };

      const setup = () => renderWithUI(withFreshSWR(<ControlledSingle />));

      test('renders with label', async () => {
        setup();
        await waitFor(() => expect(mockAction).toHaveBeenCalled());
        expect(screen.getByText(/Select items/)).toBeInTheDocument();
      });

      test('renders items when dropdown is opened', async () => {
        const { user } = setup();

        await waitFor(() => expect(mockAction).toHaveBeenCalled());

        await user.click(screen.getByPlaceholderText('Type to search'));

        expect(await screen.findByText('Item 1')).toBeInTheDocument();
        expect(screen.getByText('Item 2')).toBeInTheDocument();
        expect(screen.getByText('Item 3')).toBeInTheDocument();
      });

      test('updates form value with a single string ID on selection', async () => {
        const ControlledSingleWithDisplay = () => {
          const { control, watch } = useForm<FormValues>({
            defaultValues: { field: null },
          });
          const value = watch('field');
          return (
            <>
              <SearchableSelect
                {...baseProps}
                controlledMode={true}
                multiple={false}
                control={control}
                name="field"
              />
              <div data-testid="form-value">{JSON.stringify(value)}</div>
            </>
          );
        };

        const { user } = renderWithUI(
          withFreshSWR(<ControlledSingleWithDisplay />),
        );

        await waitFor(() => expect(mockAction).toHaveBeenCalled());

        await user.click(screen.getByPlaceholderText('Type to search'));
        await user.click(await screen.findByText('Item 1'));

        expect(screen.getByTestId('form-value')).toHaveTextContent('"1"');
      });

      test('shows field validation error', async () => {
        const ControlledSingleWithError = () => {
          const { control, setError } = useForm<FormValues>({
            defaultValues: { field: null },
          });
          return (
            <>
              <button
                onClick={() =>
                  setError('field', { message: 'Field is required' })
                }
              >
                Trigger Error
              </button>
              <SearchableSelect
                {...baseProps}
                controlledMode={true}
                multiple={false}
                control={control}
                name="field"
              />
            </>
          );
        };

        const { user } = renderWithUI(
          withFreshSWR(<ControlledSingleWithError />),
        );

        await user.click(screen.getByText('Trigger Error'));

        expect(
          await screen.findByText('Field is required'),
        ).toBeInTheDocument();
      });
    });
  });
});
