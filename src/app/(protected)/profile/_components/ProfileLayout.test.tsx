import type { User } from '@/drizzle/schema';

import { MOCK_USER } from '@/test/mocks/user';
import {
  renderWithUI,
  screen,
  setupTestLifecycle,
  waitFor,
} from '@/test/utilities';

import ProfileLayout from './ProfileLayout';

// Isolate the layout from its children; each child has its own test file.
vi.mock('./AvatarUploader', () => ({
  default: ({ user }: { user: User }) => (
    <div data-testid="avatar-card">{user.name}</div>
  ),
}));

vi.mock('./PersonalInfo', () => ({
  default: ({ viewOnly }: { user: User; viewOnly: boolean }) => (
    <div data-testid="personal-info">personal:{String(viewOnly)}</div>
  ),
}));

vi.mock('./TeamInfo', () => ({
  default: ({ viewOnly }: { user: User; viewOnly: boolean }) => (
    <div data-testid="team-info">team:{String(viewOnly)}</div>
  ),
}));

describe('ProfileLayout', () => {
  setupTestLifecycle();

  const setup = (viewOnly = false) =>
    renderWithUI(<ProfileLayout user={MOCK_USER} viewOnly={viewOnly} />);

  test('renders a tab for each profile section', async () => {
    setup();

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: 'Overview' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Personal' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Team' })).toBeInTheDocument();
    });
  });

  test('selects the Overview tab by default', async () => {
    setup();

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: 'Overview' })).toHaveAttribute(
        'aria-selected',
        'true',
      );
    });
  });

  test('forwards the user to the avatar card', async () => {
    setup();

    await waitFor(() => {
      expect(screen.getByTestId('avatar-card')).toHaveTextContent(
        MOCK_USER.name,
      );
    });
  });

  test('forwards the viewOnly flag to the personal and team sections', async () => {
    setup(true);

    await waitFor(() => {
      expect(screen.getByTestId('personal-info')).toHaveTextContent(
        'personal:true',
      );
      expect(screen.getByTestId('team-info')).toHaveTextContent('team:true');
    });
  });

  test('activates a section when its tab is clicked', async () => {
    const { user } = setup();

    await user.click(screen.getByRole('tab', { name: 'Personal' }));

    expect(screen.getByRole('tab', { name: 'Personal' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });
});
