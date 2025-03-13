import bcrypt from 'bcryptjs';
import type { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

import { getUserByEmail } from '@/features/user/db/auth';
import { LoginSchema } from '@/features/user/schemas/auth';

export default {
  providers: [
    Credentials({
      authorize: async (credentials) => {
        const { success, data } = LoginSchema.safeParse(credentials);

        if (success) {
          const { email, password } = data;

          const user = await getUserByEmail(email);

          // Password is null in case we use providers like Google.
          if (!user || !user.password) return null;

          const matcher = await bcrypt.compare(password, user.password);

          if (matcher) return user;
        }

        return null;
      },
    }),
  ],
} satisfies NextAuthConfig;
