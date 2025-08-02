export interface PlayerTestResult {
  result_id: string;
  user_id: string;
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
