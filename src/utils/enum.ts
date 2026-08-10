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

export const TestTypeUnit = createEnum([
  'meters',
  'percent',
  'points',
  'reps',
  'seconds',
  'times',
] as const);
export type TestTypeUnit = enumUnion<typeof TestTypeUnit>;

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

export const MatchStatus = createEnum(['win', 'loss', 'draw'] as const);
export type MatchStatus = enumUnion<typeof MatchStatus>;

export const MatchType = createEnum(['league', 'friendly'] as const);
export type MatchType = enumUnion<typeof MatchType>;

export const AttendanceStatus = createEnum([
  'on_time',
  'absent',
  'late',
] as const);
export type AttendanceStatus = enumUnion<typeof AttendanceStatus>;

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
