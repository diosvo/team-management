-- Rename all pgEnum values to lowercase for consistency.
-- Run after 0005 (which renamed test_type_unit to UPPERCASE).

ALTER TYPE "user_role" RENAME VALUE 'COACH' TO 'coach';
ALTER TYPE "user_role" RENAME VALUE 'PLAYER' TO 'player';
ALTER TYPE "user_role" RENAME VALUE 'GUEST' TO 'guest';
ALTER TYPE "user_role" RENAME VALUE 'SUPER_ADMIN' TO 'super_admin';

ALTER TYPE "user_state" RENAME VALUE 'ACTIVE' TO 'active';
ALTER TYPE "user_state" RENAME VALUE 'INACTIVE' TO 'inactive';
ALTER TYPE "user_state" RENAME VALUE 'TEMPORARILY_ABSENT' TO 'temporarily_absent';
ALTER TYPE "user_state" RENAME VALUE 'UNKNOWN' TO 'unknown';

ALTER TYPE "coach_position" RENAME VALUE 'HEAD_COACH' TO 'head_coach';
ALTER TYPE "coach_position" RENAME VALUE 'ASSISTANT_COACH' TO 'assistant_coach';
ALTER TYPE "coach_position" RENAME VALUE 'UNKNOWN' TO 'unknown';

ALTER TYPE "player_position" RENAME VALUE 'POINT_GUARD' TO 'point_guard';
ALTER TYPE "player_position" RENAME VALUE 'SHOOTING_GUARD' TO 'shooting_guard';
ALTER TYPE "player_position" RENAME VALUE 'SMALL_FORWARD' TO 'small_forward';
ALTER TYPE "player_position" RENAME VALUE 'POWER_FORWARD' TO 'power_forward';
ALTER TYPE "player_position" RENAME VALUE 'CENTER' TO 'center';
ALTER TYPE "player_position" RENAME VALUE 'UNKNOWN' TO 'unknown';

ALTER TYPE "asset_condition" RENAME VALUE 'POOR' TO 'poor';
ALTER TYPE "asset_condition" RENAME VALUE 'FAIR' TO 'fair';
ALTER TYPE "asset_condition" RENAME VALUE 'GOOD' TO 'good';
ALTER TYPE "asset_condition" RENAME VALUE 'OBSOLETE' TO 'obsolete';

-- Note: the DB type name has a typo ('catogory') carried over from the original schema.
ALTER TYPE "asset_catogory" RENAME VALUE 'EQUIPMENT' TO 'equipment';
ALTER TYPE "asset_catogory" RENAME VALUE 'TRAINING' TO 'training';
ALTER TYPE "asset_catogory" RENAME VALUE 'OTHERS' TO 'others';

ALTER TYPE "league_status" RENAME VALUE 'UPCOMING' TO 'upcoming';
ALTER TYPE "league_status" RENAME VALUE 'ONGOING' TO 'ongoing';
ALTER TYPE "league_status" RENAME VALUE 'ENDED' TO 'ended';

ALTER TYPE "attendance_status" RENAME VALUE 'ON_TIME' TO 'on_time';
ALTER TYPE "attendance_status" RENAME VALUE 'ABSENT' TO 'absent';
ALTER TYPE "attendance_status" RENAME VALUE 'LATE' TO 'late';

-- 0005 renamed these to UPPERCASE; reverting back to lowercase.
ALTER TYPE "test_type_unit" RENAME VALUE 'METERS' TO 'meters';
ALTER TYPE "test_type_unit" RENAME VALUE 'PERCENT' TO 'percent';
ALTER TYPE "test_type_unit" RENAME VALUE 'POINTS' TO 'points';
ALTER TYPE "test_type_unit" RENAME VALUE 'REPS' TO 'reps';
ALTER TYPE "test_type_unit" RENAME VALUE 'SECONDS' TO 'seconds';
ALTER TYPE "test_type_unit" RENAME VALUE 'TIMES' TO 'times';

ALTER TYPE "session_status" RENAME VALUE 'SCHEDULED' TO 'scheduled';
ALTER TYPE "session_status" RENAME VALUE 'ACTIVE' TO 'active';
ALTER TYPE "session_status" RENAME VALUE 'COMPLETED' TO 'completed';
ALTER TYPE "session_status" RENAME VALUE 'CANCELLED' TO 'cancelled';
