'use client';

import { useEffect, useState } from 'react';

import authClient from '@/lib/auth-client';

import { UserRole } from '@/utils/enum';
import { hasPermissions } from '@/utils/helper';

export default function usePermissions() {
  const [mounted, setMounted] = useState<boolean>(false);

  // Ensure client-side only execution
  useEffect(() => {
    setMounted(true);
  }, []);

  const { data, isPending } = authClient.useSession();

  // Return default permissions during SSR or while mounting
  if (!mounted || isPending || !data?.session) {
    return {
      isAdmin: false,
      isPlayer: false,
      isCoach: false,
      isGuest: false,
    };
  }

  return hasPermissions(data.user.role as UserRole);
}
