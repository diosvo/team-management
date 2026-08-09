-- 0004 created "achievement_type" with UPPERCASE labels, so the sweep in 0006
-- missed it and the DB kept returning e.g. 'CHAMPION' while the app expects 'champion'.
--
-- The "achievement_league_type_idx" predicate stores the enum label as an OID
-- constant, so it follows these renames and needs no rebuild.

ALTER TYPE "achievement_type" RENAME VALUE 'CHAMPION' TO 'champion';
ALTER TYPE "achievement_type" RENAME VALUE 'RUNNER_UP' TO 'runner_up';
ALTER TYPE "achievement_type" RENAME VALUE 'THIRD_PLACE' TO 'third_place';
ALTER TYPE "achievement_type" RENAME VALUE 'MVP' TO 'mvp';
ALTER TYPE "achievement_type" RENAME VALUE 'TOP_SCORER' TO 'top_scorer';
ALTER TYPE "achievement_type" RENAME VALUE 'CUSTOM' TO 'custom';
