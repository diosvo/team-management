-- Jersey numbers were globally unique, so two players on different teams could
-- not both wear #23. The rule is per team, but `player` has no `team_id` (it
-- comes via `user`), so it cannot be expressed as a constraint here — the
-- action layer checks it instead, scoped to the editor's team.

ALTER TABLE "player" DROP CONSTRAINT "player_jersey_number_unique";
