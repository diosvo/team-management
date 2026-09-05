import { MOCK_RULE } from '@/test/mocks/rule';
import {
  act,
  createPermissionsMock,
  createToasterMock,
  mockToaster,
  renderWithUI,
  screen,
  setupTestLifecycle,
  waitFor,
} from '@/test/utilities';

import { upsertRule } from '@/actions/rule';
import usePermissions from '@/hooks/use-permissions';

import type { NullishRule } from '@/drizzle/schema/rule';

import RuleEditor from './RuleEditor';

vi.mock('@/actions/rule', () => ({
  getRule: vi.fn(),
  upsertRule: vi.fn(),
}));

vi.mock('@/hooks/use-permissions', () => ({ default: vi.fn() }));

vi.mock('@/components/ui/toaster', () => createToasterMock());

// Stub TextEditor – the heavy Tiptap editor is tested in isolation.
// Capture all props so tests can inspect and invoke callbacks.
type EditorProps = {
  editable: boolean;
  content: string;
  onSave: (content: string) => void;
  onCancel: () => void;
  lastUpdated?: Date;
};

const editorSpy: EditorProps = {
  editable: false,
  content: '',
  onSave: () => {},
  onCancel: () => {},
};

vi.mock('@/components/TextEditor', () => ({
  default: (props: EditorProps) => {
    Object.assign(editorSpy, props);
    return (
      <div
        data-testid="text-editor"
        data-editable={String(props.editable)}
        data-content={props.content}
      />
    );
  },
}));

describe('RuleEditor', () => {
  const mockUsePermissions = vi.mocked(usePermissions);
  const mockUpsertRule = vi.mocked(upsertRule);

  const setup = (rule: NullishRule = MOCK_RULE, canEdit = false) => {
    mockUsePermissions.mockReturnValue(
      createPermissionsMock({
        can: (resource, action) =>
          canEdit && resource === 'team-rule' && action === 'edit',
      }),
    );

    return renderWithUI(<RuleEditor rule={rule} />);
  };

  setupTestLifecycle();

  describe('initial rendering', () => {
    test('displays the page title', () => {
      setup();

      // PageTitle embeds an SVG image inside the heading, so the accessible
      // name becomes "Team RuleSquiggle". Match with a leading-text regex.
      expect(
        screen.getByRole('heading', { name: /^team rule/i }),
      ).toBeInTheDocument();
    });

    test('passes the rule content to TextEditor', () => {
      setup();

      expect(editorSpy.content).toBe(MOCK_RULE.content);
    });

    test('uses a default message when no rule is provided', () => {
      setup(null);

      expect(editorSpy.content).toBe(
        'Please wait for admin to set up the rule.',
      );
    });

    test('starts in read-only mode (editable=false)', () => {
      setup();

      expect(screen.getByTestId('text-editor')).toHaveAttribute(
        'data-editable',
        'false',
      );
    });

    test('passes lastUpdated to TextEditor', () => {
      setup();

      expect(editorSpy.lastUpdated).toEqual(MOCK_RULE.updated_at);
    });
  });

  describe('edit button visibility', () => {
    test('shows the edit button for authorised users', () => {
      setup(MOCK_RULE, true);

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    test('hides the edit button for unauthorised users', () => {
      setup(MOCK_RULE, false);

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });

  describe('toggling edit mode', () => {
    test('enables the editor when the edit button is clicked', async () => {
      const { user } = setup(MOCK_RULE, true);

      await user.click(screen.getByRole('button'));

      expect(screen.getByTestId('text-editor')).toHaveAttribute(
        'data-editable',
        'true',
      );
    });

    test('switches back to read-only when the editor onCancel is called', async () => {
      const { user } = setup(MOCK_RULE, true);

      await user.click(screen.getByRole('button'));

      act(() => editorSpy.onCancel());

      expect(screen.getByTestId('text-editor')).toHaveAttribute(
        'data-editable',
        'false',
      );
    });

    test('clicking the button again while editing switches back to preview', async () => {
      const { user } = setup(MOCK_RULE, true);

      await user.click(screen.getByRole('button')); // enter edit
      await user.click(screen.getByRole('button')); // back to preview

      expect(screen.getByTestId('text-editor')).toHaveAttribute(
        'data-editable',
        'false',
      );
    });
  });

  describe('saving', () => {
    test('shows a loading toast and calls upsertRule', async () => {
      mockUpsertRule.mockResolvedValue({
        success: true,
        message: 'Updated rule successfully',
      });
      const { user } = setup(MOCK_RULE, true);

      await user.click(screen.getByRole('button'));

      await act(async () => {
        editorSpy.onSave('New content');
      });

      expect(mockToaster.create).toHaveBeenCalledWith({
        type: 'loading',
        title: 'Updating rules...',
      });
      expect(mockUpsertRule).toHaveBeenCalledWith('New content');
    });

    test('shows a success toast and exits edit mode on success', async () => {
      mockUpsertRule.mockResolvedValue({
        success: true,
        message: 'Updated rule successfully',
      });
      const { user } = setup(MOCK_RULE, true);

      await user.click(screen.getByRole('button'));

      await act(async () => {
        editorSpy.onSave('New content');
      });

      expect(mockToaster.update).toHaveBeenCalledWith('toast-id', {
        type: 'success',
        title: 'Updated rule successfully',
      });
      await waitFor(() =>
        expect(screen.getByTestId('text-editor')).toHaveAttribute(
          'data-editable',
          'false',
        ),
      );
    });

    test('shows an error toast and keeps edit mode active on failure', async () => {
      mockUpsertRule.mockResolvedValue({
        success: false,
        message: 'Database error',
      });
      const { user } = setup(MOCK_RULE, true);

      await user.click(screen.getByRole('button'));

      await act(async () => {
        editorSpy.onSave('Bad content');
      });

      expect(mockToaster.update).toHaveBeenCalledWith('toast-id', {
        type: 'error',
        title: 'Database error',
      });
      await waitFor(() =>
        expect(screen.getByTestId('text-editor')).toHaveAttribute(
          'data-editable',
          'true',
        ),
      );
    });
  });
});
