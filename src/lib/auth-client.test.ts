import {
  customSessionClient,
  inferAdditionalFields,
} from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';

import authClient from './auth-client';

const { client, fieldsPlugin, sessionPlugin } = vi.hoisted(() => ({
  client: { id: 'auth-client' },
  fieldsPlugin: { id: 'infer-additional-fields' },
  sessionPlugin: { id: 'custom-session-client' },
}));

vi.mock('better-auth/react', () => ({
  createAuthClient: vi.fn(() => client),
}));

vi.mock('better-auth/client/plugins', () => ({
  inferAdditionalFields: vi.fn(() => fieldsPlugin),
  customSessionClient: vi.fn(() => sessionPlugin),
}));

describe('auth-client', () => {
  test('creates the client with the additional-fields and custom-session plugins', () => {
    expect(inferAdditionalFields).toHaveBeenCalled();
    expect(customSessionClient).toHaveBeenCalled();
    expect(createAuthClient).toHaveBeenCalledWith({
      plugins: [fieldsPlugin, sessionPlugin],
    });
    expect(authClient).toBe(client);
  });
});
