import { expectNoA11yViolations, renderWithUI, screen } from '@/test/utilities';

import { DetailItem, DetailList, DetailSection } from './DetailList';

describe('DetailList', () => {
  test('should be accessible', async () => {
    const { container } = renderWithUI(
      <DetailList>
        <DetailItem label="Email">dios@team.com</DetailItem>
        <DetailItem label="Phone Number" />
      </DetailList>,
    );

    await expectNoA11yViolations(container);
  });

  test('pairs each label with its value', () => {
    renderWithUI(
      <DetailList>
        <DetailItem label="Email">dios@team.com</DetailItem>
      </DetailList>,
    );

    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('dios@team.com')).toBeInTheDocument();
    expect(screen.queryByText('Not provided')).not.toBeInTheDocument();
  });

  test.each([
    ['nothing', undefined],
    ['null', null],
    ['false', false],
    ['an empty string', ''],
  ])('reads "Not provided" for %s', (_, value) => {
    renderWithUI(
      <DetailList>
        <DetailItem label="Phone Number">{value}</DetailItem>
      </DetailList>,
    );

    expect(screen.getByText('Not provided')).toBeInTheDocument();
  });

  test('keeps a zero value', () => {
    renderWithUI(
      <DetailList>
        <DetailItem label="Jersey Number">{0}</DetailItem>
      </DetailList>,
    );

    expect(screen.getByText('0')).toBeInTheDocument();
  });

  test('follows the language toggle', () => {
    renderWithUI(
      <DetailList>
        <DetailItem label="Số điện thoại" />
      </DetailList>,
      { locale: 'vi' },
    );

    expect(screen.getByText('Chưa cung cấp')).toBeInTheDocument();
  });

  test('groups rows under a titled rule', () => {
    renderWithUI(
      <DetailSection title="Jersey">
        <DetailItem label="Number">#7</DetailItem>
        <DetailItem label="Shirt Size">M</DetailItem>
      </DetailSection>,
    );

    const heading = screen.getByRole('heading', { name: 'Jersey' });
    const section = heading.closest('section')!;
    expect(section).toHaveTextContent('Number#7');
    expect(section).toHaveTextContent('Shirt SizeM');
    // A rule on each side of the title.
    expect(section.querySelectorAll('[role="separator"], hr')).toHaveLength(2);
  });
});
