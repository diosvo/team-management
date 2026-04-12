-- Seed/import mock data for the provided schema with exact-ish counts:
-- - team: 20 (exactly 1 default)
-- - user: 100 (exactly: 1 SUPER_ADMIN, 20 COACH, 70 PLAYER, 9 GUEST)
-- - coach: 20 (exact)
-- - player: 70 (exact)
-- - rule: 20 (exact, 1 per team because rule.team_id is UNIQUE)
-- - asset/location/league/match/training_session/attendance/test_type/test_result/match_player_stats: 100 each (exact)
-- - account/session: 100 each (optional but included)
--
-- Safe to re-run: TRUNCATE ... CASCADE first (recommended for tests)

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

TRUNCATE
  match_player_stats,
  attendance,
  test_result,
  league_team_roster,
  league_team,
  "match",
  training_session,
  asset,
  rule,
  test_type,
  location,
  league,
  player,
  coach,
  account,
  session,
  verification,
  "user",
  team
RESTART IDENTITY
CASCADE;

-- ============================================================
-- 1) TEAM (20) - exactly one default team
-- ============================================================
DROP TABLE IF EXISTS seed_team_map;
CREATE TEMP TABLE seed_team_map (
  idx int PRIMARY KEY,
  team_id uuid NOT NULL
) ON COMMIT DROP;

WITH ins AS (
  INSERT INTO team (
    team_id, is_default, name, email, establish_year, logo_url, created_at, updated_at
  )
  SELECT
    gen_random_uuid(),
    (gs = 1),
    'Mock Team ' || gs,
    'team' || gs || '@example.com',
    greatest(2000, least(extract(year from current_date)::int, 2000 + gs))::int,
    'https://example.com/logos/team-' || gs || '.png',
    now(),
    now()
  FROM generate_series(1, 20) gs
  RETURNING team_id
),
numbered AS (
  SELECT row_number() OVER (ORDER BY team_id) AS idx, team_id
  FROM ins
)
INSERT INTO seed_team_map(idx, team_id)
SELECT idx, team_id FROM numbered;

-- ============================================================
-- 2) USER (100) with fixed role distribution
--    - 1 SUPER_ADMIN (user-001)
--    - 20 COACH      (user-002..user-021)
--    - 70 PLAYER     (user-022..user-091)
--    - 9 GUEST       (user-092..user-100)
-- Note: team_id NOT NULL, so all users belong to a team.
-- ============================================================
INSERT INTO "user" (
  id, name, email, email_verified, image, created_at, updated_at,
  team_id, dob, phone_number, citizen_identification, state, role, join_date, leave_date
)
SELECT
  'user-' || to_char(gs, 'FM000') AS id,
  CASE
    WHEN gs = 1 THEN 'Super Admin'
    WHEN gs BETWEEN 2 AND 21 THEN 'Mock Coach ' || (gs - 1)
    WHEN gs BETWEEN 22 AND 91 THEN 'Mock Player ' || (gs - 21)
    ELSE 'Mock Guest ' || (gs - 91)
  END AS name,
  CASE
    WHEN gs = 1 THEN 'superadmin@example.com'
    ELSE 'user' || gs || '@example.com'
  END AS email,
  true AS email_verified,
  NULL::text AS image,
  now() AS created_at,
  now() AS updated_at,
  (SELECT team_id FROM seed_team_map WHERE idx = 1 + ((gs - 1) % 20)) AS team_id,
  (date '1988-01-01' + ((gs * 97) % 9000)) AS dob,
  NULL::varchar(10) AS phone_number,
  NULL::varchar(12) AS citizen_identification,
  'ACTIVE'::user_state AS state,
  CASE
    WHEN gs = 1 THEN 'SUPER_ADMIN'::user_role
    WHEN gs BETWEEN 2 AND 21 THEN 'COACH'::user_role
    WHEN gs BETWEEN 22 AND 91 THEN 'PLAYER'::user_role
    ELSE 'GUEST'::user_role
  END AS role,
  (date '2024-01-01' + ((gs * 13) % 700)) AS join_date,
  NULL::date AS leave_date
FROM generate_series(1, 100) gs;

-- ============================================================
-- 3) COACH (20) for users user-002..user-021
-- ============================================================
INSERT INTO coach (id, position, created_at, updated_at)
SELECT
  u.id,
  (ARRAY['HEAD_COACH','ASSISTANT_COACH','UNKNOWN'])[1 + ((row_number() OVER (ORDER BY u.id) - 1) % 3)]::coach_position,
  now(),
  now()
FROM "user" u
WHERE u.role = 'COACH'::user_role;

-- ============================================================
-- 4) PLAYER (70) for users user-022..user-091
-- jersey_number must be unique and between 0..99
-- ============================================================
WITH players_src AS (
  SELECT u.id, row_number() OVER (ORDER BY u.id) AS rn
  FROM "user" u
  WHERE u.role = 'PLAYER'::user_role
)
INSERT INTO player (
  id, is_captain, jersey_number, position, height, weight, created_at, updated_at
)
SELECT
  ps.id,
  (ps.rn % 12 = 0) AS is_captain,
  (ps.rn - 1) AS jersey_number, -- 0..69 unique
  (ARRAY['POINT_GUARD','SHOOTING_GUARD','SMALL_FORWARD','POWER_FORWARD','CENTER','UNKNOWN'])
    [1 + ((ps.rn - 1) % 6)]::player_position AS position,
  150 + ((ps.rn * 3) % 51) AS height,  -- 150..200
  45 + ((ps.rn * 2) % 56) AS weight,   -- 45..100
  now(),
  now()
FROM players_src ps;

-- ============================================================
-- 5) RULE (20) - 1 per team (unique team_id)
-- ============================================================
INSERT INTO rule (rule_id, team_id, content, created_at, updated_at)
SELECT
  gen_random_uuid(),
  tm.team_id,
  'Rule for Mock Team ' || tm.idx,
  now(),
  now()
FROM seed_team_map tm;

-- ============================================================
-- 6) LOCATION (100)
-- ============================================================
DROP TABLE IF EXISTS seed_location_map;
CREATE TEMP TABLE seed_location_map (
  idx int PRIMARY KEY,
  location_id uuid NOT NULL
) ON COMMIT DROP;

WITH ins AS (
  INSERT INTO location (location_id, name, address, created_at, updated_at)
  SELECT
    gen_random_uuid(),
    'Mock Location ' || gs,
    gs || ' Test Street, Test City',
    now(),
    now()
  FROM generate_series(1, 100) gs
  RETURNING location_id
),
numbered AS (
  SELECT row_number() OVER (ORDER BY location_id) AS idx, location_id
  FROM ins
)
INSERT INTO seed_location_map(idx, location_id)
SELECT idx, location_id FROM numbered;

-- ============================================================
-- 7) ASSET (100) - unique name; enums match your DDL
-- ============================================================
INSERT INTO asset (
  asset_id, team_id, name, category, quantity, condition, note, created_at, updated_at
)
SELECT
  gen_random_uuid(),
  (SELECT team_id FROM seed_team_map WHERE idx = 1 + ((gs - 1) % 20)),
  'Mock Asset ' || gs,
  (ARRAY['EQUIPMENT','TRAINING','OTHERS'])[1 + ((gs - 1) % 3)]::asset_catogory,
  1 + ((gs * 7) % 25),
  (ARRAY['POOR','FAIR','GOOD'])[1 + ((gs - 1) % 3)]::asset_condition,
  NULL::varchar(128),
  now(),
  now()
FROM generate_series(1, 100) gs;

-- ============================================================
-- 8) LEAGUE (100) - unique name; league_status includes ENDED
-- ============================================================
DROP TABLE IF EXISTS seed_league_map;
CREATE TEMP TABLE seed_league_map (
  idx int PRIMARY KEY,
  league_id uuid NOT NULL
) ON COMMIT DROP;

WITH ins AS (
  INSERT INTO league (
    league_id, name, start_date, end_date, status, description, created_at, updated_at
  )
  SELECT
    gen_random_uuid(),
    'Mock League ' || gs,
    date '2024-01-01' + (gs * 2),
    date '2024-02-01' + (gs * 2),
    (ARRAY['UPCOMING','ONGOING','ENDED'])[1 + ((gs - 1) % 3)]::league_status,
    'Description ' || gs,
    now(),
    now()
  FROM generate_series(1, 100) gs
  RETURNING league_id
),
numbered AS (
  SELECT row_number() OVER (ORDER BY league_id) AS idx, league_id
  FROM ins
)
INSERT INTO seed_league_map(idx, league_id)
SELECT idx, league_id FROM numbered;

-- ============================================================
-- 9) LEAGUE_TEAM (100) - avoid duplicates via modular pairing
-- ============================================================
INSERT INTO league_team (league_id, team_id, created_at, updated_at)
SELECT
  (SELECT league_id FROM seed_league_map WHERE idx = 1 + ((gs - 1) % 100)),
  (SELECT team_id FROM seed_team_map WHERE idx = 1 + ((gs * 7) % 20)),
  now(),
  now()
FROM generate_series(1, 100) gs
ON CONFLICT DO NOTHING;

-- ============================================================
-- 10) LEAGUE_TEAM_ROSTER (100)
-- ensure player belongs to league_team.team_id
-- ============================================================
WITH lt AS (
  SELECT league_id, team_id, row_number() OVER (ORDER BY league_id, team_id) AS rn
  FROM league_team
  ORDER BY league_id, team_id
  LIMIT 100
),
team_players AS (
  SELECT u.team_id, p.id AS player_id,
         row_number() OVER (PARTITION BY u.team_id ORDER BY p.id) AS prn
  FROM player p
  JOIN "user" u ON u.id = p.id
)
INSERT INTO league_team_roster (league_id, team_id, player_id, created_at, updated_at)
SELECT
  lt.league_id,
  lt.team_id,
  tp.player_id,
  now(),
  now()
FROM lt
JOIN team_players tp
  ON tp.team_id = lt.team_id
WHERE tp.prn = 1 + ((lt.rn - 1) % 5)
ON CONFLICT DO NOTHING;

-- If fewer than 100 roster rows were possible (e.g., some teams have <5 players),
-- top up to exactly 100 using existing league_team pairs and any matching player.
WITH existing AS (
  SELECT count(*)::int AS c FROM league_team_roster
),
need AS (
  SELECT greatest(0, 100 - (SELECT c FROM existing)) AS n
),
pairs AS (
  SELECT league_id, team_id, row_number() OVER () AS rn
  FROM league_team
),
team_players AS (
  SELECT u.team_id, p.id AS player_id, row_number() OVER (PARTITION BY u.team_id ORDER BY p.id) AS prn
  FROM player p
  JOIN "user" u ON u.id = p.id
),
candidates AS (
  SELECT
    pr.league_id,
    pr.team_id,
    tp.player_id,
    row_number() OVER (ORDER BY pr.league_id, pr.team_id, tp.player_id) AS ord
  FROM pairs pr
  JOIN team_players tp ON tp.team_id = pr.team_id
  WHERE tp.prn <= 3
)
INSERT INTO league_team_roster (league_id, team_id, player_id, created_at, updated_at)
SELECT
  c.league_id, c.team_id, c.player_id, now(), now()
FROM candidates c, need
WHERE c.ord <= need.n
ON CONFLICT DO NOTHING;

-- ============================================================
-- 11) TRAINING_SESSION (100)
-- session_status: SCHEDULED, ACTIVE, COMPLETED, CANCELLED
-- ============================================================
DROP TABLE IF EXISTS seed_session_map;
CREATE TEMP TABLE seed_session_map (
  idx int PRIMARY KEY,
  session_id uuid NOT NULL,
  team_id uuid NOT NULL
) ON COMMIT DROP;

WITH coach_ids AS (
  SELECT c.id, row_number() OVER (ORDER BY c.id) AS rn
  FROM coach c
),
ins AS (
  INSERT INTO training_session (
    session_id, team_id, coach_id, location_id, date, start_time, end_time, status, created_at, updated_at
  )
  SELECT
    gen_random_uuid(),
    (SELECT team_id FROM seed_team_map WHERE idx = 1 + ((gs - 1) % 20)),
    (SELECT id FROM coach_ids WHERE rn = 1 + ((gs - 1) % (SELECT count(*) FROM coach_ids))),
    (SELECT location_id FROM seed_location_map WHERE idx = 1 + ((gs * 3) % 100)),
    (date '2026-01-01' + (gs % 120)),
    (time '08:00' + ((gs % 6) * interval '1 hour'))::time,
    (time '10:00' + ((gs % 6) * interval '1 hour'))::time,
    (ARRAY['SCHEDULED','ACTIVE','COMPLETED','CANCELLED'])[1 + ((gs - 1) % 4)]::session_status,
    now(),
    now()
  FROM generate_series(1, 100) gs
  RETURNING session_id, team_id
),
numbered AS (
  SELECT row_number() OVER (ORDER BY session_id) AS idx, session_id, team_id
  FROM ins
)
INSERT INTO seed_session_map(idx, session_id, team_id)
SELECT idx, session_id, team_id FROM numbered;

-- ============================================================
-- 12) ATTENDANCE (100) - unique (player_id, date)
-- ============================================================
WITH player_ids AS (
  SELECT p.id, row_number() OVER (ORDER BY p.id) AS rn
  FROM player p
),
rows AS (
  SELECT
    gs,
    (SELECT id FROM player_ids WHERE rn = 1 + ((gs - 1) % (SELECT count(*) FROM player_ids))) AS player_id,
    (date '2026-02-01' + gs) AS att_date
  FROM generate_series(1, 100) gs
)
INSERT INTO attendance (
  attendance_id, team_id, player_id, session_id, status, date, reason, created_at, updated_at
)
SELECT
  gen_random_uuid(),
  u.team_id,
  r.player_id,
  (SELECT session_id FROM seed_session_map WHERE idx = 1 + ((r.gs - 1) % 100)),
  (ARRAY['ON_TIME','ABSENT','LATE'])[1 + ((r.gs - 1) % 3)]::attendance_status,
  r.att_date,
  CASE WHEN r.gs % 3 = 1 THEN NULL
       WHEN r.gs % 3 = 2 THEN 'Traffic'
       ELSE 'Sick'
  END,
  now(),
  now()
FROM rows r
JOIN "user" u ON u.id = r.player_id
ON CONFLICT DO NOTHING;

-- Top-up attendance to exactly 100 if ON CONFLICT dropped rows for any reason
WITH existing AS (SELECT count(*)::int AS c FROM attendance),
need AS (SELECT greatest(0, 100 - (SELECT c FROM existing)) AS n),
player_ids AS (
  SELECT p.id, row_number() OVER (ORDER BY p.id) AS rn FROM player p
),
extra AS (
  SELECT
    gs,
    (SELECT id FROM player_ids WHERE rn = 1 + ((gs - 1) % (SELECT count(*) FROM player_ids))) AS player_id,
    (date '2027-01-01' + gs) AS att_date
  FROM generate_series(1, 200) gs
)
INSERT INTO attendance (
  attendance_id, team_id, player_id, session_id, status, date, reason, created_at, updated_at
)
SELECT
  gen_random_uuid(),
  u.team_id,
  e.player_id,
  (SELECT session_id FROM seed_session_map WHERE idx = 1 + ((e.gs - 1) % 100)),
  'ON_TIME'::attendance_status,
  e.att_date,
  NULL,
  now(),
  now()
FROM extra e
JOIN "user" u ON u.id = e.player_id, need
WHERE need.n > 0
LIMIT (SELECT n FROM need)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 13) MATCH (100) - home_team != away_team
-- ============================================================
DROP TABLE IF EXISTS seed_match_map;
CREATE TEMP TABLE seed_match_map (
  idx int PRIMARY KEY,
  match_id uuid NOT NULL
) ON COMMIT DROP;

WITH ins AS (
  INSERT INTO "match" (
    match_id, is_5x5, league_id, location_id,
    home_team, away_team, date, time,
    home_team_score, away_team_score, created_at, updated_at
  )
  SELECT
    gen_random_uuid(),
    (gs % 2 = 0),
    (SELECT league_id FROM seed_league_map WHERE idx = 1 + ((gs - 1) % 100)),
    (SELECT location_id FROM seed_location_map WHERE idx = 1 + ((gs * 5) % 100)),
    (SELECT team_id FROM seed_team_map WHERE idx = 1 + ((gs - 1) % 20)),
    (SELECT team_id FROM seed_team_map WHERE idx = 1 + ((gs) % 20)),
    (date '2024-01-01' + (gs * 2)),
    (time '18:00' + ((gs % 6) * interval '1 hour'))::time,
    (gs * 3) % 101,
    (gs * 7) % 101,
    now(),
    now()
  FROM generate_series(1, 100) gs
  RETURNING match_id
),
numbered AS (
  SELECT row_number() OVER (ORDER BY match_id) AS idx, match_id
  FROM ins
)
INSERT INTO seed_match_map(idx, match_id)
SELECT idx, match_id FROM numbered;

-- ============================================================
-- 14) MATCH_PLAYER_STATS (100)
-- ============================================================
WITH player_ids AS (
  SELECT p.id, row_number() OVER (ORDER BY p.id) AS rn
  FROM player p
)
INSERT INTO match_player_stats (
  match_id, player_id,
  points_scored, rebounds, assists, steals, blocks, turnovers, fouls, minutes_played,
  created_at, updated_at
)
SELECT
  (SELECT match_id FROM seed_match_map WHERE idx = 1 + ((gs - 1) % 100)),
  (SELECT id FROM player_ids WHERE rn = 1 + ((gs - 1) % (SELECT count(*) FROM player_ids))),
  (gs * 2) % 41,
  (gs * 3) % 16,
  (gs * 5) % 12,
  (gs % 5),
  (gs % 4),
  (gs % 7),
  (gs % 6),
  10 + (gs % 31),
  now(),
  now()
FROM generate_series(1, 100) gs
ON CONFLICT DO NOTHING;

-- ============================================================
-- 15) TEST_TYPE (100) - unique (team_id, name)
-- test_type_unit enum values are lowercase
-- ============================================================
DROP TABLE IF EXISTS seed_test_type_map;
CREATE TEMP TABLE seed_test_type_map (
  idx int PRIMARY KEY,
  type_id uuid NOT NULL,
  team_id uuid NOT NULL
) ON COMMIT DROP;

WITH ins AS (
  INSERT INTO test_type (
    type_id, team_id, name, unit, created_at, updated_at
  )
  SELECT
    gen_random_uuid(),
    (SELECT team_id FROM seed_team_map WHERE idx = 1 + ((gs - 1) % 20)),
    'Test Type ' || gs,
    (ARRAY['meters','percent','points','reps','seconds','times'])[1 + ((gs - 1) % 6)]::test_type_unit,
    now(),
    now()
  FROM generate_series(1, 100) gs
  RETURNING type_id, team_id
),
numbered AS (
  SELECT row_number() OVER (ORDER BY type_id) AS idx, type_id, team_id
  FROM ins
)
INSERT INTO seed_test_type_map(idx, type_id, team_id)
SELECT idx, type_id, team_id FROM numbered;

-- ============================================================
-- 16) TEST_RESULT (100)
-- ============================================================
WITH player_ids AS (
  SELECT p.id, row_number() OVER (ORDER BY p.id) AS rn
  FROM player p
)
INSERT INTO test_result (
  result_id, player_id, type_id, result, date, created_at, updated_at
)
SELECT
  gen_random_uuid(),
  (SELECT id FROM player_ids WHERE rn = 1 + ((gs - 1) % (SELECT count(*) FROM player_ids))),
  (SELECT type_id FROM seed_test_type_map WHERE idx = 1 + ((gs - 1) % 100)),
  ((gs % 30)::numeric + ((gs % 1000) / 1000.0))::numeric(10,3),
  (date '2026-01-01' + (gs % 90)),
  now(),
  now()
FROM generate_series(1, 100) gs;

-- ============================================================
-- 17) ACCOUNT + SESSION (100 each) (optional but useful)
-- ============================================================
INSERT INTO account (
  id, account_id, provider_id, user_id,
  access_token, refresh_token, id_token,
  access_token_expires_at, refresh_token_expires_at,
  scope, password, created_at, updated_at
)
SELECT
  'acc-' || u.id,
  'account-' || u.id,
  'credential',
  u.id,
  NULL, NULL, NULL,
  NULL, NULL,
  NULL, NULL,
  now(), now()
FROM "user" u;

INSERT INTO session (
  id, expires_at, token, created_at, updated_at,
  ip_address, user_agent, user_id
)
SELECT
  'sess-' || u.id,
  now() + interval '30 days',
  encode(gen_random_bytes(24), 'hex'),
  now(), now(),
  NULL, NULL,
  u.id
FROM "user" u;

UPDATE account
SET password = 'superadmin123'
WHERE user_id = 'user-001';

COMMIT;

