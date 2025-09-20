import { TestType, User } from '@/drizzle/schema';

export interface PlayerTestResult {
  result_id: string;
  player_id: string;
  player_name: string;
  tests: Record<string, string>;
}

export interface TestResult {
  headers: Array<{ name: string; unit: string }>;
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
