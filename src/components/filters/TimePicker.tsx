import { createListCollection, HStack, Portal, Select } from '@chakra-ui/react';
import { CalendarSearch } from 'lucide-react';

import { INTERVAL_SELECTION } from '@/utils/constant';

const dates = createListCollection({
  items: INTERVAL_SELECTION,
});

export default function TimePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Select.Root
      width="max-content"
      flexShrink={0}
      size={{ base: 'sm', md: 'md' }}
      collection={dates}
      value={[value]}
      onValueChange={({ value }) => onChange(value[0])}
    >
      <Select.HiddenSelect />
      <Select.Control>
        <Select.Trigger>
          <HStack>
            <CalendarSearch size={16} />
            <Select.ValueText placeholder="Time" />
          </HStack>
        </Select.Trigger>
      </Select.Control>
      <Portal>
        <Select.Positioner>
          <Select.Content>
            {dates.items.map((interval) => (
              <Select.Item
                item={interval}
                key={interval.value}
                whiteSpace="nowrap"
              >
                {interval.label}
                <Select.ItemIndicator />
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Positioner>
      </Portal>
    </Select.Root>
  );
}
