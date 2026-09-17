'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import {
  CloseButton,
  Drawer,
  IconButton,
  Portal,
  useBreakpointValue,
} from '@chakra-ui/react';
import { PanelRightOpen } from 'lucide-react';

import { useSessionContext } from '@/providers/session';
import Sidebar from './Sidebar';

export default function MobileSidebar() {
  const { isAuthenticated } = useSessionContext();
  const [open, setOpen] = useState<boolean>(false);

  const pathname = usePathname();
  const isDesktop = useBreakpointValue({ base: false, lg: true });

  // Past `lg`, the persistent sidebar takes over.
  useEffect(() => {
    if (isDesktop) setOpen(false);
  }, [isDesktop]);

  // Protected layout persists; close drawer on route change.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  if (!isAuthenticated) return null;

  return (
    <Drawer.Root open={open} onOpenChange={(event) => setOpen(event.open)}>
      <Drawer.Trigger asChild>
        <IconButton
          hideFrom="lg"
          size="sm"
          variant="outline"
          borderRadius="full"
          aria-label="Open navigation"
        >
          <PanelRightOpen />
        </IconButton>
      </Drawer.Trigger>
      <Portal>
        <Drawer.Backdrop />
        <Drawer.Positioner>
          <Drawer.Content maxWidth="224px">
            <Drawer.Body padding={0}>
              <Sidebar isExpanded />
            </Drawer.Body>
            <Drawer.CloseTrigger asChild>
              <CloseButton size="2xs" borderRadius="full" />
            </Drawer.CloseTrigger>
          </Drawer.Content>
        </Drawer.Positioner>
      </Portal>
    </Drawer.Root>
  );
}
