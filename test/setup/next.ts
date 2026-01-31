import React from 'react';

vi.mock('next/navigation', () => ({
  notFound: vi.fn(() => {
    throw new Error('NOT_FOUND');
  }),
  forbidden: vi.fn(() => {
    throw new Error('FORBIDDEN');
  }),
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    pathname: '/',
    params: {},
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('next/image', () => ({
  default: (props: {
    src: string;
    alt: string;
    width?: number;
    height?: number;
    className?: string;
    priority?: boolean;
    quality?: number;
    style?: React.CSSProperties;
  }) => {
    return React.createElement('img', {
      ...props,
      src: props.src,
      alt: props.alt,
    });
  },
}));

vi.mock('next/link', () => ({
  default: (props: {
    href: string;
    children: React.ReactNode;
    className?: string;
    prefetch?: boolean;
    replace?: boolean;
    scroll?: boolean;
  }) => {
    return React.createElement(
      'a',
      {
        ...props,
        href: props.href,
      },
      props.children,
    );
  },
}));

vi.mock('next/cache', () => ({
  cacheTag: vi.fn(),
}));
