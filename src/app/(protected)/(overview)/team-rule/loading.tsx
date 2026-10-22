import { Button, HStack, Skeleton, SkeletonText } from '@chakra-ui/react';
import { Copy } from 'lucide-react';

import PageTitle from '@/components/PageTitle';

// Mirrors `TextEditor` in preview mode: title + copy action, then the content.
export default function Loading() {
  return (
    <>
      <HStack justifyContent="space-between" flexWrap="wrap">
        <PageTitle title="Team Rule" />
        <Skeleton>
          <Button size="sm">
            <Copy />
            Copy
          </Button>
        </Skeleton>
      </HStack>
      <SkeletonText noOfLines={16} gap={4} />
    </>
  );
}
