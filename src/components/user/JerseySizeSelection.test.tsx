import { useForm } from 'react-hook-form';

import {
  expectNoA11yViolations,
  renderWithUI,
  screen,
  setupTestLifecycle,
} from '@/test/utilities';

import JerseySizeSelection from './JerseySizeSelection';

type Values = { size: Nullable<string> };

let latest: Values;

function Harness({
  size = null,
  options,
}: {
  size?: Nullable<string>;
  options?: Array<{ label: string; value: string }>;
}) {
  const { control, watch } = useForm<Values>({ defaultValues: { size } });
  latest = watch();
  return (
    <JerseySizeSelection
      control={control}
      name="size"
      label="Size áo"
      options={options}
    />
  );
}

describe('JerseySizeSelection', () => {
  setupTestLifecycle();

  test('should be accessible', async () => {
    renderWithUI(<Harness />);

    await expectNoA11yViolations();
  });

  test('shows the current size', () => {
    renderWithUI(<Harness size="XL" />);

    expect(screen.getByRole('combobox', { name: 'Size áo' })).toHaveTextContent(
      'XL',
    );
  });

  test('offers every size and stores the pick', async () => {
    const { user } = renderWithUI(<Harness />);

    await user.click(screen.getByRole('combobox', { name: 'Size áo' }));
    const options = await screen.findAllByRole('option');
    expect(options.map((option) => option.textContent)).toEqual([
      'XS',
      'S',
      'M',
      'L',
      'XL',
      '2XL',
      '3XL',
      '4XL',
    ]);

    await user.click(screen.getByRole('option', { name: '2XL' }));
    expect(latest.size).toBe('2XL');
  });

  test('offers custom options instead of sizes', async () => {
    const { user } = renderWithUI(
      <Harness
        options={[
          { label: 'Form ngắn', value: 'short' },
          { label: 'Form tiêu chuẩn', value: 'standard' },
        ]}
      />,
    );

    await user.click(screen.getByRole('combobox', { name: 'Size áo' }));
    await user.click(await screen.findByRole('option', { name: 'Form ngắn' }));

    expect(latest.size).toBe('short');
  });
});
