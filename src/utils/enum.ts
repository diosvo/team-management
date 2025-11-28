export enum UserRole {
  COACH = 'COACH',
  PLAYER = 'PLAYER',
  GUEST = 'GUEST',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

export enum UserState {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  TEMPORARILY_ABSENT = 'TEMPORARILY_ABSENT',
  UNKNOWN = 'UNKNOWN',
}

export enum CoachPosition {
  HEAD_COACH = 'HEAD_COACH',
  ASSISTANT_COACH = 'ASSISTANT_COACH',
  UNKNOWN = 'UNKNOWN',
}

export enum PlayerPosition {
  POINT_GUARD = 'POINT_GUARD',
  SHOOTING_GUARD = 'SHOOTING_GUARD',
  SMALL_FORWARD = 'SMALL_FORWARD',
  POWER_FORWARD = 'POWER_FORWARD',
  CENTER = 'CENTER',
  UNKNOWN = 'UNKNOWN',
}

export enum AssetCategory {
  EQUIPMENT = 'EQUIPMENT',
  TRAINING = 'TRAINING',
  OTHERS = 'OTHERS',
}

export enum AssetCondition {
  POOR = 'POOR',
  FAIR = 'FAIR',
  GOOD = 'GOOD',
}

export enum TestTypeUnit {
  METERS = 'meters',
  PERCENT = 'percent',
  POINTS = 'points',
  REPS = 'reps',
  SECONDS = 'seconds',
  TIMES = 'times',
}

export enum LeagueStatus {
  UPCOMING = 'UPCOMING',
  ONGOING = 'ONGOING',
  ENDED = 'ENDED',
}

export enum MatchStatus {
  WIN = 'WIN',
  LOSS = 'LOSS',
  DRAW = 'DRAW',
}

export enum Interval {
  THIS_MONTH = 'this_month',
  LAST_MONTH = 'last_month',
  THIS_YEAR = 'this_year',
  LAST_YEAR = 'last_year',
}
