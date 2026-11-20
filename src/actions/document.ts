'use server';

import { getTranslations } from 'next-intl/server';

import { DRIVE_ID_PATTERN, parseDriveUrl } from '@/utils/drive';
import { ResponseFactory } from '@/utils/response';

import { listDriveFolder } from '@/lib/drive';

import {
  deleteDocument,
  insertDocument,
  selectDocuments,
  updateDocument,
} from '@/db/document';
import { getDbErrorMessage } from '@/db/pg-error';
import {
  UpsertDocumentSchema,
  type UpsertDocumentSchemaValues,
} from '@/schemas/document';

import { withAuth, withResource } from './auth';
import { revalidate } from './cache';

const documents = withResource('documents');

export const getDocuments = withAuth(
  async ({ team_id }) => await selectDocuments(team_id),
);

export const getAlbumItems = withAuth(async (_, folder_id: string) =>
  // Only ids that pass the Drive id shape reach the query string.
  DRIVE_ID_PATTERN.test(folder_id) ? await listDriveFolder(folder_id) : null,
);

export const upsertDocument = documents(
  ['create', 'edit'],
  async function upsert(
    user,
    document_id: string,
    document: UpsertDocumentSchemaValues,
  ) {
    const t = await getTranslations('actions.document');

    // Server Functions are reachable by direct POST, so the Drive-link rule
    // is enforced here as well as in the form.
    const parsed = UpsertDocumentSchema.safeParse(document);
    if (!parsed.success) return ResponseFactory.error(t('invalid'));

    const link = parseDriveUrl(parsed.data.url)!;
    const newData = {
      ...parsed.data,
      drive_id: link.id,
      team_id: user.team_id,
    };

    try {
      if (document_id) {
        await updateDocument(document_id, newData);
      } else {
        await insertDocument(newData);
      }

      revalidate.documents();

      return ResponseFactory.success(t(document_id ? 'updated' : 'added'));
    } catch (error) {
      const { message, constraint } = getDbErrorMessage(error);
      return ResponseFactory.error(
        constraint === 'team_document_drive_id' ? t('duplicate') : message,
      );
    }
  },
);

export const removeDocument = documents(
  ['delete'],
  async function remove(_, document_id: string) {
    const t = await getTranslations('actions.document');
    try {
      await deleteDocument(document_id);

      revalidate.documents();

      return ResponseFactory.success(t('deleted'));
    } catch {
      return ResponseFactory.error(t('deleteFailed'));
    }
  },
);
