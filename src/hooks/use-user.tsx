'use client';

import { createContext, ReactNode, useContext } from 'react';

import { User } from '@/drizzle/schema';

type UserContextType = {
  userPromise: Promise<Nullable<User>>;
};

const UserContext = createContext<Nullable<UserContextType>>(null);

export function useUser(): UserContextType {
  const context = useContext(UserContext);
  if (context === null) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
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
