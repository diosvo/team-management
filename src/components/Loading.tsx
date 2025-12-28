import { Progress } from '@chakra-ui/react';

export default function Loading() {
  return (
    <Progress.Root size="xs" value={null} variant="outline" animated striped>
      <Progress.Track>
        <Progress.Range />
      </Progress.Track>
    </Progress.Root>
  );
}
