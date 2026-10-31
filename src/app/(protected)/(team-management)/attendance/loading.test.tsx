import { renderWithUI, screen } from '@/test/utilities';

import AttendanceLoading from './loading';

describe('AttendanceLoading', () => {
  test('renders the page title', async () => {
    renderWithUI(await AttendanceLoading());

    expect(
      screen.getByRole('heading', { name: new RegExp('^Training Attendance') }),
    ).toBeInTheDocument();
  });
});
