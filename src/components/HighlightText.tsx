import { Highlight, HighlightProps } from '@chakra-ui/react';

export default function HighlightText({ query, ...props }: HighlightProps) {
  return (
    <Highlight
      ignoreCase
      query={query}
      styles={{ backgroundColor: 'yellow' }}
      {...props}
    >
      {props.children}
    </Highlight>
  );
}
