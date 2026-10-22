import { useForm } from 'react-hook-form';

import {
  expectNoA11yViolations,
  renderWithUI,
  screen,
  waitFor,
} from '@/test/utilities';

import type { Selection } from '@/utils/type';

import RadioGroupField from './RadioGroupField';

const OPTIONS: Selection<string> = [
  { label: 'Ball', value: 'ball', description: 'Round things' },
  { label: 'Net', value: 'net' },
  { label: 'Cone', value: 'cone' },
];

type FormValues = { category: string };

function Harness({
  onChange,
  ...props
}: Partial<React.ComponentProps<typeof RadioGroupField<FormValues>>> & {
  onChange?: (value: string) => void;
}) {
  const { control, watch } = useForm<FormValues>({
    defaultValues: { category: 'net' },
  });
  const value = watch('category');

  return (
    <>
      <RadioGroupField
        control={control}
        name="category"
        legend="Category"
        options={OPTIONS}
        {...props}
      />
      <output data-testid="value" onChange={() => onChange?.(value)}>
        {value}
      </output>
    </>
  );
}

describe('RadioGroupField', () => {
  const setup = (props?: React.ComponentProps<typeof Harness>) =>
    renderWithUI(<Harness {...props} />);

  test('should be accessible', async () => {
    const { container } = setup();

    await expectNoA11yViolations(container);
  });

  test('renders the legend and every option', () => {
    setup();

    expect(screen.getByText('Category')).toBeInTheDocument();
    expect(screen.getAllByRole('radio')).toHaveLength(3);
    expect(screen.getByRole('radio', { name: 'Ball' })).toBeInTheDocument();
  });

  test('reflects the form default and updates it on click', async () => {
    const { user } = setup();

    expect(screen.getByRole('radio', { name: 'Net' })).toBeChecked();

    await user.click(screen.getByRole('radio', { name: 'Cone' }));

    await waitFor(() =>
      expect(screen.getByTestId('value')).toHaveTextContent('cone'),
    );
    expect(screen.getByRole('radio', { name: 'Cone' })).toBeChecked();
  });

  test('shows the description as a tooltip on hover', async () => {
    const { user } = setup();

    await user.hover(screen.getByText('Ball'));

    expect(await screen.findByText('Round things')).toBeInTheDocument();
  });

  test('hides options flagged by isHidden', () => {
    setup({ isHidden: ({ value }) => value === 'cone' });

    // Hidden options leave the accessibility tree but stay in the form.
    expect(
      screen.queryByRole('radio', { name: 'Cone' }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('radio', { name: 'Cone', hidden: true }),
    ).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Ball' })).toBeVisible();
  });
});
