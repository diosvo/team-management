import { TestType, User } from '@/drizzle/schema';

export interface PlayerTestResult {
  player_id: string;
  player_name: string;
  // Keyed by test type name. Each cell carries its own `result_id` so an
  // inline edit updates the correct player/type row.
  tests: Record<string, { result_id: string; result: string }>;
}

export interface TestResult {
  // `type_id` lets an inline edit on an empty cell create the missing result.
  headers: Array<{ type_id: string; name: string; unit: string }>;
  players: Array<PlayerTestResult>;
}

export interface TestFilters {
  search: string;
  date: string;
}

export interface TestConfigurationSelection {
  players: Array<User>;
  types: Array<TestType>;
  date: string;
}
