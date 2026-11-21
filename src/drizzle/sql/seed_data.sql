-- Seed mock data for local development.
--
-- • team: 20, exactly 1 default (Saigon Rovers). The other 19 are
--   `is_external` opponents and carry no members, as in production.
-- • user: 20, all on the default team: 1 SUPER_ADMIN (vtmn1212@gmail.com),
--   1 COACH, 17 PLAYER, 1 GUEST.
-- • Every account signs in with the same password: Rovers@2026
--   (better-auth scrypt hash, `salt:key` hex, from `better-auth/crypto`).
-- • Daily operations, around 100 rows each: training_session, match, and
--   attendance. Box scores, test results, assets, leagues and achievements
--   are linked through the schema's relationships.
-- • Language: people, teams and courts keep their Vietnamese names (proper
--   nouns). All other free text is English to match the default `en` locale,
--   since stored data is not translated by next-intl.
-- • Dates are relative to CURRENT_DATE, so recent and upcoming data stays
--   current whenever the seed runs.
--
-- Safe to re-run: TRUNCATE ... CASCADE first.

BEGIN;

TRUNCATE
  report_history,
  report_schedule,
  achievement,
  test_note,
  test_result,
  test_type,
  match_player_stats,
  attendance,
  training_session,
  league_team_roster,
  league_team,
  "match",
  league,
  asset,
  location,
  user_team,
  player,
  coach,
  account,
  session,
  verification,
  "user",
  team
RESTART IDENTITY
CASCADE;

-- Shared by every seeded account. Plain text: Rovers@2026
CREATE TEMP TABLE seed_config ON COMMIT DROP AS
SELECT
  '00e8578fb0747dcc4638385e34ce82fb:d354d2b3dcd1ee07ab829969261bece30dc94d126bbfd8694df85229b8e1d5718ba08501e1f236945ac4c7beffdfd202cab8488a4790ac34e806e4ef14800266'::text
    AS password_hash;

-- ============================================================
-- 1) TEAM (20): idx 1 is the club's own team, 2..20 are opponents
-- ============================================================
-- The default team keeps a fixed id: a signed-in browser caches its session
-- (team_id included) for up to an hour, so a fresh id on every reseed would
-- leave that session reading an empty, nonexistent team.
CREATE TEMP TABLE seed_team ON COMMIT DROP AS
SELECT
  idx,
  CASE
    WHEN idx = 1 THEN '352ca09c-e528-4a9e-84db-637e22160826'::uuid
    ELSE gen_random_uuid()
  END AS team_id,
  name,
  email,
  establish_year
FROM (
  VALUES
    (1, 'Saigon Rovers Basketball Club', 'sgrovers.bball@gmail.com', 2024),
    (2, 'CLB Bóng rổ Phú Nhuận', 'bongro.phunhuan@example.com', 2012),
    (3, 'CLB Bóng rổ Tân Bình', 'bongro.tanbinh@example.com', 2015),
    (4, 'CLB Bóng rổ Gò Vấp', 'bongro.govap@example.com', 2018),
    (5, 'CLB Bóng rổ Thủ Đức', 'bongro.thuduc@example.com', 2010),
    (6, 'CLB Bóng rổ Bình Thạnh', 'bongro.binhthanh@example.com', 2016),
    (7, 'CLB Bóng rổ Quận 3', 'bongro.quan3@example.com', 2008),
    (8, 'CLB Bóng rổ Bình Tân', 'bongro.binhtan@example.com', 2019),
    (9, 'CLB Bóng rổ Quận 7', 'bongro.quan7@example.com', 2014),
    (10, 'CLB Bóng rổ Nhà Bè', 'bongro.nhabe@example.com', 2021),
    (11, 'CLB Bóng rổ Hóc Môn', 'bongro.hocmon@example.com', 2020),
    (12, 'CLB Bóng rổ Củ Chi', 'bongro.cuchi@example.com', 2022),
    (13, 'Bóng rổ Đại học Bách khoa', 'bongro.bachkhoa@example.com', 2005),
    (14, 'Bóng rổ Đại học Kinh tế', 'bongro.kinhte@example.com', 2007),
    (15, 'Bóng rổ Đại học Sư phạm', 'bongro.supham@example.com', 2009),
    (16, 'CLB Bóng rổ Biên Hòa', 'bongro.bienhoa@example.com', 2013),
    (17, 'CLB Bóng rổ Thủ Dầu Một', 'bongro.thudaumot@example.com', 2017),
    (18, 'CLB Bóng rổ Vũng Tàu', 'bongro.vungtau@example.com', 2011),
    (19, 'CLB Bóng rổ Cần Thơ', 'bongro.cantho@example.com', 2006),
    (20, 'CLB Bóng rổ Đà Lạt', 'bongro.dalat@example.com', 2023)
) v(idx, name, email, establish_year);

INSERT INTO team (
  team_id, is_default, is_external, name, email, establish_year, image,
  rule_content, rule_updated_at
)
SELECT
  t.team_id,
  t.idx = 1,
  t.idx <> 1,
  t.name,
  t.email,
  t.establish_year,
  NULL,
  CASE WHEN t.idx = 1 THEN
    '<p>🗓️ <strong>Training Schedule</strong></p><p></p><ul><li><p>Time: 20:00 - 21:30 (Tuesdays and Thursdays)</p></li><li><p>Location: Hoa Viên Court (02 Lê Đại Hành)</p></li></ul><p></p><p>🧧 <strong>Team Fund</strong>: 280.000 VND</p><p></p><hr><p></p><p>🛡️ <strong>RULEs</strong> 🛡️</p><p></p><p>Only train with our team, and do not participate in other clubs outside the school.</p><p></p><h3><strong>Absence</strong></h3><p></p><ol><li><p>Notification: Notify by 4:00 PM if unable to attend.</p></li><li><p>Temporary Leave: If you cannot participate for more than 3 months:</p><ul><li><p>Pay a 100,000 VND/month maintenance fee</p></li><li><p>Provide a valid reason for the extended leave</p></li></ul></li></ol><p></p><h3><strong>Tournament Participation</strong></h3><p></p><ol><li><p>Notification: Inform the coach of your intent to join school tournaments.</p></li><li><p>Voting<strong>:</strong></p><ul><li><p>Team members vote to join tournaments.</p></li><li><p>If you don''t vote to participate in the team, you won''t participate in other clubs either.</p></li></ul></li></ol>'
  END,
  CASE WHEN t.idx = 1 THEN now() END
FROM seed_team t;

-- ============================================================
-- 2) USER (20) - all on the default team
-- ============================================================
CREATE TEMP TABLE seed_user ON COMMIT DROP AS
SELECT
  idx,
  'user-' || to_char(idx, 'FM000') AS id,
  name,
  email,
  role::user_role AS role,
  state::user_state AS state,
  dob::date AS dob,
  join_date::date AS join_date
FROM (
  VALUES
    (1, 'Dios Vo', 'vtmn1212@gmail.com', 'super_admin', 'active', '1999-12-12', '2024-02-20'),
    (2, 'Nguyễn Văn Hùng', 'hung.nguyen@example.com', 'coach', 'active', '1985-04-18', '2024-02-20'),
    (3, 'Trần Minh Khang', 'khang.tran@example.com', 'player', 'active', '1998-06-02', '2024-02-20'),
    (4, 'Lê Hoàng Phúc', 'phuc.le@example.com', 'player', 'active', '2000-09-14', '2024-02-20'),
    (5, 'Phạm Quốc Bảo', 'bao.pham@example.com', 'player', 'active', '2001-01-27', '2024-03-05'),
    (6, 'Huỳnh Gia Huy', 'huy.huynh@example.com', 'player', 'active', '1999-11-08', '2024-03-05'),
    (7, 'Võ Thành Đạt', 'dat.vo@example.com', 'player', 'active', '1997-03-21', '2024-04-12'),
    (8, 'Đặng Tuấn Kiệt', 'kiet.dang@example.com', 'player', 'active', '2003-07-30', '2024-05-07'),
    (9, 'Bùi Nhật Nam', 'nam.bui@example.com', 'player', 'active', '2002-12-03', '2024-06-18'),
    (10, 'Đỗ Đức Anh', 'anh.do@example.com', 'player', 'active', '2000-05-16', '2024-08-01'),
    (11, 'Hồ Minh Triết', 'triet.ho@example.com', 'player', 'active', '1996-10-09', '2024-09-10'),
    (12, 'Ngô Thanh Tùng', 'tung.ngo@example.com', 'player', 'active', '2004-02-25', '2024-11-19'),
    (13, 'Dương Khôi Nguyên', 'nguyen.duong@example.com', 'player', 'active', '2005-08-11', '2025-01-14'),
    (14, 'Lý Hải Đăng', 'dang.ly@example.com', 'player', 'active', '2001-04-04', '2025-03-04'),
    (15, 'Mai Trọng Nhân', 'nhan.mai@example.com', 'player', 'active', '2003-09-19', '2025-05-20'),
    (16, 'Trương Công Vinh', 'vinh.truong@example.com', 'player', 'active', '1998-01-07', '2025-07-08'),
    (17, 'Phan Quang Long', 'long.phan@example.com', 'player', 'active', '2006-03-13', '2025-09-16'),
    (18, 'Nguyễn Thiện Tâm', 'tam.nguyen@example.com', 'player', 'temporarily_absent', '1999-07-22', '2024-04-12'),
    (19, 'Lâm Tấn Phát', 'phat.lam@example.com', 'player', 'inactive', '1997-12-29', '2024-02-20'),
    (20, 'Châu Ngọc Hân', 'han.chau@example.com', 'guest', 'active', '2002-06-06', '2025-10-01')
) v(idx, name, email, role, state, dob, join_date);

INSERT INTO "user" (
  id, name, email, email_verified, image, team_id, dob,
  phone_number, citizen_identification, state, role
)
SELECT
  u.id,
  u.name,
  u.email,
  true,
  NULL,
  (SELECT team_id FROM seed_team WHERE idx = 1),
  u.dob,
  '09' || lpad((10000000 + u.idx * 4123457 % 90000000)::text, 8, '0'),
  '079' || lpad((100000000 + u.idx * 37851219 % 900000000)::text, 9, '0'),
  u.state,
  u.role
FROM seed_user u;

-- One open stint per user, on the default team
INSERT INTO user_team (user_id, team_id, join_date)
SELECT u.id, (SELECT team_id FROM seed_team WHERE idx = 1), u.join_date
FROM seed_user u;

-- Email + password sign-in. better-auth stores the user id as account_id.
INSERT INTO account (id, account_id, provider_id, user_id, password)
SELECT 'acc-' || u.id, u.id, 'credential', u.id, c.password_hash
FROM seed_user u, seed_config c;

-- ============================================================
-- 3) COACH (1) + PLAYER (17)
-- ============================================================
INSERT INTO coach (id, position)
SELECT id, 'head_coach'::coach_position
FROM seed_user
WHERE role = 'coach';

INSERT INTO player (id, is_captain, jersey_number, position, height, weight)
SELECT
  'user-' || to_char(idx, 'FM000'),
  idx = 3,
  jersey_number,
  position::player_position,
  height,
  weight
FROM (
  VALUES
    (3, 7, 'point_guard', 178, 70),
    (4, 11, 'shooting_guard', 182, 74),
    (5, 23, 'small_forward', 188, 80),
    (6, 34, 'power_forward', 191, 86),
    (7, 15, 'center', 196, 92),
    (8, 3, 'point_guard', 175, 66),
    (9, 9, 'shooting_guard', 180, 72),
    (10, 21, 'small_forward', 186, 78),
    (11, 44, 'power_forward', 190, 88),
    (12, 50, 'center', 198, 95),
    (13, 1, 'point_guard', 172, 63),
    (14, 12, 'shooting_guard', 181, 73),
    (15, 8, 'small_forward', 185, 76),
    (16, 33, 'power_forward', 189, 84),
    (17, 55, 'center', 194, 90),
    (18, 24, 'shooting_guard', 183, 75),
    (19, 6, 'unknown', 179, 71)
) v(idx, jersey_number, position, height, weight);

-- ============================================================
-- 4) LOCATION (8)
-- ============================================================
CREATE TEMP TABLE seed_location ON COMMIT DROP AS
SELECT idx, gen_random_uuid() AS location_id, name, address
FROM (
  VALUES
    (1, 'Sân Hoa Viên', '02 Lê Đại Hành, Phường 15, Quận 11, TP. Hồ Chí Minh'),
    (2, 'Nhà thi đấu Phú Thọ', '1 Lữ Gia, Phường 15, Quận 11, TP. Hồ Chí Minh'),
    (3, 'Nhà văn hóa Thanh niên', '4 Phạm Ngọc Thạch, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh'),
    (4, 'Nhà thi đấu Rạch Miễu', '1 Hoa Phượng, Phường 2, Quận Phú Nhuận, TP. Hồ Chí Minh'),
    (5, 'Nhà thi đấu Tân Bình', '448 Hoàng Văn Thụ, Phường 4, Quận Tân Bình, TP. Hồ Chí Minh'),
    (6, 'Sân bóng rổ Tao Đàn', '1 Huyền Trân Công Chúa, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh'),
    (7, 'Trung tâm TDTT Quận 7', '1 Nguyễn Thị Thập, Phường Tân Phú, Quận 7, TP. Hồ Chí Minh'),
    (8, 'Nhà thi đấu Đại học Bách khoa', '268 Lý Thường Kiệt, Phường 14, Quận 10, TP. Hồ Chí Minh')
) v(idx, name, address);

INSERT INTO location (location_id, name, address)
SELECT location_id, name, address FROM seed_location;

-- ============================================================
-- 5) ASSET (12) - the default team's equipment
-- ============================================================
INSERT INTO asset (
  team_id, name, assigned_to, acquired_date, category, quantity, condition, note
)
SELECT
  (SELECT team_id FROM seed_team WHERE idx = 1),
  name,
  assigned_to,
  CURRENT_DATE - acquired_ago,
  category::asset_catogory,
  quantity,
  condition::asset_condition,
  note
FROM (
  VALUES
    ('Molten BG4500 game balls', 'user-002', 520, 'equipment', 10, 'good', '<p>Game balls, for matches only.</p>'),
    ('Spalding training balls', 'user-002', 610, 'training', 15, 'fair', NULL),
    ('Home jerseys', NULL, 600, 'equipment', 18, 'good', '<p>White, numbers 0 - 99.</p>'),
    ('Away jerseys', NULL, 600, 'equipment', 18, 'good', '<p>Navy blue.</p>'),
    ('Reversible practice jerseys', NULL, 420, 'training', 20, 'fair', NULL),
    ('Training cones', 'user-002', 400, 'training', 24, 'good', NULL),
    ('Agility ladders', NULL, 380, 'training', 2, 'poor', '<p>One ladder has a broken strap and needs replacing.</p>'),
    ('Tactics board', 'user-002', 500, 'equipment', 1, 'good', NULL),
    ('Electric ball pump', 'user-003', 300, 'others', 1, 'good', NULL),
    ('Ball bags', NULL, 450, 'others', 3, 'fair', NULL),
    ('First aid kit', 'user-003', 200, 'others', 1, 'good', '<p>Check the bandages every month.</p>'),
    ('Stopwatches', NULL, 700, 'equipment', 2, 'obsolete', NULL)
) v(name, assigned_to, acquired_ago, category, quantity, condition, note);

-- ============================================================
-- 6) LEAGUE (6) - past, ongoing and upcoming (status derives from dates)
-- ============================================================
CREATE TEMP TABLE seed_league ON COMMIT DROP AS
SELECT
  idx,
  gen_random_uuid() AS league_id,
  base_name || ' ' || extract(year FROM CURRENT_DATE + start_offset)::int AS name,
  CURRENT_DATE + start_offset AS start_date,
  CURRENT_DATE + end_offset AS end_date,
  description
FROM (
  VALUES
    (1, 'Saigon Open Basketball Tournament', -700, -640, 'Open tournament for amateur clubs.'),
    (2, 'District 11 Amateur Cup', -560, -510, 'District-level friendly cup.'),
    (3, 'Saigon Summer League', -470, -420, 'Summer league, played on weekends.'),
    (4, 'Inter-District League', -330, -270, 'League between the inner-city districts.'),
    (5, 'Autumn Cup', -40, 30, 'Currently in progress.'),
    (6, 'Spring Invitational', 60, 120, 'Starting soon.')
) v(idx, base_name, start_offset, end_offset, description);

INSERT INTO league (league_id, name, start_date, end_date, description)
SELECT league_id, name, start_date, end_date, description FROM seed_league;

-- Each league: the default team plus 5 opponents
CREATE TEMP TABLE seed_league_team ON COMMIT DROP AS
SELECT l.idx AS league_idx, l.league_id, 0 AS slot, t.team_id
FROM seed_league l
JOIN seed_team t ON t.idx = 1
UNION ALL
SELECT l.idx, l.league_id, k, t.team_id
FROM seed_league l
CROSS JOIN generate_series(1, 5) k
JOIN seed_team t ON t.idx = 2 + ((l.idx * 3 + k * 4) % 19);

INSERT INTO league_team (league_id, team_id)
SELECT league_id, team_id FROM seed_league_team;

-- 12-player league roster for the default team, rotating who sits out
INSERT INTO league_team_roster (league_id, team_id, player_id)
SELECT l.league_id, (SELECT team_id FROM seed_team WHERE idx = 1), p.id
FROM seed_league l
JOIN LATERAL (
  SELECT p.id
  FROM player p
  ORDER BY (hashtext(p.id || l.idx) % 1000)
  LIMIT 12
) p ON true;

-- ============================================================
-- 7) TRAINING_SESSION (~100) - Tuesdays and Thursdays, 20:00 - 21:30
-- ============================================================
INSERT INTO training_session (
  team_id, coach_id, location_id, date, start_time, end_time, status
)
SELECT
  (SELECT team_id FROM seed_team WHERE idx = 1),
  'user-002',
  (SELECT location_id FROM seed_location WHERE idx = CASE WHEN n % 9 = 0 THEN 3 ELSE 1 END),
  d::date,
  time '20:00',
  time '21:30',
  (CASE
    WHEN d::date > CURRENT_DATE THEN 'scheduled'
    WHEN d::date = CURRENT_DATE THEN 'active'
    WHEN n % 13 = 0 THEN 'cancelled'
    ELSE 'completed'
  END)::session_status
FROM (
  SELECT d, row_number() OVER (ORDER BY d) AS n
  FROM generate_series(CURRENT_DATE - 330, CURRENT_DATE + 21, interval '1 day') d
  WHERE extract(isodow FROM d) IN (2, 4)
) s;

-- ============================================================
-- 8) ATTENDANCE (~100)
-- Session-linked rows for the active players over the 6 latest completed
-- sessions (`date` must equal the session's date), plus session-less leave
-- requests for upcoming sessions. Reasons are short English notes; a few
-- absences give no reason.
-- ============================================================
WITH recent AS (
  SELECT session_id, date, row_number() OVER (ORDER BY date DESC) AS rn
  FROM training_session
  WHERE status = 'completed'
  ORDER BY date DESC
  LIMIT 6
),
roster AS (
  SELECT p.id, row_number() OVER (ORDER BY p.id) AS prn
  FROM player p
  JOIN "user" u ON u.id = p.id
  WHERE u.state = 'active'
),
pairs AS (
  SELECT
    r.session_id,
    r.date,
    ro.id AS player_id,
    CASE
      WHEN (ro.prn * 7 + r.rn * 3) % 13 = 0 THEN 'absent'
      WHEN (ro.prn * 5 + r.rn) % 9 = 0 THEN 'late'
      ELSE 'on_time'
    END AS status,
    (ro.prn + r.rn) % 4 AS reason_idx
  FROM recent r
  CROSS JOIN roster ro
)
INSERT INTO attendance (player_id, session_id, status, date, reason)
SELECT
  player_id,
  session_id,
  status::attendance_status,
  date,
  CASE status
    WHEN 'absent' THEN (ARRAY['Sick', 'Family matters', 'Work', NULL])[1 + reason_idx]
    WHEN 'late' THEN (ARRAY['Traffic', 'Work', 'Motorbike broke down', 'Heavy rain'])[1 + reason_idx]
  END
FROM pairs;

WITH upcoming AS (
  SELECT date, row_number() OVER (ORDER BY date) AS rn
  FROM training_session
  WHERE status = 'scheduled'
)
INSERT INTO attendance (player_id, session_id, status, date, reason)
SELECT player_id, NULL, 'absent'::attendance_status, u.date, v.reason
FROM upcoming u
JOIN (
  VALUES
    ('user-018', 1, 'Ankle sprain'),
    ('user-018', 2, 'Ankle sprain'),
    ('user-018', 3, 'Ankle sprain'),
    ('user-003', 2, 'Work trip'),
    ('user-009', 1, 'Exams')
) v(player_id, rn, reason) ON v.rn = u.rn;

-- ============================================================
-- 9) MATCH (100) - one a week for the default team
-- Matches inside a league window are league games against that league's
-- teams; the rest are friendlies. Only completed matches carry a score.
-- ============================================================
WITH slots AS (
  SELECT n, CURRENT_DATE + 42 - n * 7 AS match_date
  FROM generate_series(0, 99) n
),
resolved AS (
  SELECT
    s.n,
    s.match_date,
    l.idx AS league_idx,
    l.league_id,
    COALESCE(
      (SELECT lt.team_id FROM seed_league_team lt
        WHERE lt.league_idx = l.idx AND lt.slot = 1 + s.n % 5),
      (SELECT t.team_id FROM seed_team t WHERE t.idx = 2 + (s.n * 7) % 19)
    ) AS opponent,
    (CASE
      WHEN s.match_date > CURRENT_DATE THEN 'scheduled'
      WHEN s.n % 17 = 5 THEN 'cancelled'
      ELSE 'completed'
    END)::match_status AS status
  FROM slots s
  LEFT JOIN seed_league l ON s.match_date BETWEEN l.start_date AND l.end_date
)
INSERT INTO "match" (
  is_5x5, league_id, location_id, home_team, away_team, date, time, status,
  home_team_score, away_team_score
)
SELECT
  r.league_id IS NOT NULL OR r.n % 3 <> 0,
  r.league_id,
  (SELECT location_id FROM seed_location
    WHERE idx = CASE WHEN r.league_id IS NULL THEN 1 + r.n % 8 ELSE 2 + r.league_idx % 3 END),
  CASE WHEN r.n % 2 = 0 THEN own.team_id ELSE r.opponent END,
  CASE WHEN r.n % 2 = 0 THEN r.opponent ELSE own.team_id END,
  r.match_date,
  (ARRAY[time '18:00', time '19:30', time '08:00', time '16:00'])[1 + r.n % 4],
  r.status,
  CASE WHEN r.status = 'completed' THEN 52 + (r.n * 37) % 41 ELSE 0 END,
  CASE WHEN r.status = 'completed' THEN 50 + (r.n * 53) % 43 ELSE 0 END
FROM resolved r
CROSS JOIN (SELECT team_id FROM seed_team WHERE idx = 1) own;

-- Basketball has no draws: nudge any tied result by a basket.
UPDATE "match"
SET away_team_score = away_team_score + 2
WHERE status = 'completed' AND home_team_score = away_team_score;

-- ============================================================
-- 10) MATCH_PLAYER_STATS (100) - box scores for the 10 latest 5x5 games,
--     10 players each. The default team's score is the sum of its box score.
-- ============================================================
WITH recent AS (
  SELECT match_id, row_number() OVER (ORDER BY date DESC) AS mn
  FROM "match"
  WHERE status = 'completed' AND is_5x5
  ORDER BY date DESC
  LIMIT 10
),
lineup AS (
  SELECT r.match_id, r.mn, p.id AS player_id, p.position, p.rn
  FROM recent r
  JOIN LATERAL (
    SELECT p.id, p.position, row_number() OVER (ORDER BY hashtext(p.id || r.mn)) AS rn
    FROM player p
    JOIN "user" u ON u.id = p.id
    WHERE u.state = 'active'
    ORDER BY hashtext(p.id || r.mn)
    LIMIT 10
  ) p ON true
)
INSERT INTO match_player_stats (
  match_id, player_id, team_id,
  points_scored, rebounds, assists, steals, blocks, turnovers, fouls, minutes_played
)
SELECT
  l.match_id,
  l.player_id,
  (SELECT team_id FROM seed_team WHERE idx = 1),
  CASE WHEN l.rn <= 5 THEN 8 + (l.rn * 7 + l.mn * 3) % 15 ELSE 2 + (l.rn * 5 + l.mn) % 9 END,
  CASE WHEN l.position IN ('center', 'power_forward') THEN 6 + (l.rn + l.mn) % 7 ELSE 1 + (l.rn + l.mn) % 5 END,
  CASE WHEN l.position = 'point_guard' THEN 4 + (l.rn + l.mn) % 6 ELSE (l.rn * 3 + l.mn) % 4 END,
  (l.rn + l.mn) % 4,
  CASE WHEN l.position = 'center' THEN 1 + (l.rn + l.mn) % 3 ELSE (l.rn * l.mn) % 2 END,
  (l.rn * 2 + l.mn) % 4,
  (l.rn + l.mn * 2) % 5,
  CASE WHEN l.rn <= 5 THEN 26 + (l.rn + l.mn) % 10 ELSE 8 + (l.rn * 3 + l.mn) % 12 END
FROM lineup l;

UPDATE "match" m
SET
  home_team_score = CASE WHEN m.home_team = s.team_id THEN s.total ELSE m.home_team_score END,
  away_team_score = CASE WHEN m.away_team = s.team_id THEN s.total ELSE m.away_team_score END
FROM (
  SELECT match_id, team_id, sum(points_scored)::int AS total
  FROM match_player_stats
  GROUP BY match_id, team_id
) s
WHERE m.match_id = s.match_id;

UPDATE "match"
SET away_team_score = away_team_score + 2
WHERE status = 'completed' AND home_team_score = away_team_score;

-- ============================================================
-- 11) TEST_TYPE (5) + TEST_RESULT (3 rounds) + TEST_NOTE
-- ============================================================
CREATE TEMP TABLE seed_test_type ON COMMIT DROP AS
SELECT idx, gen_random_uuid() AS type_id, name, unit::test_type_unit AS unit, higher_is_better, target
FROM (
  VALUES
    (1, '20m sprint', 'seconds', false, 3.200),
    (2, 'Standing long jump', 'meters', true, 2.400),
    (3, 'Free throw percentage', 'percent', true, 75.000),
    (4, '1-minute push-ups', 'reps', true, 40.000),
    (5, 'Beep test', 'points', true, 10.000)
) v(idx, name, unit, higher_is_better, target);

INSERT INTO test_type (type_id, team_id, name, unit, higher_is_better, target)
SELECT type_id, (SELECT team_id FROM seed_team WHERE idx = 1), name, unit, higher_is_better, target
FROM seed_test_type;

-- `trend` is -1, 0 or 1 per player and test, so progression shows every state.
WITH players AS (
  SELECT p.id, row_number() OVER (ORDER BY p.id) AS pn
  FROM player p
  JOIN "user" u ON u.id = p.id
  WHERE u.state <> 'inactive'
),
rounds AS (
  SELECT r, CURRENT_DATE - (200 - r * 90) AS test_date
  FROM generate_series(0, 2) r
)
INSERT INTO test_result (player_id, type_id, result, date)
SELECT
  p.id,
  t.type_id,
  round((CASE t.idx
    WHEN 1 THEN 3.65 - (p.pn % 5) * 0.06 - ro.r * 0.05 * x.trend
    WHEN 2 THEN 2.05 + (p.pn % 6) * 0.06 + ro.r * 0.04 * x.trend
    WHEN 3 THEN 55 + (p.pn * 7) % 25 + ro.r * 3 * x.trend
    WHEN 4 THEN 24 + (p.pn * 3) % 18 + ro.r * 2 * x.trend
    ELSE 7.5 + (p.pn % 5) * 0.4 + ro.r * 0.3 * x.trend
  END)::numeric, CASE WHEN t.idx = 4 THEN 0 ELSE 2 END)::numeric(10, 3),
  ro.test_date
FROM players p
CROSS JOIN seed_test_type t
CROSS JOIN rounds ro
CROSS JOIN LATERAL (SELECT ((p.pn + t.idx) % 3) - 1 AS trend) x;

INSERT INTO test_note (player_id, type_id, content, goal, author_id, created_at)
SELECT
  v.player_id,
  (SELECT type_id FROM seed_test_type WHERE idx = v.type_idx),
  v.content,
  v.goal,
  'user-002',
  now() - (v.days_ago || ' days')::interval
FROM (
  VALUES
    ('user-003', 1, 'Work on the first step; add reaction drills.', 3.300, 15),
    ('user-005', 3, 'Solid form; raise free throws to 50 per session.', 80.000, 18),
    ('user-007', 4, 'Good upper-body strength; keep the current plan.', NULL, 20),
    ('user-008', 5, 'Endurance dropped after the break; add 2 runs a week.', 9.500, 12),
    ('user-012', 2, 'Needs plyometrics to improve explosiveness.', 2.300, 25),
    ('user-014', 3, 'Shot is more consistent; focus on breathing before each attempt.', 78.000, 9),
    ('user-016', NULL, 'Great attitude at practice and supportive of teammates.', NULL, 30),
    ('user-017', 1, 'New player, still adjusting to the team''s training intensity.', 3.500, 6)
) v(player_id, type_idx, content, goal, days_ago);

-- ============================================================
-- 12) ACHIEVEMENT (7) - owned by the default team. Only `custom` has a
--     title; the rest show the type's label in the viewer's language.
-- ============================================================
INSERT INTO achievement (team_id, type, title, year, league_id, player_id, description)
SELECT
  (SELECT team_id FROM seed_team WHERE idx = 1),
  v.type::achievement_type,
  v.title::varchar,
  extract(year FROM COALESCE(l.end_date, CURRENT_DATE - 200))::int,
  l.league_id,
  v.player_id,
  v.description
FROM (
  VALUES
    ('champion', NULL, 1, NULL, 'Won the final in overtime.'),
    ('runner_up', NULL, 2, NULL, NULL),
    ('third_place', NULL, 3, NULL, NULL),
    ('champion', NULL, 4, NULL, 'Unbeaten all season.'),
    ('mvp', NULL, 4, 'user-003', NULL),
    ('top_scorer', NULL, 4, 'user-005', 'Averaged 18.5 points per game.'),
    ('custom', 'Fair Play Award', NULL, NULL, 'Voted by the amateur league organizers.')
) v(type, title, league_idx, player_id, description)
LEFT JOIN seed_league l ON l.idx = v.league_idx;

-- ============================================================
-- 13) REPORT_SCHEDULE (1) - monthly report, sent on the 1st at 08:00 (VN)
-- ============================================================
INSERT INTO report_schedule (team_id, "interval", recipients, next_run_at)
SELECT
  (SELECT team_id FROM seed_team WHERE idx = 1),
  'last_month'::report_interval,
  ARRAY['vtmn1212@gmail.com'],
  (date_trunc('month', now() AT TIME ZONE 'Asia/Ho_Chi_Minh') + interval '1 month 8 hours')
    AT TIME ZONE 'Asia/Ho_Chi_Minh';

-- Past runs of that schedule: one per month for the last 12 months, sent on
-- the 1st at 08:00 ICT for the previous month. No PDF files exist for seeded
-- rows, so none is downloadable: runs past RETENTION_DAYS (90) are `expired`
-- (file purged), newer ones `failed` with the error the history table shows.
INSERT INTO report_history (
  team_id, schedule_id, scheduled_for, "interval", period, status, "trigger",
  attempts, error, filename, resend_email_id, delivery_status,
  started_at, completed_at, expires_at, created_at
)
SELECT
  s.team_id,
  s.schedule_id,
  r.scheduled_for,
  'last_month'::report_interval,
  r.period,
  CASE WHEN r.expired THEN 'expired' ELSE 'failed' END::report_status,
  'scheduled'::report_trigger,
  CASE WHEN r.expired THEN 1 ELSE 3 END,
  CASE WHEN r.expired THEN NULL ELSE 'Email provider rejected the request: missing API key' END,
  'analytics-last_month-' || regexp_replace(r.period, '[^0-9]', '', 'g') || '.pdf',
  CASE WHEN r.expired THEN gen_random_uuid()::text END,
  CASE WHEN r.expired THEN 'delivered' END,
  r.scheduled_for,
  r.scheduled_for + interval '40 seconds',
  CASE WHEN r.expired THEN r.scheduled_for + interval '90 days' END,
  r.scheduled_for
FROM report_schedule s
CROSS JOIN LATERAL (
  SELECT
    run_at AS scheduled_for,
    to_char(month_start, 'DD/MM/YYYY') || ' - '
      || to_char(month_start + interval '1 month' - interval '1 day', 'DD/MM/YYYY') AS period,
    run_at < now() - interval '90 days' AS expired
  FROM (
    SELECT
      (date_trunc('month', now() AT TIME ZONE 'Asia/Ho_Chi_Minh') - make_interval(months => k)) AS month_start,
      (date_trunc('month', now() AT TIME ZONE 'Asia/Ho_Chi_Minh') - make_interval(months => k - 1) + interval '8 hours')
        AT TIME ZONE 'Asia/Ho_Chi_Minh' AS run_at
    FROM generate_series(1, 12) AS k
  ) m
) r
WHERE s."interval" = 'last_month'::report_interval
  -- this month's 08:00 run may still be ahead
  AND r.scheduled_for <= now();

-- One ad-hoc yearly report, emailed by hand (no schedule) early this year.
INSERT INTO report_history (
  team_id, schedule_id, scheduled_for, "interval", period, status, "trigger",
  attempts, filename, resend_email_id, delivery_status,
  started_at, completed_at, expires_at, created_at
)
SELECT
  (SELECT team_id FROM seed_team WHERE idx = 1),
  NULL,
  NULL,
  'last_year'::report_interval,
  '01/01/' || y || ' - 31/12/' || y,
  'expired'::report_status,
  'manual'::report_trigger,
  1,
  'analytics-last_year-0101' || y || '3112' || y || '.pdf',
  gen_random_uuid()::text,
  'opened',
  run_at,
  run_at + interval '1 minute',
  run_at + interval '90 days',
  run_at
FROM (
  SELECT
    extract(year FROM now())::int - 1 AS y,
    date_trunc('year', now()) + interval '9 days 10 hours' AS run_at
) v
-- only once its 90-day file retention has run out
WHERE run_at < now() - interval '90 days';

COMMIT;
