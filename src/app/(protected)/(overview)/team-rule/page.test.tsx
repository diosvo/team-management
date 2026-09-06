import { renderWithUI, screen } from '@/test/utilities';

import { getRule } from '@/actions/rule';

import TeamRulePage from './page';

vi.mock('@/actions/rule', () => ({
  getRule: vi.fn(),
  upsertRule: vi.fn(),
}));

// RuleEditor is covered by its own test; capture only the props the page
// wires through to it.
const ruleEditorSpy = { rule: undefined as unknown };

vi.mock('./_components/RuleEditor', () => ({
  default: (props: typeof ruleEditorSpy) => {
    Object.assign(ruleEditorSpy, props);
    return <div data-testid="rule-editor" />;
  },
}));

describe('TeamRulePage', () => {
  const mockGetRule = vi.mocked(getRule);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders RuleEditor', async () => {
    mockGetRule.mockResolvedValue(null);

    renderWithUI(await TeamRulePage());

    expect(screen.getByTestId('rule-editor')).toBeInTheDocument();
  });

  test('passes the fetched rule to RuleEditor', async () => {
    const mockRule = {
      rule_id: 'rule-1',
      team_id: 'team-1',
      content: 'Always respect each other.',
      created_at: new Date('2026-01-01'),
      updated_at: new Date('2026-01-15'),
    };
    mockGetRule.mockResolvedValue(mockRule);

    renderWithUI(await TeamRulePage());

    expect(ruleEditorSpy.rule).toEqual(mockRule);
  });

  test('passes null to RuleEditor when no rule exists', async () => {
    mockGetRule.mockResolvedValue(null);

    renderWithUI(await TeamRulePage());

    expect(ruleEditorSpy.rule).toBeNull();
  });
});
