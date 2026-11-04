import { Badge } from '@chakra-ui/react';
import { Minus, TrendingDown, TrendingUp } from 'lucide-react';

/** Signed percentage change: green and up when positive, red and down when negative. */
export default function TrendBadge({ value }: { value: number }) {
  const [palette, Icon] =
    value > 0
      ? (['green', TrendingUp] as const)
      : value < 0
        ? (['red', TrendingDown] as const)
        : (['gray', Minus] as const);

  return (
    <Badge variant="surface" borderRadius="full" colorPalette={palette}>
      <Icon size={12} />
      {value > 0 ? '+' : ''}
      {value}%
    </Badge>
  );
}
