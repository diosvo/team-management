import {
  InsertTestResult,
  InsertTestType,
  TestResult,
  TestType,
} from '@/drizzle/schema';

import { TestResult as TestResultType } from '@/types/periodic-testing';
import { TestTypeUnit } from '@/utils/enum';

import { MOCK_TEAM } from './team';
import { MOCK_PLAYER, MOCK_USER } from './user';

// ======================== Test Type ========================

export const MOCK_TEST_TYPE_INPUT: InsertTestType = {
  team_id: MOCK_TEAM.team_id,
  name: 'Sprint 30m',
  unit: TestTypeUnit.SECONDS,
};

export const MOCK_TEST_TYPE: TestType = {
  ...(MOCK_TEST_TYPE_INPUT as TestType),
  type_id: 'type-123',
  created_at: new Date('2026-01-01'),
  updated_at: new Date('2026-01-01'),
};

export const MOCK_TEST_TYPE_2: TestType = {
  type_id: 'type-456',
  team_id: MOCK_TEAM.team_id,
  name: 'Push-ups',
  unit: TestTypeUnit.REPS,
  created_at: new Date('2026-01-01'),
  updated_at: new Date('2026-01-01'),
};

// ======================== Test Result ========================

export const MOCK_TEST_RESULT_DATE = '2026-01-15';

export const MOCK_TEST_RESULT_INPUT: InsertTestResult = {
  player_id: MOCK_PLAYER.id,
  type_id: MOCK_TEST_TYPE.type_id,
  result: '4.500',
  date: MOCK_TEST_RESULT_DATE,
};

export const MOCK_TEST_RESULT: TestResult = {
  result_id: 'result-123',
  ...MOCK_TEST_RESULT_INPUT,
  date: MOCK_TEST_RESULT_DATE,
  created_at: new Date('2026-01-01'),
  updated_at: new Date('2026-01-01'),
};

// Raw DB row returned by getTestResultByDate (with relations)
export const MOCK_TEST_RESULT_DB_ROW = {
  ...MOCK_TEST_RESULT,
  player: {
    ...MOCK_PLAYER,
    user: MOCK_USER,
  },
  type: {
    type_id: MOCK_TEST_TYPE.type_id,
    name: MOCK_TEST_TYPE.name,
    unit: MOCK_TEST_TYPE.unit,
  },
};

export const MOCK_TEST_RESULT_RESPONSE: TestResultType = {
  headers: [
    {
      name: MOCK_TEST_TYPE.name,
      unit: MOCK_TEST_TYPE.unit,
    },
  ],
  players: [
    {
      player_id: MOCK_PLAYER.id,
      player_name: MOCK_USER.name,
      tests: { [MOCK_TEST_TYPE.name]: MOCK_TEST_RESULT_INPUT.result },
      result_id: MOCK_TEST_RESULT.result_id,
    },
  ],
};
