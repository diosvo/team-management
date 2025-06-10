'use client';

import { Asset } from '@/drizzle/schema';

import SelectionFilter from './selection-filter';
import CategoryTable from './table';

export default function AssetList({ data }: { data: Array<Asset> }) {
  return (
    <>
      <SelectionFilter />
      <CategoryTable items={data} />
    </>
  );
}
