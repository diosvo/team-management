'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';

interface SearchParamsHandler {
  set: (key: string, value: string) => void;
  delete: (key: string) => void;
  deleteAll: () => void;
  navigate: () => void;
}

export default function useSearchParamsHandler() {
  // Access the parameters of the current URL
  const searchParams = useSearchParams();
  // Read the current URL's pathname
  const pathname = usePathname();
  // Enable navigation between routes within client components programmatically
  const { replace } = useRouter();
  const [isPending, startTransition] = useTransition();

  // Memoize the handler object to prevent recreation on each render
  const handler: SearchParamsHandler = {
    set: (key, value) => {
      const params = new URLSearchParams(searchParams);
      params.set(key, value);
      startTransition(() => replace(`${pathname}?${params.toString()}`));
    },
    delete: (key) => {
      const params = new URLSearchParams(searchParams);
      params.delete(key);
      startTransition(() => replace(`${pathname}?${params.toString()}`));
    },
    deleteAll: () => {
      const params = new URLSearchParams(searchParams);
      params.forEach((_, key) => {
        params.delete(key);
      });
      startTransition(() => replace(`${pathname}?${params.toString()}`));
    },
    navigate: () => {
      const params = new URLSearchParams(searchParams);
      console.log('params', searchParams.toString());

      startTransition(() => replace(`${pathname}?${params.toString()}`));
    },
  };

  return { searchParams, handler, isPending };
}
