import { Circle } from '@chakra-ui/react';
import { Check } from 'lucide-react';

export default function StepIndicator({
  step,
  done = false,
}: {
  step: number;
  done?: boolean;
}) {
  return (
    <Circle
      size={6}
      fontSize="xs"
      borderWidth={1}
      color={done ? 'white' : 'fg.muted'}
      borderColor={done ? 'green.solid' : 'border'}
      backgroundColor={done ? 'green.solid' : 'transparent'}
    >
      {done ? <Check size={14} /> : step}
    </Circle>
  );
}
