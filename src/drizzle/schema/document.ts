import { relations } from 'drizzle-orm';
import {
  date,
  pgEnum,
  pgTable,
  text,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

import { DocumentType, enumValues } from '@/utils/enum';

import { TeamTable } from './team';

import { created_at, updated_at } from '../helpers';

export const documentTypeEnum = pgEnum(
  'document_type',
  enumValues(DocumentType),
);

/**
 * Metadata for a public Google Drive link (photo folder, video, tactic, or file).
 * Nothing is uploaded or stored on our side; `url` is the source of truth.
 */
export const DocumentTable = pgTable(
  'document',
  {
    document_id: uuid().primaryKey().defaultRandom(),
    team_id: uuid()
      .notNull()
      .references(() => TeamTable.team_id, { onDelete: 'cascade' }),
    title: varchar({ length: 96 }).notNull(),
    url: text().notNull(),
    // Folder or file id parsed from `url`, so the same Drive item can't be
    // added twice under different share links.
    drive_id: varchar({ length: 128 }).notNull(),
    type: documentTypeEnum().default(DocumentType.ALBUM).notNull(),
    event_date: date(),
    note: varchar({ length: 128 }),
    created_at,
    updated_at,
  },
  (table) => [
    // Ensure a Drive item is linked at most once per team
    uniqueIndex('team_document_drive_id').on(table.team_id, table.drive_id),
  ],
);

export const DocumentRelations = relations(DocumentTable, ({ one }) => ({
  team: one(TeamTable, {
    fields: [DocumentTable.team_id],
    references: [TeamTable.team_id],
  }),
}));

export type Document = typeof DocumentTable.$inferSelect;
export type InsertDocument = typeof DocumentTable.$inferInsert;
