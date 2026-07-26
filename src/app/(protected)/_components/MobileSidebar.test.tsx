import { Mock } from 'vitest';

import { renderWithUI, screen } from '@/test/utilities';

import { useSessionContext } from '@/providers/session';

import MobileSidebar from './MobileSidebar';

vi.mock('@/providers/session', () => ({ useSessionContext: vi.fn() }));

// Stub the heavy Sidebar so MobileSidebar can be tested in isolation.
vi.mock('./Sidebar', () => ({
  default: () => <nav data-testid="sidebar" />,
}));

describe('MobileSidebar', () => {
  const mockUseSessionContext = useSessionContext as unknown as Mock;

  const setup = (isAuthenticated = true) => {
    mockUseSessionContext.mockReturnValue({ isAuthenticated });
    return renderWithUI(<MobileSidebar />);
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders nothing when there is no active session', () => {
    const { container } = setup(false);

    expect(container).toBeEmptyDOMElement();
  });

  test('renders the toggle button when a session exists', () => {
    setup();

    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  test('opens the drawer and shows the Sidebar when the button is clicked', async () => {
    const { user } = setup();

    await user.click(screen.getByRole('button'));

    expect(await screen.findByTestId('sidebar')).toBeInTheDocument();
  });
});
