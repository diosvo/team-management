'use server';

import { getTranslations } from 'next-intl/server';
import { z } from 'zod';

import { hasPermissions } from '@/utils/permissions';
import { ResponseFactory } from '@/utils/response';

import {
  type JerseyOrderSheetLink,
  selectJerseyOrderSheet,
  selectPaymentEditorEmails,
  updateJerseyOrderSheet,
} from '@/db/jersey-order';

import { withAuth, withResource } from './auth';
import { revalidate } from './cache';

const roster = withResource('roster');

// Google Drive file IDs: URL-safe base64-ish, typically 44 characters.
const SpreadsheetId = z.string().regex(/^[\w-]{20,128}$/);

/**
 * This year's uniform-order sheet, for the super admin and captains (the only
 * ones who see the jersey form); `null` for everyone else.
 */
export const getJerseyOrderSheet = withAuth(
  async (user): Promise<Nullable<JerseyOrderSheetLink>> => {
    const { isAdmin } = hasPermissions(user.role);
    if (!isAdmin && !user.is_captain) return null;

    return selectJerseyOrderSheet(user.team_id, new Date().getFullYear());
  },
);

/**
 * Who may tick "Đã thu tiền" in the shared sheet: the team's super admins and
 * captains. Empty for everyone else, who never sees the jersey form.
 */
export const getPaymentEditors = withAuth(
  async (user): Promise<Array<string>> => {
    const { isAdmin } = hasPermissions(user.role);
    if (!isAdmin && !user.is_captain) return [];

    return selectPaymentEditorEmails(user.team_id);
  },
);

/** Remembers the sheet just created so the next export reopens it. */
export const saveJerseyOrderSheet = roster(
  ['create'],
  async (user, spreadsheet_id: string) => {
    const t = await getTranslations('actions.jerseyOrder');

    const parsed = SpreadsheetId.safeParse(spreadsheet_id);
    if (!parsed.success) return ResponseFactory.error(t('invalid'));

    try {
      await updateJerseyOrderSheet(user.team_id, parsed.data);
      revalidate.roster();
      return ResponseFactory.success(t('saved'));
    } catch {
      return ResponseFactory.error(t('saveFailed'));
    }
  },
);
