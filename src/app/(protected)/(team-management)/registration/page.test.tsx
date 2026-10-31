import { renderWithUI, screen } from '@/test/utilities';

import RegistrationPage, { generateMetadata } from './page';

vi.mock('./_components/RegistrationIntro', () => ({
  default: () => <div data-testid="intro" />,
}));
vi.mock('./_components/main', () => ({
  default: () => <div data-testid="client" />,
}));

describe('RegistrationPage', () => {
  test('exposes page metadata', async () => {
    const metadata = await generateMetadata();

    expect(metadata.title).toBe('Tournament Registration');
  });

  test('renders the intro and client sections', () => {
    renderWithUI(<RegistrationPage />);

    expect(screen.getByTestId('intro')).toBeInTheDocument();
    expect(screen.getByTestId('client')).toBeInTheDocument();
  });
});
