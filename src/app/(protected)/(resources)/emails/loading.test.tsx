import { renderWithUI, screen } from '@/test/utilities';

import Loading from './loading';

vi.mock('./_components/EmailPreview', () => ({
  default: () => <div data-testid="email-preview" />,
}));

describe('Loading', () => {
  test('renders the sent and preview section titles', async () => {
    renderWithUI(await Loading());

    expect(screen.getByText('Sent Emails')).toBeInTheDocument();
    expect(screen.getByText('Email Preview')).toBeInTheDocument();
    expect(screen.getByTestId('email-preview')).toBeInTheDocument();
  });
});
