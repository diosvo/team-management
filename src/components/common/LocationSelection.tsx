import NextLink from 'next/link';

import { Link as ChakraLink, LinkProps, Span, Stack } from '@chakra-ui/react';

import SearchableSelect, { SearchableSelectProps } from '../SearchableSelect';

import { CACHE_KEY } from '@/utils/constant';

import { getLocations } from '@/actions/location';
import { Location } from '@/drizzle/schema';

type LocationSelectionProps = Required<
  Pick<SearchableSelectProps<Location>, 'control'>
> &
  Partial<{
    isDisabled: boolean;
  }>;

export function LocationLink({
  name,
  ...props
}: { name: Nullish<string> } & LinkProps) {
  if (!name) return 'Unknown';
  const href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}`;

  return (
    <ChakraLink
      colorPalette="blue"
      focusRing="none"
      textDecoration="dotted underline"
      _hover={{
        textDecoration: 'red dotted underline',
      }}
      {...props}
      asChild
    >
      <NextLink href={href} rel="noopener noreferrer" target="_blank">
        {name}
      </NextLink>
    </ChakraLink>
  );
}

export default function LocationSelection({
  control,
  isDisabled,
}: LocationSelectionProps) {
  return (
    <SearchableSelect
      controlledMode
      multiple={false}
      control={control}
      name="location_id"
      label={CACHE_KEY.LOCATIONS}
      action={getLocations}
      fieldProps={{
        required: true,
        disabled: isDisabled,
      }}
      itemToString={({ name }) => name}
      itemToValue={({ location_id }) => location_id}
      renderItem={(item) => (
        <Stack gap={0}>
          {item.name}
          <Span color="fg.muted" fontSize="xs">
            {item.address}
          </Span>
        </Stack>
      )}
    />
  );
}
