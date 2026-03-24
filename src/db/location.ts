import { asc, eq } from 'drizzle-orm';

import db from '@/drizzle';
import { InsertLocation, LocationTable } from '@/drizzle/schema';

export async function getLocations() {
  try {
    return await db.query.LocationTable.findMany({
      orderBy: asc(LocationTable.name),
    });
  } catch {
    return [];
  }
}

export async function insertLocation(match: InsertLocation) {
  return await db.insert(LocationTable).values(match);
}

export async function updateLocation(
  location_id: string,
  match: InsertLocation,
) {
  return await db
    .update(LocationTable)
    .set(match)
    .where(eq(LocationTable.location_id, location_id));
}

export async function deleteLocation(location_id: string) {
  return await db
    .delete(LocationTable)
    .where(eq(LocationTable.location_id, location_id));
}
