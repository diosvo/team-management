'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { createContext, useContext, useOptimistic, useTransition } from 'react';

import { getDefaults } from '@/lib/zod';
import { SelectableRole, SelectableState } from '@/utils/type';

import {
  FilterUsersSchema,
  FilterUsersValues,
} from '@/features/user/schemas/user';

type FilterContextType = {
  defaultFilters: FilterUsersValues;
  filters: FilterUsersValues;
  isPending: boolean;
  updateFilters: (_updates: Partial<FilterUsersValues>) => void;
};

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export default function FilterProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const rolesParam = searchParams.get('roles');
  const stateParam = searchParams.get('state');

  const filters = FilterUsersSchema.safeParse({
    query: searchParams.get('query') || '',
    roles: rolesParam ? (rolesParam.split(',') as Array<SelectableRole>) : [],
    state: stateParam ? (stateParam.split(',') as Array<SelectableState>) : [],
  });

  const defaultFilters = getDefaults(FilterUsersSchema) as FilterUsersValues;
  const initialFilters = filters.success ? filters.data : defaultFilters;

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

  function updateFilters(updates: Partial<typeof optimisticFilters>) {
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
    <FilterContext.Provider
      value={{
        defaultFilters,
        filters: optimisticFilters,
        isPending,
        updateFilters,
      }}
    >
      {children}
    </FilterContext.Provider>
  );
}

export function useFilters() {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error('useFilter must be used within a FilterProvider');
  }
  return context;
}
