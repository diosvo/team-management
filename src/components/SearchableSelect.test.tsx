import {
  expectNoA11yViolations,
  renderWithUI,
  screen,
  setupTestLifecycle,
  waitFor,
  withFreshSWR,
} from '@/test/utilities';
import { useForm } from 'react-hook-form';

import SearchableSelect, { SearchableSelectField } from './SearchableSelect';

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

describe('SearchableSelect', () => {
  setupTestLifecycle();

  describe('SearchableSelect (uncontrolled)', () => {
    describe('multiple', () => {
      const onChange = vi.fn();

      const defaultProps = {
        ...baseProps,
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

        await expectNoA11yViolations(container);
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

      test('treats an undefined value as no selection', async () => {
        setup({ value: undefined });

        await waitFor(() => expect(mockAction).toHaveBeenCalled());
      });

      test('keeps a selected item visible even when it is not in the loaded list', async () => {
        const { user } = setup({
          value: [{ id: '9', name: 'Not in the list' }],
        });

        await waitFor(() => expect(mockAction).toHaveBeenCalled());
        await user.click(screen.getByPlaceholderText('Type to search'));

        expect(await screen.findByText('Not in the list')).toBeInTheDocument();
      });

      test('shows the SWR error when the action rejects', async () => {
        const failingAction = vi.fn().mockRejectedValue(new Error('boom'));
        const { user } = setup({ action: failingAction });

        await waitFor(() => expect(failingAction).toHaveBeenCalled());
        await user.click(screen.getByPlaceholderText('Type to search'));

        expect(await screen.findByText('Error: boom')).toBeInTheDocument();
      });

      test('uses the localized noun for a known entity label', async () => {
        setup({ label: 'players', action: mockAction });

        await waitFor(() => expect(mockAction).toHaveBeenCalled());
        expect(screen.getByText('Select players')).toBeInTheDocument();
      });
    });

    describe('single', () => {
      const onChange = vi.fn();

      const defaultProps = {
        ...baseProps,
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

        await expectNoA11yViolations(container);
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

      test('pre-fills the input from a given value', async () => {
        setup({ value: mockItems[0] });

        await waitFor(() => expect(mockAction).toHaveBeenCalled());

        expect(
          screen.getByDisplayValue(mockItems[0].name),
        ).toBeInTheDocument();
      });

      test('calls onChange with null when the selection is cleared', async () => {
        const { user } = setup({ value: mockItems[0] });

        await waitFor(() => expect(mockAction).toHaveBeenCalled());

        await user.click(screen.getByRole('button', { name: /clear/i }));

        expect(onChange).toHaveBeenCalledWith(null);
      });
    });
  });

  describe('SearchableSelectField (react-hook-form)', () => {
    describe('multiple', () => {
      type FormValues = { field: string[] };

      const ControlledMultiple = () => {
        const { control } = useForm<FormValues>({
          defaultValues: { field: [] },
        });
        return (
          <SearchableSelectField
            {...baseProps}
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
              <SearchableSelectField
                {...baseProps}
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

      test('treats an undefined field value as no selection', async () => {
        const ControlledMultipleUndefined = () => {
          const { control } = useForm<FormValues>({
            defaultValues: { field: undefined },
          });
          return (
            <SearchableSelectField
              {...baseProps}
              multiple={true}
              control={control}
              name="field"
            />
          );
        };

        renderWithUI(withFreshSWR(<ControlledMultipleUndefined />));

        await waitFor(() => expect(mockAction).toHaveBeenCalled());
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
              <SearchableSelectField
                {...baseProps}
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
          <SearchableSelectField
            {...baseProps}
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
              <SearchableSelectField
                {...baseProps}
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

      test('clears the field to null when the selection is removed', async () => {
        const ControlledSingleWithDisplay = () => {
          const { control, watch } = useForm<FormValues>({
            defaultValues: { field: '1' },
          });
          const value = watch('field');
          return (
            <>
              <SearchableSelectField
                {...baseProps}
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

        await user.click(screen.getByRole('button', { name: /clear/i }));

        expect(screen.getByTestId('form-value')).toHaveTextContent('null');
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
              <SearchableSelectField
                {...baseProps}
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
