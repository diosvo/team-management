import {
  InsertTestResult,
  InsertTestType,
  TestResult,
  TestType,
  User,
} from '@/drizzle/schema';

import {
  TestConfigurationSelection,
  TestResult as TestResultType,
} from '@/types/periodic-testing';
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

// A second player used to exercise filtering, column restriction, and removal.
export const MOCK_TEST_PLAYER_2: User = {
  ...MOCK_USER,
  id: 'user-456',
  name: 'Second Player',
};

export const MOCK_TEST_RESULT_RESPONSE: TestResultType = {
  headers: [
    {
      type_id: MOCK_TEST_TYPE.type_id,
      name: MOCK_TEST_TYPE.name,
      unit: MOCK_TEST_TYPE.unit,
    },
    {
      type_id: MOCK_TEST_TYPE_2.type_id,
      name: MOCK_TEST_TYPE_2.name,
      unit: MOCK_TEST_TYPE_2.unit,
    },
  ],
  players: [
    {
      player_id: MOCK_PLAYER.id,
      player_name: MOCK_USER.name,
      // The second test type is intentionally missing so an empty cell can
      // exercise the inline "create result" path.
      tests: {
        [MOCK_TEST_TYPE.name]: {
          result_id: MOCK_TEST_RESULT.result_id,
          result: MOCK_TEST_RESULT_INPUT.result,
        },
      },
    },
    {
      player_id: MOCK_TEST_PLAYER_2.id,
      player_name: MOCK_TEST_PLAYER_2.name,
      tests: {
        [MOCK_TEST_TYPE.name]: {
          result_id: 'result-456',
          result: '5.100',
        },
      },
    },
  ],
};

// ======================== Test Configuration ========================

export const MOCK_TEST_CONFIGURATION: TestConfigurationSelection = {
  players: [MOCK_USER, MOCK_TEST_PLAYER_2],
  types: [MOCK_TEST_TYPE, MOCK_TEST_TYPE_2],
  date: MOCK_TEST_RESULT_DATE,
};

export const MOCK_EMPTY_TEST_CONFIGURATION: TestConfigurationSelection = {
  players: [],
  types: [],
  date: MOCK_TEST_RESULT_DATE,
};
