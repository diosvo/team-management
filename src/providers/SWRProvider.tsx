'use client';

import { PropsWithChildren } from 'react';
import { SWRConfig } from 'swr';

export default function SWRProvider({ children }: PropsWithChildren) {
  return (
    <SWRConfig
      value={{
        // Disable suspense mode during SSR
        suspense: false,
      }}
    >
      {children}
    </SWRConfig>
  );
}
