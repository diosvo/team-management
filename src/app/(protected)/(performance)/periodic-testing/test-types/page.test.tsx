import { axe } from 'jest-axe';
import { Mock } from 'vitest';

import {
  MOCK_TEST_TYPE,
  MOCK_TEST_TYPE_2,
} from '@/test/mocks/periodic-testing';
import { renderWithUI, screen } from '@/test/utilities';

import { getTestTypes } from '@/actions/test-type';

import TestTypesPage, { metadata } from './page';

vi.mock('@/actions/test-type', () => ({
  getTestTypes: vi.fn(),
}));

// Child components are covered by their own tests; render markers here and
// capture the props the page wires through to them.
const propsSpy = {
  table: undefined as unknown,
};

vi.mock('./_components/TestTypesHeader', () => ({
  default: () => <div data-testid="header" />,
}));
vi.mock('./_components/TestTypesFilters', () => ({
  default: () => <div data-testid="filters" />,
}));
vi.mock('./_components/TestTypesTable', () => ({
  default: (props: unknown) => {
    propsSpy.table = props;
    return <div data-testid="table" />;
  },
}));

describe('TestTypesPage', () => {
  const mockGetTestTypes = getTestTypes as unknown as Mock;

  const setup = async (data = [MOCK_TEST_TYPE, MOCK_TEST_TYPE_2]) => {
    mockGetTestTypes.mockResolvedValue(data);

    return renderWithUI(await TestTypesPage());
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('exposes page metadata', () => {
    expect(metadata.title).toBe('Test Types');
    expect(metadata.description).toBe(
      'Manage and configure test types for periodic testing',
    );
  });

  test('should be accessible', async () => {
    const { container } = await setup();

    const result = await axe(container);
    expect(result).toHaveNoViolations();
  });

  test('renders every section', async () => {
    await setup();

    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('filters')).toBeInTheDocument();
    expect(screen.getByTestId('table')).toBeInTheDocument();
  });

  test('fetches the test types', async () => {
    await setup();

    expect(mockGetTestTypes).toHaveBeenCalled();
  });

  test('passes the fetched types to the table', async () => {
    await setup([MOCK_TEST_TYPE]);

    expect(propsSpy.table).toEqual({ data: [MOCK_TEST_TYPE] });
  });
});
