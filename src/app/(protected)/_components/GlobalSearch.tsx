'use client';

import { usePathname, useRouter } from 'next/navigation';
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';

import {
  Button,
  Dialog,
  HStack,
  Highlight,
  Icon,
  IconButton,
  Input,
  Kbd,
  Listbox,
  Portal,
  Stack,
  Text,
  createListCollection,
} from '@chakra-ui/react';
import { Lightbulb, Search, TextSearch } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { CloseButton } from '@/components/ui/close-button';
import usePermissions from '@/hooks/use-permissions';
import { useSessionContext } from '@/providers/session';

import {
  RECENT_SHOWN,
  recordVisit,
  useRecentPages,
} from '../_helpers/recent-pages';
import {
  SEARCH_ENTRIES,
  indexEntry,
  matchEntry,
  rankPages,
  searchTargets,
  type IndexedEntry,
} from '../_helpers/search';

const SHORTCUTS = [
  { keys: ['↑', '↓'], label: 'navigate' },
  { keys: ['↵'], label: 'open' },
  { keys: ['Esc'], label: 'close' },
] as const;

type SearchItem = {
  value: string;
  group: 'recent' | 'pages' | 'searchIn';
  href: string;
  entry: IndexedEntry;
  /** The `?q=` term of "search within" items */
  term?: string;
};

const toItem = (
  group: SearchItem['group'],
  entry: IndexedEntry,
  term?: string,
): SearchItem => ({
  value: `${group}:${entry.id}`,
  group,
  href: term ? `${entry.path}?${new URLSearchParams({ q: term })}` : entry.path,
  entry,
  term,
});

const noopSubscribe = () => () => {};
const useIsMac = () =>
  useSyncExternalStore(
    noopSubscribe,
    () => /Mac|iPhone|iPad/.test(navigator.userAgent),
    () => false,
  );

/**
 * ⌘K palette over page titles and descriptions from the loaded messages.
 * "Search within" items pass the term to a page's `?q=`.
 */
export default function GlobalSearch() {
  const t = useTranslations('shell.search');
  const isMac = useIsMac();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const inputRef = useRef<Nullable<HTMLInputElement>>(null);

  useEffect(() => {
    const id = matchEntry(pathname)?.id;
    if (id) recordVisit(id);
  }, [pathname]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((value) => !value);
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <Dialog.Root
      lazyMount
      unmountOnExit
      open={open}
      size="lg"
      placement="center"
      motionPreset="scale"
      // Returning focus to the trigger would light up its focus ring.
      restoreFocus={false}
      initialFocusEl={() => inputRef.current}
      onOpenChange={({ open }) => setOpen(open)}
    >
      <IconButton
        hideFrom="md"
        size="sm"
        variant="ghost"
        borderRadius="full"
        borderColor="border"
        aria-label={t('label')}
        onClick={() => setOpen(true)}
      >
        <Search />
      </IconButton>
      <Button
        hideBelow="md"
        variant="surface"
        width={{ md: 56, xl: 64 }}
        justifyContent="flex-start"
        color="fg.muted"
        fontWeight="normal"
        aria-label={t('label')}
        onClick={() => setOpen(true)}
      >
        <Search />
        {t('trigger')}
        <Kbd size="sm" marginLeft="auto" backgroundColor="white">
          {isMac ? '⌘' : 'Ctrl'} K
        </Kbd>
      </Button>

      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content
            overflow="hidden"
            borderRadius="xl"
            maxWidth={{ base: 'calc(100% - 2rem)', md: 'lg' }}
          >
            <Dialog.Title srOnly>{t('label')}</Dialog.Title>
            <SearchPalette
              inputRef={inputRef}
              pathname={pathname}
              onNavigate={() => setOpen(false)}
            />
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}

function SearchPalette({
  inputRef,
  pathname,
  onNavigate,
}: {
  inputRef: React.RefObject<Nullable<HTMLInputElement>>;
  pathname: string;
  onNavigate: () => void;
}) {
  const router = useRouter();
  const t = useTranslations();
  const tSearch = useTranslations('shell.search');
  const { can } = usePermissions();
  const { user } = useSessionContext();
  const recentIds = useRecentPages();

  const [query, setQuery] = useState('');
  // The first item is highlighted whenever the query changes, so Enter always
  // opens the top result; arrow keys and hover take over until the next change.
  const [highlight, setHighlight] = useState<{
    query: Nullable<string>;
    value: Nullable<string>;
  }>({ query: null, value: null });
  const trimmed = query.trim();

  const entries = useMemo(
    () =>
      SEARCH_ENTRIES.filter(
        ({ resource, action, personal }) =>
          can(resource, action) && (!personal || user),
      ).map((entry) =>
        indexEntry(
          entry.personal
            ? { ...entry, path: `${entry.path}/${user!.id}` }
            : entry,
          {
            title: t(`${entry.namespace}.metadata.title` as never),
            description: t(`${entry.namespace}.metadata.description` as never),
            groupLabel: entry.group
              ? t(`shell.sidebar.groups.${entry.group}`)
              : tSearch('account'),
          },
        ),
      ),
    [can, t, tSearch, user],
  );

  const items = useMemo(() => {
    if (!trimmed) {
      const current = matchEntry(pathname)?.id;
      return recentIds
        .filter((id) => id !== current)
        .flatMap((id) => entries.filter((entry) => entry.id === id))
        .slice(0, RECENT_SHOWN)
        .map((entry) => toItem('recent', entry));
    }

    return [
      ...rankPages(entries, trimmed).map((entry) => toItem('pages', entry)),
      ...searchTargets(entries, trimmed).map(({ entry, term }) =>
        toItem('searchIn', entry, term),
      ),
    ];
  }, [entries, pathname, recentIds, trimmed]);

  const collection = useMemo(
    () =>
      createListCollection({
        items,
        itemToValue: (item) => item.value,
        itemToString: (item) => item.entry.title,
        groupBy: (item) => item.group,
      }),
    [items],
  );

  const highlightedValue =
    highlight.query === query ? highlight.value : (items[0]?.value ?? null);
  const words = trimmed.split(/\s+/).filter(Boolean);

  const example = entries.find(({ searchable }) => searchable);
  // A real scoped search (_e.g.,_ "roster dios"), offered as a clickable hint
  const exampleQuery = `${example?.title.toLowerCase()} ${tSearch('exampleTerm')}`;

  return (
    <Listbox.Root
      variant="plain"
      gap={0}
      collection={collection}
      highlightedValue={highlightedValue}
      onHighlightChange={({ highlightedValue }) =>
        setHighlight({ query, value: highlightedValue })
      }
      onSelect={({ value }) => {
        router.push(collection.find(value)!.href);
        onNavigate();
      }}
    >
      <Listbox.Label srOnly>{tSearch('label')}</Listbox.Label>
      <HStack paddingInline={4} borderBottomWidth="1px">
        <Icon as={Search} color="fg.muted" />
        <Listbox.Input asChild>
          <Input
            ref={inputRef}
            unstyled
            flex={1}
            height={12}
            outline="none"
            value={query}
            aria-label={tSearch('label')}
            placeholder={tSearch('placeholder')}
            onChange={(event) => setQuery(event.target.value)}
          />
        </Listbox.Input>
        <Dialog.CloseTrigger asChild position="static">
          <CloseButton size="sm" />
        </Dialog.CloseTrigger>
      </HStack>

      <Listbox.Content
        maxHeight="min(60vh, 28rem)"
        padding={2}
        hidden={!items.length}
      >
        {collection.group().map(([group, groupItems]) => (
          <Listbox.ItemGroup key={group}>
            <Listbox.ItemGroupLabel textStyle="xs" color="fg.muted">
              {group === 'searchIn' ? (
                <HStack gap={1.5}>
                  <TextSearch size={14} />
                  {tSearch('searchIn', { term: groupItems[0].term! })}
                </HStack>
              ) : (
                tSearch(group as 'recent' | 'pages')
              )}
            </Listbox.ItemGroupLabel>
            {groupItems.map((item) => (
              <SearchResult key={item.value} item={item} words={words} />
            ))}
          </Listbox.ItemGroup>
        ))}
      </Listbox.Content>

      {trimmed && !items.length && (
        <Text padding={6} textAlign="center" textStyle="sm" color="fg.muted">
          {tSearch('empty', { query: trimmed })}
        </Text>
      )}

      {!trimmed && example && (
        <HStack
          gap={3}
          margin={2}
          padding={3}
          alignItems="flex-start"
          borderRadius="l2"
          backgroundColor="bg.muted"
          textStyle="sm"
          color="fg.muted"
        >
          <Icon as={Lightbulb} boxSize={4} marginTop={0.5} color="orange.500" />
          <Stack alignItems="flex-start">
            <Text>{tSearch('hint')}</Text>
            <Button
              size="xs"
              variant="surface"
              onClick={() => {
                setQuery(exampleQuery);
                inputRef.current?.focus();
              }}
            >
              <TextSearch />
              {exampleQuery}
            </Button>
          </Stack>
        </HStack>
      )}

      <HStack
        hideBelow="md"
        gap={4}
        paddingBlock={2}
        paddingInline={4}
        borderTopWidth="1px"
        textStyle="xs"
        color="fg.muted"
      >
        {SHORTCUTS.map(({ keys, label }) => (
          <HStack key={label} gap={1}>
            {keys.map((key) => (
              <Kbd key={key} size="sm">
                {key}
              </Kbd>
            ))}
            {tSearch(label)}
          </HStack>
        ))}
      </HStack>
    </Listbox.Root>
  );
}

function SearchResult({
  item,
  words,
}: {
  item: SearchItem;
  words: Array<string>;
}) {
  const { entry } = item;
  // "Search within" rows show the page name only; the term is in the label.
  const isPage = item.group !== 'searchIn';

  return (
    <Listbox.Item
      item={item}
      gap={3}
      _highlighted={{ backgroundColor: 'red.50', outline: 'none' }}
    >
      <Icon as={entry.icon} boxSize={4} color="fg.muted" />
      <Stack gap={0} flex={1} minWidth={0}>
        <Listbox.ItemText fontWeight="medium" truncate>
          <Highlight
            ignoreCase
            query={isPage ? words : []}
            styles={{ color: 'red.600', fontWeight: 'semibold' }}
          >
            {entry.title}
          </Highlight>
        </Listbox.ItemText>
        {isPage && (
          <Text textStyle="xs" color="fg.muted" truncate>
            {entry.description}
          </Text>
        )}
      </Stack>
      <Text textStyle="xs" color="fg.subtle" hideBelow="sm">
        {entry.groupLabel}
      </Text>
    </Listbox.Item>
  );
}
