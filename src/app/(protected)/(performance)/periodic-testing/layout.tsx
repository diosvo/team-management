import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Periodic Testing',
  description: 'Performance testing and analytics for team players',
};

export default function PeriodicTestingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
