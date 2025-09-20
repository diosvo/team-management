import { Metadata } from 'next';
import { PropsWithChildren } from 'react';

import FilterProvider from './_helpers/use-filters';

export const metadata: Metadata = {
  title: 'Roster',
  description: 'View the team roster',
};

export default function RosterLayout({ children }: PropsWithChildren) {
  return <FilterProvider>{children}</FilterProvider>;
}
