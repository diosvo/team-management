'use client';

import { CloseButton, Dialog, Portal, createOverlay } from '@chakra-ui/react';

interface DialogProps extends Dialog.RootProps {
  children: React.ReactNode;
}

export const dialog = createOverlay<DialogProps>(({ children, ...rest }) => {
  return (
    <Dialog.Root {...rest}>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" focusRing="none" />
            </Dialog.CloseTrigger>
            {children}
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
});

export const DialogHeader = Dialog.Header;
export const DialogTitle = Dialog.Title;
export const DialogDescription = Dialog.Description;
export const DialogBody = Dialog.Body;
export const DialogFooter = Dialog.Footer;
