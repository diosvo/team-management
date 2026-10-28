import { MOCK_LOCATION, MOCK_LOCATION_2 } from '@/test/mocks/location';
import {
  expectNoA11yViolations,
  renderWithUI,
  screen,
  waitFor,
  withFreshSWR,
} from '@/test/utilities';
import { useForm } from 'react-hook-form';

import { getLocations } from '@/actions/location';
import LocationSelection, { LocationLink } from './LocationSelection';

vi.mock('@/actions/location', () => ({
  getLocations: vi.fn(),
}));

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

    await expectNoA11yViolations(container);
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

describe('LocationLink', () => {
  test('renders a fallback when there is no name', () => {
    renderWithUI(<LocationLink name={null} />);

    expect(screen.getByText('Unknown')).toBeInTheDocument();
  });

  test('links to a Google Maps search for the location name', () => {
    renderWithUI(<LocationLink name="Court A" />);

    const link = screen.getByRole('link', { name: 'Court A' });
    expect(link).toHaveAttribute(
      'href',
      'https://www.google.com/maps/search/?api=1&query=Court%20A',
    );
    expect(link).toHaveAttribute('target', '_blank');
  });

  test('renders custom children instead of the name', () => {
    renderWithUI(<LocationLink name="Court A">Custom label</LocationLink>);

    expect(screen.getByText('Custom label')).toBeInTheDocument();
  });

  test('does not propagate the click to an ancestor row', async () => {
    const onRowClick = vi.fn();
    const { user } = renderWithUI(
      // eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events
      <div onClick={onRowClick}>
        <LocationLink name="Court A" />
      </div>,
    );

    await user.click(screen.getByRole('link', { name: 'Court A' }));

    expect(onRowClick).not.toHaveBeenCalled();
  });
});
