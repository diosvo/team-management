'use client';

import { useLayoutEffect, useState } from 'react';

export function Timestamp() {
  const [time, setTime] = useState<Nullable<number>>(null);

  useLayoutEffect(() => {
    setTime(new Date().getFullYear());
  }, []);

  return time ?? null;
}
