import { RefObject } from 'react';

import { Dialog, Portal, createOverlay } from '@chakra-ui/react';
import { CloseButton } from './close-button';

interface DialogProps extends Dialog.RootProps {
  children: React.ReactNode;
  contentRef?: RefObject<Nullable<HTMLDivElement>>;
}

export const dialog = createOverlay<DialogProps>(
  ({ children, contentRef, ...rest }) => {
    return (
      <Dialog.Root {...rest} lazyMount unmountOnExit>
        <Portal>
          <Dialog.Backdrop zIndex="modal" />
          <Dialog.Positioner paddingInline={8}>
            <Dialog.Content ref={contentRef} zIndex="modal">
              <Dialog.CloseTrigger
                asChild
                position="absolute"
                top="4"
                right="4"
              >
                <CloseButton size="sm" rounded="full" focusRing="none" />
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
