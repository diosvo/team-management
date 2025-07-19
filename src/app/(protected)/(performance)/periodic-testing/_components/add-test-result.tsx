'use client';

import { useRouter } from 'next/navigation';

import { Button } from '@chakra-ui/react';
import { Plus } from 'lucide-react';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface AddTestResultProps {
  // Future implementation: callback functions for adding test results
  // onAddResult?: (result: TestResult) => void;
  // onAddMultipleResults?: (results: TestResult[]) => void;
}

export default function AddTestResult({}: AddTestResultProps) {
  const router = useRouter();

  const handleClick = () => {
    router.push('/periodic-testing/add');
  };

  return (
    <Button size={{ base: 'sm', md: 'md' }} onClick={handleClick}>
      <Plus />
      Add Test Results
    </Button>
  );
}
