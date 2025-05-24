'use client';

import { Dialog, Portal, createOverlay } from '@chakra-ui/react';

interface DialogProps {
  children?: React.ReactNode;
}

const dialog = createOverlay<DialogProps>(
  ({ children, ...rest }: DialogProps) => {
    return (
      <Dialog.Root {...rest} lazyMount unmountOnExit>
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>{children}</Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    );
  }
);

export default dialog;
