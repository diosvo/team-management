import { eq } from 'drizzle-orm';

import db from '@/drizzle';
import { InsertLocation, LocationTable } from '@/drizzle/schema';

export async function getLocations() {
  try {
    return db.select().from(LocationTable).orderBy(LocationTable.name);
  } catch {
    return [];
  }
}

export async function getLocation(location_id: string) {
  try {
    return await db.query.LocationTable.findFirst({
      where: eq(LocationTable.location_id, location_id),
    });
  } catch {
    return null;
  }
}

export async function insertLocation(match: InsertLocation) {
  try {
    return await db.insert(LocationTable).values(match).returning({
      location_id: LocationTable.location_id,
    });
  } catch (error) {
    throw error;
  }
}

export async function updateLocation(
  location_id: string,
  match: InsertLocation,
) {
  try {
    return await db
      .update(LocationTable)
      .set(match)
      .where(eq(LocationTable.location_id, location_id));
  } catch (error) {
    throw error;
  }
}

export async function deleteLocation(location_id: string) {
  try {
    return await db
      .delete(LocationTable)
      .where(eq(LocationTable.location_id, location_id));
  } catch {
    return null;
  }
}
