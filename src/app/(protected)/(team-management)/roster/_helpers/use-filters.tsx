'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import {
  createContext,
  PropsWithChildren,
  useContext,
  useOptimistic,
  useTransition,
} from 'react';

import { FilterUsersValues } from '@/schemas/user';
import { parseSearchParams } from './parse-params';

type FilterContextType = {
  filters: FilterUsersValues;
  isPending: boolean;
  updateFilters: (_updates: Partial<FilterUsersValues>) => void;
};

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export default function FilterProvider({ children }: PropsWithChildren) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialFilters = parseSearchParams(
    Object.fromEntries(searchParams.entries())
  );

  const [isPending, startTransition] = useTransition();
  const [optimisticFilters, setOptimisticFilters] = useOptimistic(
    initialFilters,
    (prevState, newFilters: Partial<FilterUsersValues>) => {
      return {
        ...prevState,
        ...newFilters,
      };
    }
  );

  function updateFilters(updates: Partial<FilterUsersValues>) {
    const newState = {
      ...optimisticFilters,
      ...updates,
    };
    const newSearchParams = new URLSearchParams();

    Object.entries(newState).forEach(([key, value]) => {
      if (Array.isArray(value) && value.length > 0) {
        newSearchParams.set(key, value.join(','));
      }
      if (typeof value === 'string' && value.length > 0) {
        newSearchParams.set(key, value);
      }
    });

    startTransition(() => {
      setOptimisticFilters(updates || {});
      router.push(`?${newSearchParams}`);
    });
  }

  return (
    <FilterContext
      value={{
        filters: optimisticFilters,
        isPending,
        updateFilters,
      }}
    >
      {children}
    </FilterContext>
  );
}

export function useFilters() {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error('useFilter must be used within a FilterProvider');
  }
  return context;
}
