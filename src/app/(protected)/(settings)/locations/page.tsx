import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { getLocations } from '@/actions/location';
import SearchInput from '@/components/SearchInput';

import LocationHeader from './_components/LocationHeader';
import LocationTable from './_components/LocationTable';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('locations.metadata');
  return { title: t('title'), description: t('description') };
}

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
