import { MOCK_AWAY_TEAM } from '@/test/mocks/team';
import {
  act,
  createToasterMock,
  expectNoA11yViolations,
  mockToaster,
  renderWithUI,
  screen,
  setupTestLifecycle,
  waitFor,
} from '@/test/utilities';

import { uploadLogo, upsertTeam } from '@/actions/team';
import { useTeamLogo } from '@/hooks/use-image';

import { UpsertTeam } from './UpsertTeam';

vi.mock('@/actions/team', () => ({
  upsertTeam: vi.fn(),
  uploadLogo: vi.fn(),
}));

vi.mock('@/hooks/use-image', () => ({
  useTeamLogo: vi.fn(() => ({ data: undefined, isLoading: false })),
}));

vi.mock('@/components/ui/toaster', () => createToasterMock());

const logoFile = new File(['logo'], 'logo.png', { type: 'image/png' });
vi.mock('@/components/common/ImageUploader', () => ({
  default: ({
    fallback,
    onChange,
  }: {
    fallback: React.ReactNode;
    onChange: (file: File) => void;
  }) => (
    <>
      <span data-testid="logo-fallback">{fallback}</span>
      <button type="button" onClick={() => onChange(logoFile)}>
        ImageUploader
      </button>
    </>
  ),
}));

describe('UpsertTeam', () => {
  const mockUpsertTeam = vi.mocked(upsertTeam);
  const mockUploadLogo = vi.mocked(uploadLogo);
  const mockUseTeamLogo = vi.mocked(useTeamLogo);

  const open = async (
    action: 'Add' | 'Update' = 'Add',
    item: Record<string, unknown> = { team_id: '' },
  ) => {
    const view = renderWithUI(<UpsertTeam.Viewport />);

    // Match the id the component closes on submit for the "Update" action.
    const id = action === 'Update' ? 'update-team' : 'add-team';
    await act(async () => {
      UpsertTeam.open(id, { action, item });
    });

    return view;
  };

  setupTestLifecycle();

  afterEach(() => {
    act(() => {
      UpsertTeam.removeAll();
    });
  });

  test('should be accessible', async () => {
    await open();

    await expectNoA11yViolations();
  });

  test('renders the dialog title and fields for the given action', async () => {
    await open('Add');

    expect(await screen.findByText('Add Team')).toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Establish Year')).toBeInTheDocument();
  });

  test('keeps the submit button disabled while the form is untouched', async () => {
    await open('Update', {
      team_id: MOCK_AWAY_TEAM.team_id,
      name: MOCK_AWAY_TEAM.name,
      email: MOCK_AWAY_TEAM.email,
      establish_year: MOCK_AWAY_TEAM.establish_year,
    });

    const submit = await screen.findByRole('button', { name: /update/i });

    expect(submit).toBeDisabled();
  });

  test('submits the entered values through upsertTeam', async () => {
    mockUpsertTeam.mockResolvedValue({ success: true, message: 'Saved' });

    const { user } = await open('Update', {
      team_id: MOCK_AWAY_TEAM.team_id,
      name: MOCK_AWAY_TEAM.name,
      email: MOCK_AWAY_TEAM.email,
      establish_year: MOCK_AWAY_TEAM.establish_year,
    });

    const name = await screen.findByPlaceholderText('Basketball Club');
    await user.type(name, ' Updated');

    const submit = await screen.findByRole('button', { name: /update/i });
    await waitFor(() => expect(submit).toBeEnabled());
    await user.click(submit);

    await waitFor(() => {
      expect(mockUpsertTeam).toHaveBeenCalledWith(
        MOCK_AWAY_TEAM.team_id,
        expect.objectContaining({ name: `${MOCK_AWAY_TEAM.name} Updated` }),
      );
    });
  });

  test('uploads a new logo through uploadLogo', async () => {
    mockUploadLogo.mockResolvedValue({
      success: true,
      message: 'Uploaded logo successfully',
      data: { image: 'teams/hcm-new.png' },
    });

    const { user } = await open('Update', {
      team_id: MOCK_AWAY_TEAM.team_id,
      name: MOCK_AWAY_TEAM.name,
      image: MOCK_AWAY_TEAM.image,
    });

    await user.click(
      await screen.findByRole('button', { name: 'ImageUploader' }),
    );

    await waitFor(() => {
      expect(mockUploadLogo).toHaveBeenCalledWith(
        MOCK_AWAY_TEAM.team_id,
        MOCK_AWAY_TEAM.image,
        logoFile,
      );
    });
    expect(mockUpsertTeam).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(mockUseTeamLogo).toHaveBeenLastCalledWith('teams/hcm-new.png'),
    );
  });

  test('keeps the current logo and shows an error toast when the upload fails', async () => {
    mockUploadLogo.mockResolvedValue({
      success: false,
      message: 'Upload failed',
    });

    const { user } = await open('Update', {
      team_id: MOCK_AWAY_TEAM.team_id,
      name: MOCK_AWAY_TEAM.name,
      image: MOCK_AWAY_TEAM.image,
    });

    await user.click(
      await screen.findByRole('button', { name: 'ImageUploader' }),
    );

    await waitFor(() =>
      expect(mockToaster.update).toHaveBeenCalledWith(
        'toast-id',
        expect.objectContaining({ type: 'error', title: 'Upload failed' }),
      ),
    );
    expect(mockUseTeamLogo).toHaveBeenLastCalledWith(MOCK_AWAY_TEAM.image);
  });

  test('uses the team name as the logo fallback', async () => {
    await open('Update', {
      team_id: MOCK_AWAY_TEAM.team_id,
      name: MOCK_AWAY_TEAM.name,
    });

    expect(await screen.findByTestId('logo-fallback')).toHaveTextContent(
      MOCK_AWAY_TEAM.name,
    );
  });

  test('falls back to a placeholder icon when the team has no name', async () => {
    await open('Update', { team_id: MOCK_AWAY_TEAM.team_id, name: '' });

    const fallback = await screen.findByTestId('logo-fallback');
    expect(fallback).toHaveTextContent('');
    expect(fallback.querySelector('svg')).toBeInTheDocument();
  });

  test('shows an error toast when upsertTeam fails', async () => {
    mockUpsertTeam.mockResolvedValue({ success: false, message: 'Name taken' });

    const { user } = await open('Update', {
      team_id: MOCK_AWAY_TEAM.team_id,
      name: MOCK_AWAY_TEAM.name,
    });

    const name = await screen.findByPlaceholderText('Basketball Club');
    await user.type(name, ' Updated');

    const submit = await screen.findByRole('button', { name: /update/i });
    await waitFor(() => expect(submit).toBeEnabled());
    await user.click(submit);

    await waitFor(() => expect(mockUpsertTeam).toHaveBeenCalled());
  });

  test('adds a new team and resets the form on success', async () => {
    mockUpsertTeam.mockResolvedValue({ success: true, message: 'Saved' });

    const { user } = await open('Add');

    const name = await screen.findByPlaceholderText('Basketball Club');
    await user.type(name, 'New Team');

    const submit = await screen.findByRole('button', { name: /add/i });
    await waitFor(() => expect(submit).toBeEnabled());
    await user.click(submit);

    await waitFor(() =>
      expect(mockUpsertTeam).toHaveBeenCalledWith(
        '',
        expect.objectContaining({ name: 'New Team' }),
      ),
    );
  });
});
