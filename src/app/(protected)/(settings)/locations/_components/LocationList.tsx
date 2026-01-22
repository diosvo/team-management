'use client';

import { useMemo } from 'react';

import { Location } from '@/drizzle/schema';
import { useCommonParams } from '@/utils/filters';

import LocationFilters from './LocationFilters';
import LocationTable from './LocationTable';

export default function LocationList({
  locations,
}: {
  locations: Array<Location>;
}) {
  const [{ q }] = useCommonParams();
  const filteredLocations = useMemo(() => {
    const query = q.toLowerCase();
    return locations.filter(
      ({ name, address }) =>
        name.toLowerCase().includes(query) ||
        address.toLowerCase().includes(query),
    );
  }, [locations, q]);

  return (
    <>
      <LocationFilters />
      <LocationTable locations={filteredLocations} />
    </>
  );
}
