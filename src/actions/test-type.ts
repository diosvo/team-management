'use server';

import { getTranslations } from 'next-intl/server';
import { getDbErrorMessage } from '@/db/pg-error';
import {
  deleteTestType,
  getTestTypes as getAction,
  getTestTypeById,
  insertTestType,
  updateTestType,
} from '@/db/test-type';
import type { UpsertTestTypeSchemaValues } from '@/schemas/periodic-testing';

import { ResponseFactory } from '@/utils/response';
import { withAuth, withResource } from './auth';
import { revalidate } from './cache';

const periodicTesting = withResource('periodic-testing');

export const getTestTypes = withAuth(async () => await getAction());

export const upsertTestType = periodicTesting(
  ['create', 'edit'],
  async function upsert(
    { team_id },
    type_id: string,
    data: UpsertTestTypeSchemaValues,
  ) {
    const t = await getTranslations('actions.testType');
    try {
      const existingTestType = await getTestTypeById(type_id);

      if (existingTestType) {
        await updateTestType(existingTestType.type_id, data);
      } else {
        await insertTestType({
          ...data,
          team_id,
        });
      }

      revalidate.testTypes();

      return ResponseFactory.success(t('updated'));
    } catch (error) {
      const { message } = getDbErrorMessage(error);
      return ResponseFactory.error(message);
    }
  },
);

export const removeTestType = periodicTesting(
  ['delete'],
  async function remove(_, type_id: string) {
    const t = await getTranslations('actions.testType');
    try {
      await deleteTestType(type_id);

      revalidate.testTypes();

      return ResponseFactory.success(t('removed'));
    } catch (error) {
      const { message, constraint } = getDbErrorMessage(error);
      if (constraint === 'test_result_type_id_test_type_type_id_fk') {
        return ResponseFactory.error(t('inUse'));
      }
      return ResponseFactory.error(message);
    }
  },
);
