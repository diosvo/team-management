'use server';

import { ResponseFactory } from '@/utils/response';

import {
  deleteLocation,
  getLocations as fetchLocations,
  insertLocation,
  updateLocation,
} from '@/db/location';

import { getDbErrorMessage } from '@/db/pg-error';
import { UpsertLocationSchemaValues } from '@/schemas/location';

import { withAuth } from './auth';
import { revalidate } from './cache';

export const getLocations = withAuth(fetchLocations);

export const upsertLocation = withAuth(
  async (_, location_id: string, location: UpsertLocationSchemaValues) => {
    try {
      if (location_id) {
        await updateLocation(location_id, location);
      } else {
        await insertLocation(location);
      }

      revalidate.locations();

      return ResponseFactory.success(
        `${location_id ? 'Updated' : 'Added'} location successfully`,
      );
    } catch (error) {
      const { message } = getDbErrorMessage(error);
      return ResponseFactory.error(message);
    }
  },
);

export const removeLocation = withAuth(async (_, location_id: string) => {
  try {
    await deleteLocation(location_id);

    revalidate.locations();

    return ResponseFactory.success('Deleted location successfully');
  } catch {
    return ResponseFactory.error('Failed to delete location');
  }
});
