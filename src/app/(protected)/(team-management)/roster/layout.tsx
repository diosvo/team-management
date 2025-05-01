import { Metadata } from 'next';
import FilterProvider from './_helpers/use-filters';

export const metadata: Metadata = {
  title: 'Roster',
  description: 'View the team roster',
};

export default function RosterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <FilterProvider>{children}</FilterProvider>;
}
