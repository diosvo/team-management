import { ColorPalette } from '@chakra-ui/react';
import { axe } from 'jest-axe';
import { Clock, UserCheck, Users, UserX } from 'lucide-react';

import { renderWithUI, screen } from '@/test/utilities';
import Stats, { StatCard } from './Stats';

describe('Stats', () => {
  const defaultData: StatCard['data'] = {
    total: 100,
    active: 75,
    inactive: 20,
    pending: 5,
  };

  const defaultConfig: StatCard['config'] = [
    {
      key: 'total',
      label: 'Total Users',
      icon: Users,
      color: 'blue' as ColorPalette,
      suffix: 'user',
    },
    {
      key: 'active',
      label: 'Active Users',
      icon: UserCheck,
      color: 'green' as ColorPalette,
      suffix: 'user',
    },
    {
      key: 'inactive',
      label: 'Inactive Users',
      icon: UserX,
      color: 'red' as ColorPalette,
      suffix: 'user',
    },
    {
      key: 'pending',
      label: 'Pending Users',
      icon: Clock,
      color: 'orange' as ColorPalette,
      suffix: 'user',
    },
  ];

  const setup = (overrides: Partial<StatCard> = {}) => {
    const props: StatCard = {
      data: defaultData,
      config: defaultConfig,
      ...overrides,
    };
    const view = renderWithUI(<Stats {...props} />);

    return view;
  };

  test('should be accessible', async () => {
    const { container } = setup();

    const result = await axe(container);
    expect(result).toHaveNoViolations();
  });

  test('renders all stat cards with correct data', () => {
    const { container } = setup();

    const icons = container.querySelectorAll('svg');

    expect(icons).toHaveLength(4);

    defaultConfig.forEach(({ label, key }) => {
      expect(screen.getByText(label)).toBeInTheDocument();
      const value = defaultData[key as keyof typeof defaultData];
      expect(screen.getByText(String(value))).toBeInTheDocument();
    });
  });

  test('displays singular suffix for value of 1', () => {
    setup({
      data: { single: 1 },
      config: [
        {
          key: 'single',
          label: 'Single User',
          icon: Users,
          color: 'blue',
          suffix: 'user',
        },
      ],
    });

    expect(screen.getByText('user')).toBeInTheDocument();
    expect(screen.queryByText('users')).not.toBeInTheDocument();
  });

  test('displays plural suffix for value greater than 1', () => {
    setup({
      data: { multiple: 10 },
      config: [
        {
          key: 'multiple',
          label: 'Multiple Users',
          icon: Users,
          color: 'blue',
          suffix: 'user',
        },
      ],
    });

    expect(screen.getByText('users')).toBeInTheDocument();
  });

  test('displays suffix without pluralization for string values', () => {
    setup({
      data: { status: 'Active' },
      config: [
        {
          key: 'status',
          label: 'Status',
          icon: Users,
          color: 'blue',
          suffix: 'state',
        },
      ],
    });

    expect(screen.getByText('state')).toBeInTheDocument();
    expect(screen.queryByText('states')).not.toBeInTheDocument();
  });

  test('handles missing data keys by defaulting to 0', () => {
    setup({
      data: {},
      config: [
        {
          key: 'missing',
          label: 'Missing Data',
          icon: Users,
          color: 'blue',
        },
      ],
    });

    expect(screen.getByText('0')).toBeInTheDocument();
  });

  test('calls onClick handler when card is clicked', async () => {
    const onClick = vi.fn();
    const { user } = setup({
      config: [
        {
          key: 'total',
          label: 'Total Users',
          icon: Users,
          color: 'blue',
          onClick,
        },
      ],
    });

    const card = screen.getByText('Total Users').closest('.chakra-stack');
    await user.click(card!);

    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
