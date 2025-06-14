'use client';

import { createContext, ReactNode, use, useContext } from 'react';

import { User } from '@/drizzle/schema/user';

type UserContextType = {
  userPromise: Promise<Nullable<User>>;
};

const UserContext = createContext<Nullable<UserContextType>>(null);

/**
 * @description Hook to get the current user in client components
 */
export function useUser(): UserContextType {
  const context = useContext(UserContext);
  if (context === null) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

/**
 * @description Hook to get the resolved current user (blocking)
 */
export function useCurrentUser(): Nullable<User> {
  const { userPromise } = useUser();
  return use(userPromise);
}

export function UserProvider({
  children,
  userPromise,
}: {
  children: ReactNode;
  userPromise: UserContextType['userPromise'];
}) {
  return (
    <UserContext.Provider value={{ userPromise }}>
      {children}
    </UserContext.Provider>
  );
}
