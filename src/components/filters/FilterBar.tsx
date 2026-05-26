import { Badge, Box, Button, Drawer, HStack, Portal } from '@chakra-ui/react';
import { SlidersHorizontal } from 'lucide-react';

import SearchInput from '../SearchInput';
import { CloseButton } from '../ui/close-button';

type FilterBarProps = {
  activeCount: number;
  inlineFilters?: React.ReactNode;
  advancedFilters: React.ReactNode;
  handleReset: () => void;
  handleApply: () => void;
  handleInteractOutside: () => void;
};

export default function FilterBar({
  activeCount,
  inlineFilters,
  advancedFilters,
  handleReset,
  handleApply,
  handleInteractOutside,
}: FilterBarProps) {
  return (
    <HStack gap={{ base: 3, lg: 4 }} alignItems="start">
      <SearchInput />
      {inlineFilters && (
        <Box display={{ base: 'none', lg: 'block' }}>{inlineFilters}</Box>
      )}
      <Drawer.Root
        closeOnEscape={false}
        placement={{ base: 'bottom', lg: 'end' }}
        onInteractOutside={handleInteractOutside}
      >
        <Drawer.Trigger asChild>
          <Button size={{ base: 'sm', md: 'md' }} variant="outline">
            <SlidersHorizontal size={14} />
            Filters
            {activeCount > 0 && (
              <Badge borderRadius="full" colorPalette="cyan">
                {activeCount}
              </Badge>
            )}
          </Button>
        </Drawer.Trigger>
        <Portal>
          <Drawer.Backdrop />
          <Drawer.Positioner>
            <Drawer.Content maxWidth={{ base: 'full', lg: 'sm' }}>
              <Drawer.Header>
                <Drawer.Title>Advanced Filters</Drawer.Title>
              </Drawer.Header>
              <Drawer.Body
                display="flex"
                flexDirection="column"
                alignItems="start"
                gap={6}
              >
                {inlineFilters && (
                  <Box display={{ base: 'block', lg: 'none' }}>
                    {inlineFilters}
                  </Box>
                )}
                {advancedFilters}
              </Drawer.Body>
              <Drawer.Footer display="flex" justifyContent="space-between">
                <Button
                  variant="ghost"
                  colorPalette="red"
                  onClick={handleReset}
                >
                  Reset
                </Button>
                <Drawer.ActionTrigger asChild>
                  <Button onClick={handleApply}>Apply</Button>
                </Drawer.ActionTrigger>
              </Drawer.Footer>
              <Drawer.CloseTrigger asChild>
                <CloseButton size="sm" />
              </Drawer.CloseTrigger>
            </Drawer.Content>
          </Drawer.Positioner>
        </Portal>
      </Drawer.Root>
    </HStack>
  );
}
