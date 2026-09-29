// Derives a readonly enum-like object: lowercase value array → UPPERCASE key accessors.
function createEnum<T extends string>(values: readonly T[]) {
  return Object.fromEntries(values.map((v) => [v.toUpperCase(), v])) as {
    readonly [K in T as Uppercase<K>]: K;
  };
}

/** Extracts a typed tuple of values from an enum const for use with drizzle's pgEnum. */
export const enumValues = <T extends object>(obj: T) =>
  Object.values(obj) as unknown as [
    T[keyof T] & string,
    ...(T[keyof T] & string)[],
  ];

/**
 * Extracts the union of values from an enum const,
 *
 * @example ```enumUnion<typeof UserRole>```
 * */
export type enumUnion<T extends object> = T[keyof T];

export const UserRole = createEnum([
  'coach',
  'player',
  'guest',
  'super_admin',
] as const);
export type UserRole = enumUnion<typeof UserRole>;

export const UserState = createEnum([
  'active',
  'inactive',
  'temporarily_absent',
  'unknown',
] as const);
export type UserState = enumUnion<typeof UserState>;

export const CoachPosition = createEnum([
  'head_coach',
  'assistant_coach',
  'unknown',
] as const);
export type CoachPosition = enumUnion<typeof CoachPosition>;

export const PlayerPosition = createEnum([
  'point_guard',
  'shooting_guard',
  'small_forward',
  'power_forward',
  'center',
  'unknown',
] as const);
export type PlayerPosition = enumUnion<typeof PlayerPosition>;

// Universal labels, kept uppercase in the database and on the jersey form.
export const JERSEY_SIZES = [
  'XS',
  'S',
  'M',
  'L',
  'XL',
  '2XL',
  '3XL',
  '4XL',
] as const;
export type JerseySize = (typeof JERSEY_SIZES)[number];

// Cut of the shorts; labelled "Form ngắn" / "Form tiêu chuẩn" on the jersey form.
export const SHORT_FORMS = ['short', 'standard'] as const;
export type ShortForm = (typeof SHORT_FORMS)[number];

export const AssetCategory = createEnum([
  'equipment',
  'training',
  'others',
] as const);
export type AssetCategory = enumUnion<typeof AssetCategory>;

export const AssetCondition = createEnum([
  'poor',
  'fair',
  'good',
  'obsolete',
] as const);
export type AssetCondition = enumUnion<typeof AssetCondition>;

// What a linked Google Drive item is: a photo folder, a video file, or any other file.
export const DocumentType = createEnum([
  'album',
  'video',
  'tactic',
  'file',
] as const);
export type DocumentType = enumUnion<typeof DocumentType>;

// What a Google Drive share link points at.
export const DriveKind = createEnum(['folder', 'file'] as const);
export type DriveKind = enumUnion<typeof DriveKind>;

// What a media file inside a Drive album is.
export const MediaKind = createEnum(['image', 'video'] as const);
export type MediaKind = enumUnion<typeof MediaKind>;

export const TestTypeUnit = createEnum([
  'meters',
  'percent',
  'points',
  'reps',
  'seconds',
  'times',
] as const);
export type TestTypeUnit = enumUnion<typeof TestTypeUnit>;

export const ProgressStatus = createEnum([
  'improving',
  'stable',
  'plateauing',
  'regressing',
  'insufficient',
] as const);
export type ProgressStatus = enumUnion<typeof ProgressStatus>;

export const PerformanceBand = createEnum([
  'elite',
  'on_target',
  'below_target',
  'needs_work',
] as const);
export type PerformanceBand = enumUnion<typeof PerformanceBand>;

export const LeagueStatus = createEnum([
  'upcoming',
  'ongoing',
  'ended',
] as const);
export type LeagueStatus = enumUnion<typeof LeagueStatus>;

export const AchievementType = createEnum([
  'champion',
  'runner_up',
  'third_place',
  'mvp',
  'top_scorer',
  'custom',
] as const);
export type AchievementType = enumUnion<typeof AchievementType>;

/** Outcome of a played match, derived from the scores. */
export const MatchResult = createEnum(['win', 'loss', 'draw'] as const);
export type MatchResult = enumUnion<typeof MatchResult>;

/**
 * Lifecycle of a match, mirroring `SessionStatus`. Only a `completed` match
 * carries a score, so an unplayed fixture is never read as a 0-0 draw.
 */
export const MatchStatus = createEnum([
  'scheduled',
  'completed',
  'cancelled',
] as const);
export type MatchStatus = enumUnion<typeof MatchStatus>;

export const MatchType = createEnum(['league', 'friendly'] as const);
export type MatchType = enumUnion<typeof MatchType>;

export const AttendanceStatus = createEnum([
  'on_time',
  'absent',
  'late',
] as const);
export type AttendanceStatus = enumUnion<typeof AttendanceStatus>;

/** Report windows. Backs the `report_interval` pg enum used by the scheduler. */
export const Interval = createEnum([
  'this_month',
  'last_month',
  'this_year',
  'last_year',
] as const);
export type Interval = enumUnion<typeof Interval>;

export const SessionStatus = createEnum([
  'scheduled',
  'active',
  'completed',
  'cancelled',
] as const);
export type SessionStatus = enumUnion<typeof SessionStatus>;

/** Lifecycle of a single report run: pending → success | failed, then expired. */
export const ReportStatus = createEnum([
  'pending',
  'success',
  'failed',
  'expired',
] as const);
export type ReportStatus = enumUnion<typeof ReportStatus>;

export const ReportTrigger = createEnum(['manual', 'scheduled'] as const);
export type ReportTrigger = enumUnion<typeof ReportTrigger>;

// Lowercase keys match the email provider's webhook event names.
export const EmailStatus = createEnum([
  'bounced',
  'canceled',
  'clicked',
  'complained',
  'delivered',
  'delivery_delayed',
  'failed',
  'opened',
  'queued',
  'scheduled',
  'sent',
  'suppressed',
] as const);
export type EmailStatus = enumUnion<typeof EmailStatus>;

/** Kinds of rows in the activity log. */
export const ActivityKind = createEnum(['training', 'test', 'match'] as const);
export type ActivityKind = enumUnion<typeof ActivityKind>;
