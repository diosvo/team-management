import { Mock } from 'vitest';

import { renderWithUI, screen } from '@/test/utilities';

import { canCreateTestResult } from '@/actions/test-result';

import AddTestResultPage, { metadata } from './page';

vi.mock('@/actions/test-result', () => ({
  canCreateTestResult: vi.fn(),
}));

// The interactive client is covered by its own test; render a marker here.
vi.mock('./_components/AddTestResultPageClient', () => ({
  default: () => <div data-testid="client" />,
}));

describe('AddTestResultPage', () => {
  const mockCanCreate = canCreateTestResult as unknown as Mock;

  const setup = async () => renderWithUI(await AddTestResultPage());

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('exposes page metadata', () => {
    expect(metadata.title).toBe('Add Test Result');
    expect(metadata.description).toBe(
      'Add a new test result for periodic testing.',
    );
  });

  test('renders the title and the client when creation is allowed', async () => {
    mockCanCreate.mockResolvedValue(true);

    await setup();

    expect(screen.getByText('Add Test Result')).toBeInTheDocument();
    expect(screen.getByTestId('client')).toBeInTheDocument();
  });

  test('forbids access when creation is not allowed', async () => {
    mockCanCreate.mockResolvedValue(false);

    // `forbidden()` is mocked in the test setup to throw.
    await expect(AddTestResultPage()).rejects.toThrow('FORBIDDEN');
  });
});
