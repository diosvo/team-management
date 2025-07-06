'use client';

import { useRouter } from 'next/navigation';

import { Button } from '@chakra-ui/react';
import { Plus } from 'lucide-react';

interface AddTestResultProps {
  onAddResult?: (result: {
    player_name: string;
    test_type: string;
    score: number;
    notes?: string;
  }) => void;
  onAddMultipleResults?: (
    results: {
      player_name: string;
      test_type: string;
      score: number;
      notes?: string;
    }[]
  ) => void;
}

export default function AddTestResult({
  onAddResult,
  onAddMultipleResults,
}: AddTestResultProps) {
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
