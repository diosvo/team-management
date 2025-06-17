import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Bi-monthly Testing',
  description: 'Performance testing and analytics for team players',
};

export default function BiMonthlyTestingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
