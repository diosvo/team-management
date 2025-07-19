/**
 * Shared interfaces for periodic testing components
 */

export interface TransformedTestResult {
  test_id: string;
  player_name: string;
  test_type: string;
  score: number;
  previous_score?: number;
  notes?: string;
  unit: string;
  value_type: string;
}

export interface TestResultData {
  result_id: string;
  user_id: string;
  type_id: string;
  unit: string;
  result: string;
  test_date: Date;
  user_name: string | null;
  user_email: string | null;
  test_type_name: string | null;
}

export interface TestTypeData {
  type_id: string;
  name: string;
  unit: string | null;
  state: string | null;
}

export interface MappingData {
  users: { [playerName: string]: string };
  testTypes: { [testTypeName: string]: string };
}

export interface InitialData {
  testResults: TestResultData[];
  testTypes: TestTypeData[];
}

export interface PlayerTestMatrix {
  player_name: string;
  tests: Record<
    string,
    {
      score: number;
      previous_score?: number;
      improvement?: number;
      unit: string;
      value_type: string;
    }
  >;
}
