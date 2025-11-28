import { Metadata } from 'next';

import { getLocations } from '@/actions/location';
import PageTitle from '@/components/PageTitle';

import LocationList from './_components/LocationList';

const mockLocations = [
  {
    location_id: '1',
    name: 'Madison Square Garden',
    address: '4 Pennsylvania Plaza, New York, NY 10001',
    updated_at: '2024-01-15T10:30:00Z',
  },
  {
    location_id: '2',
    name: 'Staples Center',
    address: '1111 S Figueroa St, Los Angeles, CA 90015',
    updated_at: '2024-02-20T14:45:00Z',
  },
  {
    location_id: '3',
    name: 'United Center',
    address: '1901 W Madison St, Chicago, IL 60612',
    updated_at: '2024-01-10T09:15:00Z',
  },
  {
    location_id: '4',
    name: 'TD Garden',
    address: '100 Legends Way, Boston, MA 02114',
    updated_at: '2024-03-05T16:20:00Z',
  },
  {
    location_id: '5',
    name: 'American Airlines Arena',
    address: '601 Biscayne Blvd, Miami, FL 33132',
    updated_at: '2023-12-28T11:00:00Z',
  },
  {
    location_id: '6',
    name: 'Chase Center',
    address: '1 Warriors Way, San Francisco, CA 94158',
    updated_at: '2024-02-14T13:30:00Z',
  },
  {
    location_id: '7',
    name: 'Barclays Center',
    address: '620 Atlantic Ave, Brooklyn, NY 11217',
    updated_at: '2024-01-25T08:45:00Z',
  },
  {
    location_id: '8',
    name: 'Toyota Center',
    address: '1510 Polk St, Houston, TX 77002',
    updated_at: '2024-03-12T15:10:00Z',
  },
];

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
