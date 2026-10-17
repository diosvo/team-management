import React from 'react';

vi.mock('next/headers', () => ({
  headers: vi.fn(),
}));

// Server components and actions read English messages, as served by default.
vi.mock('next-intl/server', async () => {
  const { createTranslator } =
    await vi.importActual<typeof import('next-intl')>('next-intl');
  const { default: messages } = await import('@/i18n/messages/en');

  return {
    getLocale: vi.fn(async () => 'en'),
    getMessages: vi.fn(async () => messages),
    getTranslations: vi.fn(async (options?: string | { namespace?: string }) =>
      createTranslator({
        locale: 'en',
        messages,
        namespace: (typeof options === 'string'
          ? options
          : options?.namespace) as never,
      }),
    ),
  };
});

vi.mock('next/navigation', async () => {
  const actual = await vi.importActual('next/navigation');

  return {
    ...actual,
    notFound: vi.fn(() => {
      throw new Error('NOT_FOUND');
    }),
    forbidden: vi.fn(() => {
      throw new Error('FORBIDDEN');
    }),
    redirect: vi.fn(() => {
      throw new Error('NEXT_REDIRECT');
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
  };
});

vi.mock('next/image', () => ({
  default: (props: {
    src: string | { src: string };
    alt: string;
    fill?: boolean;
    width?: number;
    height?: number;
    className?: string;
    priority?: boolean;
    quality?: number;
    sizes?: string;
    loading?: 'eager' | 'lazy';
    placeholder?: 'blur' | 'empty';
    blurDataURL?: string;
    fetchPriority?: 'high' | 'low' | 'auto';
    onLoad?: React.ReactEventHandler<HTMLImageElement>;
    onError?: React.ReactEventHandler<HTMLImageElement>;
    style?: React.CSSProperties;
    [key: string]: unknown;
  }) => {
    const {
      src,
      alt,
      width,
      height,
      className,
      style,
      sizes,
      loading,
      fetchPriority,
      onLoad,
      onError,
    } = props;

    const resolvedSrc = typeof src === 'string' ? src : src.src;

    // Avoid forwarding Next.js-only props like `fill` and `priority` to the DOM.
    return React.createElement('img', {
      src: resolvedSrc,
      alt,
      width,
      height,
      className,
      style,
      sizes,
      loading,
      fetchPriority,
      onLoad,
      onError,
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
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));
