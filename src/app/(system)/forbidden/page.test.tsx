import { forbidden } from 'next/navigation';

import Forbidden from './page';

describe('Forbidden', () => {
  test('triggers the forbidden boundary', () => {
    expect(() => Forbidden()).toThrow('FORBIDDEN');
    expect(forbidden).toHaveBeenCalled();
  });
});
