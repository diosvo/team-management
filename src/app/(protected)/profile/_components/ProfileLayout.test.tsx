import type { User } from '@/drizzle/schema';
import { MOCK_USER } from '@/test/mocks/user';
import { renderWithUI, screen, setupTestLifecycle } from '@/test/utilities';

import ProfileLayout from './ProfileLayout';

// Isolate the layout from its children; each child has its own test file.
vi.mock('./ProfileHeader', () => ({
  default: ({ user, viewOnly }: { user: User; viewOnly: boolean }) => (
    <div data-testid="profile-header">
      {user.name}:{String(viewOnly)}
    </div>
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

  test('shows every section at once, header first, without tabs', () => {
    setup();

    const sections = [
      screen.getByTestId('profile-header'),
      screen.getByTestId('personal-info'),
      screen.getByTestId('team-info'),
    ];
    expect(screen.queryByRole('tab')).not.toBeInTheDocument();
    // Document order: header, then personal, then team.
    sections.reduce((previous, next) => {
      expect(
        previous.compareDocumentPosition(next) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
      return next;
    });
  });

  test.each([true, false])(
    'forwards the user and viewOnly=%s to every section',
    (viewOnly) => {
      setup(viewOnly);

      expect(screen.getByTestId('profile-header')).toHaveTextContent(
        `${MOCK_USER.name}:${viewOnly}`,
      );
      expect(screen.getByTestId('personal-info')).toHaveTextContent(
        `personal:${viewOnly}`,
      );
      expect(screen.getByTestId('team-info')).toHaveTextContent(
        `team:${viewOnly}`,
      );
    },
  );
});
