import { render, screen } from '@/test/utilities';

import ForbiddenLayout from './layout';

describe('ForbiddenLayout', () => {
  test('renders its children', () => {
    render(<ForbiddenLayout>Content</ForbiddenLayout>);

    expect(screen.getByText('Content')).toBeInTheDocument();
  });
});
