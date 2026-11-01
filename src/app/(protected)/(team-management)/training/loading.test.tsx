import { renderWithUI, screen } from '@/test/utilities';

import TrainingSessionsLoading from './loading';

describe('TrainingSessionsLoading', () => {
  test('renders the page title', async () => {
    renderWithUI(await TrainingSessionsLoading());

    expect(
      screen.getByRole('heading', { name: new RegExp('^Training Sessions') }),
    ).toBeInTheDocument();
  });
});
