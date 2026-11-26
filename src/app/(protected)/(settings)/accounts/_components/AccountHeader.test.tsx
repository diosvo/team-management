import { MOCK_ACCOUNT } from '@/test/mocks/account';
import { renderWithUI, screen, setupTestLifecycle } from '@/test/utilities';

import AccountHeader from './AccountHeader';

const { addUserProps } = vi.hoisted(() => ({
  addUserProps: { current: undefined as unknown },
}));

vi.mock('./AccountGuide', () => ({
  default: () => <button type="button">AccountGuide</button>,
}));

vi.mock('./AddUser', () => ({
  default: (props: unknown) => {
    addUserProps.current = props;
    return <button type="button">AddUser</button>;
  },
}));

describe('AccountHeader', () => {
  setupTestLifecycle();

  test('renders the title with the guide and the invite dialog', () => {
    renderWithUI(<AccountHeader accounts={[MOCK_ACCOUNT]} />);

    expect(
      screen.getByRole('heading', { name: /^Accounts/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'AccountGuide' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'AddUser' })).toBeInTheDocument();
  });

  test('hands the accounts to the invite dialog for duplicate checks', () => {
    renderWithUI(<AccountHeader accounts={[MOCK_ACCOUNT]} />);

    expect(addUserProps.current).toEqual({ members: [MOCK_ACCOUNT] });
  });
});
