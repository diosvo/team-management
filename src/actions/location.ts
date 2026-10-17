'use server';

import { getTranslations } from 'next-intl/server';
import { ResponseFactory } from '@/utils/response';

import {
  deleteLocation,
  getLocations as fetchLocations,
  insertLocation,
  updateLocation,
} from '@/db/location';

import { getDbErrorMessage } from '@/db/pg-error';
import type { UpsertLocationSchemaValues } from '@/schemas/location';

import { withAuth, withResource } from './auth';
import { revalidate } from './cache';

const locations = withResource('locations');

export const getLocations = withAuth(fetchLocations);

export const upsertLocation = locations(
  ['create', 'edit'],
  async function upsert(
    _,
    location_id: string,
    location: UpsertLocationSchemaValues,
  ) {
    const t = await getTranslations('actions.location');
    try {
      if (location_id) {
        await updateLocation(location_id, location);
      } else {
        await insertLocation(location);
      }

      revalidate.locations();

      return ResponseFactory.success(t(location_id ? 'updated' : 'added'));
    } catch (error) {
      const { message } = getDbErrorMessage(error);
      return ResponseFactory.error(message);
    }
  },
);

export const removeLocation = locations(
  ['delete'],
  async function remove(_, location_id: string) {
    const t = await getTranslations('actions.location');
    try {
      await deleteLocation(location_id);

      revalidate.locations();

      return ResponseFactory.success(t('deleted'));
    } catch {
      return ResponseFactory.error(t('deleteFailed'));
    }
  },
);
