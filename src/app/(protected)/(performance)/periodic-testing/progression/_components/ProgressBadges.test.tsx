import { PerformanceBand, ProgressStatus } from '@/utils/enum';

import { enumText, renderWithUI, screen } from '@/test/utilities';

import { BandBadge, ChangeText, StatusBadge } from './ProgressBadges';

describe('ProgressBadges', () => {
  test('StatusBadge shows the translated status', () => {
    renderWithUI(<StatusBadge status={ProgressStatus.PLATEAUING} />);

    expect(
      screen.getByText(enumText('progressStatus', ProgressStatus.PLATEAUING)),
    ).toBeInTheDocument();
  });

  test('BandBadge shows the translated band', () => {
    renderWithUI(<BandBadge band={PerformanceBand.ON_TARGET} />);

    expect(
      screen.getByText(enumText('performanceBand', PerformanceBand.ON_TARGET)),
    ).toBeInTheDocument();
  });

  test('BandBadge shows a dash without a band', () => {
    const { container } = renderWithUI(<BandBadge band={null} />);

    expect(container).toHaveTextContent('-');
  });

  test.each([
    [0.25, '+25.0%', 'green'],
    [-0.1, '-10.0%', 'red'],
    [0, '0.0%', 'GrayText'],
  ])('ChangeText formats %d as %s', (change, text) => {
    renderWithUI(<ChangeText change={change} count={2} />);

    expect(screen.getByText(text)).toBeInTheDocument();
  });

  test('ChangeText shows a dash with fewer than two tests', () => {
    const { container } = renderWithUI(<ChangeText change={0.5} count={1} />);

    expect(container).toHaveTextContent('-');
    expect(container).not.toHaveTextContent('%');
  });
});
