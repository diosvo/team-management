import { DocumentType } from '../enum';
import type { Selection } from '../type';

export const SELECTABLE_DOCUMENT_TYPES = [
  DocumentType.ALBUM,
  DocumentType.VIDEO,
  DocumentType.TACTIC,
  DocumentType.FILE,
] as const;

export const DOCUMENT_TYPE_SELECTION: Selection<string> = [
  {
    label: 'Album',
    value: DocumentType.ALBUM,
    description: 'A Drive folder of photos, previewed as a grid',
  },
  {
    label: 'Video',
    value: DocumentType.VIDEO,
    description: 'A single video file, plays inline',
  },
  {
    label: 'Tactic',
    value: DocumentType.TACTIC,
    description: 'A video breakdown of a play or game plan, plays inline',
  },
  {
    label: 'File',
    value: DocumentType.FILE,
    description: 'Any other Drive file (photo, PDF, sheet, doc)',
  },
];
