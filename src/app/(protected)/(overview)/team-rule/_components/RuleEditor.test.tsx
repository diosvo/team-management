import type { ComponentProps } from 'react';

import { MOCK_RULE } from '@/test/mocks/rule';
import {
  createPermissionsMock,
  createToasterMock,
  mockToaster,
  renderWithUI,
  screen,
  setupTestLifecycle,
} from '@/test/utilities';

import { upsertRule } from '@/actions/rule';
import usePermissions from '@/hooks/use-permissions';

import type { NullishRule } from '@/drizzle/schema/rule';

import type TextEditor from '@/components/editor/TextEditor';

import RuleEditor from './RuleEditor';

vi.mock('@/actions/rule', () => ({
  getRule: vi.fn(),
  upsertRule: vi.fn(),
}));

vi.mock('@/hooks/use-permissions', () => ({ default: vi.fn() }));

vi.mock('@/components/ui/toaster', () => createToasterMock());

// Stub TextEditor: the Tiptap editor is tested in isolation. Capture its props
// so tests can inspect them and invoke onSave.
type EditorProps = ComponentProps<typeof TextEditor>;

const editorSpy = {} as EditorProps;

vi.mock('@/components/editor/TextEditor', () => ({
  default: (props: EditorProps) => {
    Object.assign(editorSpy, props);
    return <div data-testid="text-editor">{props.header}</div>;
  },
}));

describe('RuleEditor', () => {
  const mockUsePermissions = vi.mocked(usePermissions);
  const mockUpsertRule = vi.mocked(upsertRule);

  const setup = async (rule: NullishRule = MOCK_RULE, canEdit = false) => {
    mockUsePermissions.mockReturnValue(
      createPermissionsMock({
        can: (resource, action) =>
          canEdit && resource === 'team-rule' && action === 'edit',
      }),
    );

    const result = renderWithUI(<RuleEditor rule={rule} />);

    // The editor is a client-only dynamic chunk; wait for it to resolve.
    await screen.findByTestId('text-editor');

    return result;
  };

  setupTestLifecycle();

  describe('rendering', () => {
    test('passes the page title as the editor header', async () => {
      await setup();

      // PageTitle embeds an SVG image inside the heading, so the accessible
      // name becomes "Team RuleSquiggle". Match with a leading-text regex.
      expect(
        screen.getByRole('heading', { name: /^team rule/i }),
      ).toBeInTheDocument();
    });

    test('passes the rule content to the editor', async () => {
      await setup();

      expect(editorSpy.content).toBe(MOCK_RULE.content);
    });

    test('uses a default message when no rule is provided', async () => {
      await setup(null);

      expect(editorSpy.content).toBe(
        'Please wait for admin to set up the rule.',
      );
    });

    test('passes lastUpdated to the editor', async () => {
      await setup();

      expect(editorSpy.lastUpdated).toEqual(MOCK_RULE.updated_at);
    });
  });

  describe('permissions', () => {
    test('lets authorised users edit', async () => {
      await setup(MOCK_RULE, true);

      expect(editorSpy.canEdit).toBe(true);
    });

    test('blocks unauthorised users from editing', async () => {
      await setup(MOCK_RULE, false);

      expect(editorSpy.canEdit).toBe(false);
    });
  });

  describe('saving', () => {
    test('shows a loading toast and calls upsertRule', async () => {
      mockUpsertRule.mockResolvedValue({
        success: true,
        message: 'Updated rule successfully',
      });
      await setup(MOCK_RULE, true);

      await editorSpy.onSave('New content');

      expect(mockToaster.create).toHaveBeenCalledWith({
        type: 'loading',
        title: 'Updating rules...',
      });
      expect(mockUpsertRule).toHaveBeenCalledWith('New content');
    });

    test('shows a success toast and resolves true on success', async () => {
      mockUpsertRule.mockResolvedValue({
        success: true,
        message: 'Updated rule successfully',
      });
      await setup(MOCK_RULE, true);

      await expect(editorSpy.onSave('New content')).resolves.toBe(true);

      expect(mockToaster.update).toHaveBeenCalledWith('toast-id', {
        type: 'success',
        title: 'Updated rule successfully',
      });
    });

    test('shows an error toast and resolves false on failure', async () => {
      mockUpsertRule.mockResolvedValue({
        success: false,
        message: 'Database error',
      });
      await setup(MOCK_RULE, true);

      await expect(editorSpy.onSave('Bad content')).resolves.toBe(false);

      expect(mockToaster.update).toHaveBeenCalledWith('toast-id', {
        type: 'error',
        title: 'Database error',
      });
    });
  });
});
