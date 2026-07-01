import { Highlight, HighlightProps } from '@chakra-ui/react';

interface HighlightTextProps extends Omit<HighlightProps, 'children'> {
  children: string | Array<string>;
}

export default function HighlightText({
  query,
  children,
  ...props
}: HighlightTextProps) {
  return (
    <Highlight
      ignoreCase
      query={query}
      styles={{ backgroundColor: 'yellow' }}
      {...props}
    >
      {Array.isArray(children) ? children.join(', ') : children}
    </Highlight>
  );
}
