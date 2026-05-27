import { Metadata } from 'next';

import { getLocations } from '@/actions/location';
import SearchInput from '@/components/SearchInput';

import LocationHeader from './_components/LocationHeader';
import LocationTable from './_components/LocationTable';

export const metadata: Metadata = {
  title: 'Locations',
  description: 'Manage your location settings.',
};

export default async function LocationsPage() {
  const locations = await getLocations();

  return (
    <>
      <LocationHeader />
      <SearchInput />
      <LocationTable locations={locations} />
    </>
  );
}
