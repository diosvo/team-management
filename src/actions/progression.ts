'use server';

import { notFound } from 'next/navigation';

import { getTranslations } from 'next-intl/server';

import { getDbErrorMessage } from '@/db/pg-error';
import { getPlayerProgression, getTeamProgression } from '@/db/progression';
import {
  deleteTestNote,
  findTypeNote,
  insertTestNote,
  updateTestNote,
} from '@/db/test-note';
import type { TestNoteSchemaValues } from '@/schemas/periodic-testing';

import { ResponseFactory } from '@/utils/response';

import { withResource } from './auth';
import { revalidate } from './cache';

const periodicTesting = withResource('periodic-testing');

export const getProgression = periodicTesting(
  'view',
  async function getProgression({ team_id }, type_id: string) {
    return await getTeamProgression(team_id, type_id);
  },
);

export const getPlayerProgressionById = periodicTesting(
  'view',
  async function getPlayerProgressionById({ team_id }, player_id: string) {
    const progression = await getPlayerProgression(team_id, player_id);
    if (!progression) notFound();
    return progression;
  },
);

/**
 * Adds a note, or updates one: the note being edited (`note_id`), else the
 * player's existing note for the same test type, since each focus area keeps
 * a single note. General notes (no type) can be many.
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
      const values = {
        author_id: user.id,
        content: data.content,
        type_id: data.type_id || null,
        goal: data.type_id && data.goal ? data.goal : null,
      };
      const existing =
        note_id ??
        (data.type_id
          ? (await findTypeNote(player_id, data.type_id))?.note_id
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
  async function remove(_, note_id: string) {
    const t = await getTranslations('actions.testNote');
    try {
      const [deleted] = await deleteTestNote(note_id);
      if (deleted) revalidate.testNotes(deleted.player_id);

      return ResponseFactory.success(t('removed'));
    } catch (error) {
      const { message } = getDbErrorMessage(error);
      return ResponseFactory.error(message);
    }
  },
);
