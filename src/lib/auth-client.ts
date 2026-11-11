import {
  customSessionClient,
  inferAdditionalFields,
} from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';

import type auth from './auth';

type Auth = typeof auth;

export default createAuthClient({
  plugins: [inferAdditionalFields<Auth>(), customSessionClient<Auth>()],
});
