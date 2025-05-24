import { RefObject } from 'react';

import { CloseButton, Dialog, Portal, createOverlay } from '@chakra-ui/react';

interface DialogProps extends Dialog.RootProps {
  children: React.ReactNode;
  closeButtonOutside?: boolean;
  contentRef?: RefObject<Nullable<HTMLDivElement>>;
}

export const dialog = createOverlay<DialogProps>(
  ({ children, contentRef, closeButtonOutside = false, ...rest }) => {
    return (
      <Dialog.Root {...rest}>
        <Portal>
          <Dialog.Backdrop zIndex="modal" />
          <Dialog.Positioner paddingInline={8}>
            <Dialog.Content
              ref={contentRef}
              bg="bg"
              position="relative"
              zIndex="modal"
            >
              {closeButtonOutside ? (
                <Dialog.CloseTrigger top="0" insetEnd="-12" asChild>
                  <CloseButton
                    bg="bg"
                    size="sm"
                    focusRing="none"
                    aria-label="Close"
                  />
                </Dialog.CloseTrigger>
              ) : (
                <Dialog.CloseTrigger
                  asChild
                  position="absolute"
                  top="4"
                  right="4"
                >
                  <CloseButton
                    size="sm"
                    rounded="full"
                    focusRing="none"
                    aria-label="Close"
                  />
                </Dialog.CloseTrigger>
              )}
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
