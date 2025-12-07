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
  CENTER = 'CENTER',
  FORWARD = 'FORWARD',
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
