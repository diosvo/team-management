import { RefObject } from 'react';

import { CloseButton, Dialog, Portal, createOverlay } from '@chakra-ui/react';

interface DialogProps extends Dialog.RootProps {
  children: React.ReactNode;
  contentRef?: RefObject<Nullable<HTMLDivElement>>;
}

export const dialog = createOverlay<DialogProps>(
  ({ children, contentRef, ...rest }) => {
    return (
      <Dialog.Root {...rest}>
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner aria-hidden="true">
            <Dialog.Content ref={contentRef}>
              <Dialog.CloseTrigger
                asChild
                position="absolute"
                top="4"
                right="4"
              >
                <CloseButton size="sm" focusRing="none" />
              </Dialog.CloseTrigger>
              {children}
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    );
  }
);

export const DialogHeader = Dialog.Header;
export const DialogTitle = Dialog.Title;
export const DialogDescription = Dialog.Description;
export const DialogBody = Dialog.Body;
export const DialogFooter = Dialog.Footer;
