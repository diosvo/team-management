import { z } from 'zod';

import { CURRENT_DATE, SELECTABLE_DOCUMENT_TYPES } from '@/utils/constants';
import { isDriveUrl } from '@/utils/drive';
import { DocumentType } from '@/utils/enum';

export const NOTE_LIMIT = 128;

export const UpsertDocumentSchema = z.object({
  title: z.string().trim().min(3).max(96),
  // Values are `validation` keys, translated by <Field />.
  url: z
    .url({ error: 'driveLink' })
    .trim()
    .refine(isDriveUrl, { error: 'driveLink' }),
  type: z.enum(SELECTABLE_DOCUMENT_TYPES).default(DocumentType.ALBUM),
  event_date: z.iso.date().nullish().default(CURRENT_DATE),
  note: z.string().max(NOTE_LIMIT).nullable(),
});

export type UpsertDocumentSchemaValues = z.infer<typeof UpsertDocumentSchema>;
