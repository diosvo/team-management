import { Mock } from 'vitest';

import { MOCK_AWAY_TEAM } from '@/test/mocks/team';
import { act, renderWithUI, screen, waitFor } from '@/test/utilities';

import { uploadLogo, upsertTeam } from '@/actions/team';

import { UpsertTeam } from './UpsertTeam';

vi.mock('@/actions/team', () => ({
  upsertTeam: vi.fn(),
  uploadLogo: vi.fn(),
}));

vi.mock('@/hooks/use-image', () => ({
  useTeamLogo: vi.fn(() => ({ data: undefined, isLoading: false })),
}));

vi.mock('@/components/ui/toaster', () => ({
  toaster: {
    create: vi.fn(() => 'toast-id'),
    update: vi.fn(),
  },
}));

const logoFile = new File(['logo'], 'logo.png', { type: 'image/png' });
vi.mock('@/components/common/ImageUploader', () => ({
  default: ({ onChange }: { onChange: (file: File) => void }) => (
    <button type="button" onClick={() => onChange(logoFile)}>
      ImageUploader
    </button>
  ),
}));

describe('UpsertTeam', () => {
  const mockUpsertTeam = upsertTeam as unknown as Mock;
  const mockUploadLogo = uploadLogo as unknown as Mock;

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

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    act(() => {
      UpsertTeam.removeAll();
    });
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
  });
});
