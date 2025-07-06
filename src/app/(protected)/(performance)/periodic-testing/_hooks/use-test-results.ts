'use client';

interface TestResult {
  player_name: string;
  test_type: string;
  score: number;
  notes?: string;
}

const STORAGE_KEY = 'pending-test-results';

export const useTestResultsStorage = () => {
  const addResults = (results: TestResult[]) => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(results));
    }
  };

  const getPendingResults = (): TestResult[] => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    }
    return [];
  };

  const clearPendingResults = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  };

  return {
    addResults,
    getPendingResults,
    clearPendingResults,
  };
};
