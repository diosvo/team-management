import type { Option } from '@/utils/type';

// Two-value checkbox-group options shared by the filter component tests.
export const MOCK_ACTIVE_OPTION: Option<string> = {
  label: 'Active',
  value: 'active',
};

export const MOCK_INACTIVE_OPTION: Option<string> = {
  label: 'Inactive',
  value: 'inactive',
};

export const MOCK_STATUS_OPTIONS = [MOCK_ACTIVE_OPTION, MOCK_INACTIVE_OPTION];
