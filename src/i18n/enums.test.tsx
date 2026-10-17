import { createTranslator } from 'next-intl';

import { MESSAGES, renderHook, Providers } from '@/test/utilities';
import {
  PLAYER_POSITIONS_SELECTION,
  USER_STATE_SELECTION,
} from '@/utils/constants';
import { PlayerPosition, UserRole, UserState } from '@/utils/enum';

import { enumLabel, translateSelection, useSelection } from './enums';

const translator = (locale: 'en' | 'vi') =>
  createTranslator({ locale, messages: MESSAGES[locale], namespace: 'enums' });

describe('enumLabel', () => {
  test.each([
    ['en', 'Coach'],
    ['vi', 'Huấn luyện viên'],
  ] as const)('labels an enum value in %s', (locale, label) => {
    expect(enumLabel(translator(locale), 'userRole', UserRole.COACH)).toBe(
      label,
    );
  });

  test('labels boolean-keyed values', () => {
    expect(enumLabel(translator('en'), 'gameType', true)).toBe('5x5');
  });

  test.each([null, undefined])('shows a dash for %s', (value) => {
    expect(enumLabel(translator('en'), 'userRole', value)).toBe('-');
  });

  test('falls back to the raw value without a message', () => {
    expect(enumLabel(translator('en'), 'userRole', 'referee')).toBe('referee');
  });
});

describe('translateSelection', () => {
  test('translates labels and hints, keeping the values', () => {
    const [pointGuard] = translateSelection(
      translator('vi'),
      PLAYER_POSITIONS_SELECTION,
      'playerPosition',
    );

    expect(pointGuard).toEqual({
      label: 'PG',
      value: PlayerPosition.POINT_GUARD,
      description: 'Hậu vệ dẫn bóng',
    });
  });

  test('keeps options without a hint as they are', () => {
    const active = translateSelection(
      translator('vi'),
      USER_STATE_SELECTION,
      'userState',
    ).find(({ value }) => value === UserState.ACTIVE);

    expect(active).toEqual({
      label: 'Đang hoạt động',
      value: UserState.ACTIVE,
      description: undefined,
    });
  });
});

describe('useSelection', () => {
  test('follows the active locale', () => {
    const { result } = renderHook(
      () => useSelection(USER_STATE_SELECTION, 'userState'),
      {
        wrapper: ({ children }) => (
          <Providers locale="vi">{children}</Providers>
        ),
      },
    );

    expect(result.current.map(({ label }) => label)).toEqual([
      'Đang hoạt động',
      'Ngừng hoạt động',
      'Tạm vắng',
      'Chưa rõ',
    ]);
  });
});
