import { inferAdditionalFields } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';

import authClient from './auth-client';

const { client, fieldsPlugin } = vi.hoisted(() => ({
  client: { id: 'auth-client' },
  fieldsPlugin: { id: 'infer-additional-fields' },
}));

vi.mock('better-auth/react', () => ({
  createAuthClient: vi.fn(() => client),
}));

vi.mock('better-auth/client/plugins', () => ({
  inferAdditionalFields: vi.fn(() => fieldsPlugin),
}));

describe('auth-client', () => {
  test('creates the client with the additional-fields plugin', () => {
    expect(inferAdditionalFields).toHaveBeenCalled();
    expect(createAuthClient).toHaveBeenCalledWith({
      plugins: [fieldsPlugin],
    });
    expect(authClient).toBe(client);
  });
});
