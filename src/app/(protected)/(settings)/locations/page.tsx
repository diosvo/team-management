import { Metadata } from 'next';

import { getLocations } from '@/actions/location';
import PageTitle from '@/components/PageTitle';

import LocationList from './_components/LocationList';

export const metadata: Metadata = {
  title: 'Locations',
  description: 'Manage your location settings.',
};

export default async function LocationsPage() {
  const locations = await getLocations();

  return (
    <>
      <PageTitle title="Locations" />
      <LocationList locations={locations} />
    </>
  );
}
