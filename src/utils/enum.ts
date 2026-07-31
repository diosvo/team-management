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

export const UserRole = createEnum([
  'coach',
  'player',
  'guest',
  'super_admin',
] as const);
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const UserState = createEnum([
  'active',
  'inactive',
  'temporarily_absent',
  'unknown',
] as const);
export type UserState = (typeof UserState)[keyof typeof UserState];

export const CoachPosition = createEnum([
  'head_coach',
  'assistant_coach',
  'unknown',
] as const);
export type CoachPosition = (typeof CoachPosition)[keyof typeof CoachPosition];

export const PlayerPosition = createEnum([
  'point_guard',
  'shooting_guard',
  'small_forward',
  'power_forward',
  'center',
  'unknown',
] as const);
export type PlayerPosition =
  (typeof PlayerPosition)[keyof typeof PlayerPosition];

export const AssetCategory = createEnum([
  'equipment',
  'training',
  'others',
] as const);
export type AssetCategory = (typeof AssetCategory)[keyof typeof AssetCategory];

export const AssetCondition = createEnum([
  'poor',
  'fair',
  'good',
  'obsolete',
] as const);
export type AssetCondition =
  (typeof AssetCondition)[keyof typeof AssetCondition];

export const TestTypeUnit = createEnum([
  'meters',
  'percent',
  'points',
  'reps',
  'seconds',
  'times',
] as const);
export type TestTypeUnit = (typeof TestTypeUnit)[keyof typeof TestTypeUnit];

export const LeagueStatus = createEnum([
  'upcoming',
  'ongoing',
  'ended',
] as const);
export type LeagueStatus = (typeof LeagueStatus)[keyof typeof LeagueStatus];

export const AchievementType = createEnum([
  'champion',
  'runner_up',
  'third_place',
  'mvp',
  'top_scorer',
  'custom',
] as const);
export type AchievementType =
  (typeof AchievementType)[keyof typeof AchievementType];

export const MatchStatus = createEnum(['win', 'loss', 'draw'] as const);
export type MatchStatus = (typeof MatchStatus)[keyof typeof MatchStatus];

export const MatchType = createEnum(['league', 'friendly'] as const);
export type MatchType = (typeof MatchType)[keyof typeof MatchType];

export const AttendanceStatus = createEnum([
  'on_time',
  'absent',
  'late',
] as const);
export type AttendanceStatus =
  (typeof AttendanceStatus)[keyof typeof AttendanceStatus];

export const Interval = createEnum([
  'this_month',
  'last_month',
  'this_year',
  'last_year',
] as const);
export type Interval = (typeof Interval)[keyof typeof Interval];

export const SessionStatus = createEnum([
  'scheduled',
  'active',
  'completed',
  'cancelled',
] as const);
export type SessionStatus = (typeof SessionStatus)[keyof typeof SessionStatus];

export const ReportTrigger = createEnum(['manual', 'scheduled'] as const);
export type ReportTrigger = (typeof ReportTrigger)[keyof typeof ReportTrigger];

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
export type EmailStatus = (typeof EmailStatus)[keyof typeof EmailStatus];
