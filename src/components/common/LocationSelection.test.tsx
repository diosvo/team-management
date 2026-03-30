import { axe } from 'jest-axe';
import { useForm } from 'react-hook-form';
import { SWRConfig } from 'swr';

import { MOCK_LOCATION, MOCK_LOCATION_2 } from '@/test/mocks/location';
import { renderWithUI, screen, waitFor } from '@/test/utilities';

import { getLocations } from '@/actions/location';
import LocationSelection from './LocationSelection';

vi.mock('@/actions/location', () => ({
  getLocations: vi.fn(),
}));

const withFreshSWR = (ui: React.ReactElement) => (
  <SWRConfig value={{ provider: () => new Map() }}>{ui}</SWRConfig>
);

type FormValues = { location_id: Nullable<string> };

const TestForm = ({ isDisabled = false }: { isDisabled?: boolean }) => {
  const { control } = useForm<FormValues>({
    defaultValues: { location_id: null },
  });
  return <LocationSelection control={control} isDisabled={isDisabled} />;
};

describe('LocationSelection', () => {
  const mockGetLocations = vi.mocked(getLocations);

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetLocations.mockResolvedValue([MOCK_LOCATION, MOCK_LOCATION_2]);
  });

  const setup = async (overrides: { isDisabled?: boolean } = {}) => {
    const component = renderWithUI(withFreshSWR(<TestForm {...overrides} />));
    const placeholder = screen.getByPlaceholderText('Type to search');

    await waitFor(() => expect(mockGetLocations).toHaveBeenCalled());

    return { placeholder, ...component };
  };

  test('should be accessible', async () => {
    const { container } = await setup();

    const result = await axe(container);
    expect(result).toHaveNoViolations();
  });

  test('renders with label', async () => {
    setup();

    expect(screen.getByText(/Select locations/i)).toBeInTheDocument();
  });

  test('renders location items when dropdown is opened', async () => {
    const { user, placeholder } = await setup();

    await user.click(placeholder);

    expect(await screen.findByText(MOCK_LOCATION.name)).toBeInTheDocument();
    expect(screen.getByText(MOCK_LOCATION_2.name)).toBeInTheDocument();
  });

  test('renders location address under the name', async () => {
    const { user, placeholder } = await setup();

    await user.click(placeholder);

    expect(await screen.findByText(MOCK_LOCATION.address)).toBeInTheDocument();
    expect(screen.getByText(MOCK_LOCATION_2.address)).toBeInTheDocument();
  });

  test('displays empty state when no locations found', async () => {
    mockGetLocations.mockResolvedValue([]);
    const { user, placeholder } = await setup();

    await user.click(placeholder);

    expect(screen.getByText('No locations found.')).toBeInTheDocument();
  });

  test('filters locations based on input', async () => {
    const { user, placeholder } = await setup();

    await user.click(placeholder);
    await screen.findByText(MOCK_LOCATION.name);

    await user.type(placeholder, 'B');

    await waitFor(() => {
      expect(screen.getByText(MOCK_LOCATION_2.name)).toBeInTheDocument();
      expect(screen.queryByText(MOCK_LOCATION.name)).not.toBeInTheDocument();
    });
  });

  test('updates form value on selection', async () => {
    const TestFormWithDisplay = () => {
      const { control, watch } = useForm<FormValues>({
        defaultValues: { location_id: null },
      });
      const value = watch('location_id');
      return (
        <>
          <LocationSelection control={control} />
          <div data-testid="form-value">{JSON.stringify(value)}</div>
        </>
      );
    };

    const { user } = renderWithUI(withFreshSWR(<TestFormWithDisplay />));

    await waitFor(() => expect(mockGetLocations).toHaveBeenCalled());

    await user.click(screen.getByPlaceholderText('Type to search'));
    await user.click(await screen.findByText(MOCK_LOCATION.name));

    expect(screen.getByTestId('form-value')).toHaveTextContent(
      JSON.stringify(MOCK_LOCATION.location_id),
    );
  });

  test('is disabled when isDisabled is true', async () => {
    const { placeholder } = await setup({ isDisabled: true });
    expect(placeholder).toBeDisabled();
  });
});
