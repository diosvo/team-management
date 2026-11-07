'use server';

import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { ResponseFactory } from '@/utils/response';

import { getDbErrorMessage } from '@/db/pg-error';
import {
  isPlayerInTeamScope,
  selectPlayerProgression,
  selectTeamProgression,
} from '@/db/progression';
import {
  deleteTestNote,
  insertTestNote,
  selectTestNote,
  selectTypeNote,
  updateTestNote,
} from '@/db/test-note';
import type { TestNoteSchemaValues } from '@/schemas/periodic-testing';

import { withResource } from './auth';
import { revalidate } from './cache';

const periodicTesting = withResource('periodic-testing');

export const getProgression = periodicTesting(
  'view',
  async function getProgression({ team_id }, type_id: string) {
    return await selectTeamProgression(team_id, type_id);
  },
);

export const getPlayerProgressionById = periodicTesting(
  'view',
  async function getPlayerProgressionById({ team_id }, player_id: string) {
    const progression = await selectPlayerProgression(team_id, player_id);
    if (!progression) notFound();
    return progression;
  },
);

/**
 * Adds or updates a note. Uses `note_id` when editing; otherwise updates the
 * player's note for the same test type. General notes can be multiple.
 */
export const saveTestNote = periodicTesting(
  ['create', 'edit'],
  async function save(
    user,
    player_id: string,
    data: TestNoteSchemaValues,
    note_id?: string,
  ) {
    const t = await getTranslations('actions.testNote');
    try {
      // test_note has no team_id: only annotate players this team can see.
      if (!(await isPlayerInTeamScope(user.team_id, player_id))) {
        return ResponseFactory.error(t('notFound'));
      }

      const values = {
        author_id: user.id,
        content: data.content,
        type_id: data.type_id || null,
        goal: data.type_id && data.goal ? data.goal : null,
      };
      const existing =
        note_id ??
        (data.type_id
          ? (await selectTypeNote(player_id, data.type_id))?.note_id
          : undefined);

      if (existing) {
        await updateTestNote(existing, player_id, values);
      } else {
        await insertTestNote({ player_id, ...values });
      }

      revalidate.testNotes(player_id);

      return ResponseFactory.success(t(existing ? 'updated' : 'added'));
    } catch (error) {
      const { message } = getDbErrorMessage(error);
      return ResponseFactory.error(message);
    }
  },
);

export const removeTestNote = periodicTesting(
  ['delete'],
  async function remove({ team_id }, note_id: string) {
    const t = await getTranslations('actions.testNote');
    try {
      const note = await selectTestNote(note_id);
      if (!note || !(await isPlayerInTeamScope(team_id, note.player_id))) {
        return ResponseFactory.error(t('notFound'));
      }

      const [deleted] = await deleteTestNote(note_id, note.player_id);
      if (deleted) revalidate.testNotes(deleted.player_id);

      return ResponseFactory.success(t('removed'));
    } catch (error) {
      const { message } = getDbErrorMessage(error);
      return ResponseFactory.error(message);
    }
  },
);
