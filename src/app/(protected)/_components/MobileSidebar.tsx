'use client';

import { useState } from 'react';

import { CloseButton, Drawer, IconButton, Portal } from '@chakra-ui/react';
import { PanelRightOpen } from 'lucide-react';

import authClient from '@/lib/auth-client';
import Sidebar from './Sidebar';

export default function MobileSidebar() {
  const { data } = authClient.useSession();
  const [open, setOpen] = useState<boolean>(false);

  if (!data?.session) return null;

  return (
    <Drawer.Root open={open} onOpenChange={() => setOpen(!open)}>
      <Drawer.Trigger asChild>
        <IconButton
          hideFrom="lg"
          size="sm"
          variant="outline"
          borderRadius="full"
        >
          <PanelRightOpen />
        </IconButton>
      </Drawer.Trigger>
      <Portal>
        <Drawer.Backdrop />
        <Drawer.Positioner>
          <Drawer.Content maxWidth="224px">
            <Drawer.Body padding={0}>
              <Sidebar isExpanded={open} setIsExpanded={() => setOpen(!open)} />
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
