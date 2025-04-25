'use client';

import { KeyboardEvent, ReactNode, useEffect, useRef } from 'react';

import { Box, Container } from '@chakra-ui/react';

import { useDialog } from '@/contexts/dialog-context';
import { CloseButton } from './ui/close-button';

interface ModalProps {
  children: ReactNode;
  position?: 'top' | 'middle';
  size?: 'sm' | 'md' | 'xl' | '2xl';
  onClose?: () => void;
}

export default function Modal({
  size = 'md',
  position = 'top',
  children,
  onClose,
}: ModalProps) {
  const { isOpen, close } = useDialog();
  const modalRef = useRef<HTMLDivElement>(null);

  const handleCloseModal = () => {
    if (onClose) {
      onClose();
    }
    close();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      handleCloseModal();
    }
  };

  useEffect(() => {
    if (isOpen && modalRef.current) {
      // Delay to ensure the DOM is fully rendered
      const timeoutId = setTimeout(() => {
        modalRef.current?.focus();
      }, 0);

      return () => clearTimeout(timeoutId);
    }
  }, [isOpen]);

  return (
    <>
      <Box
        position="fixed"
        inset={0}
        zIndex={2}
        aria-hidden="true"
        backgroundColor="rgba(0, 0, 0, 0.3)"
        onClick={handleCloseModal}
      />
      <Container
        ref={modalRef}
        position="fixed"
        top={position === 'top' ? '5%' : '50%'}
        left="50%"
        transform={
          position === 'top' ? 'translate(-50%, 0)' : 'translate(-50%, -50%)'
        }
        maxW={size}
        padding={4}
        zIndex={3}
        tabIndex={0}
        boxShadow="md"
        borderRadius="md"
        backgroundColor="white"
        onKeyDown={handleKeyDown}
        role="dialog"
        aria-modal="true"
        fontSize="14px"
      >
        <CloseButton
          size="sm"
          position="absolute"
          top={2}
          right={2}
          onClick={handleCloseModal}
        />
        {children}
      </Container>
    </>
  );
}
