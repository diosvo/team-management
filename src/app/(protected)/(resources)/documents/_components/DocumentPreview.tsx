'use client';

import { Suspense, use, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  AspectRatio,
  Box,
  Button,
  Center,
  chakra,
  createOverlay,
  Dialog,
  HStack,
  Image,
  Portal,
  SimpleGrid,
  Skeleton,
  type StackProps,
  Text,
  VStack,
} from '@chakra-ui/react';
import { ArrowLeft, Film, Image as ImageIcon, Play } from 'lucide-react';

import {
  type DriveLink,
  drivePreviewUrl,
  driveStreamUrl,
  driveThumbnailUrl,
  isPlayable,
} from '@/utils/drive';
import type { DocumentType } from '@/utils/enum';

import type { DriveMedia } from '@/lib/drive';

import { CloseButton } from '@/components/ui/close-button';
import { EmptyState } from '@/components/ui/empty-state';

export type AlbumItems = Nullable<Array<DriveMedia>>;

type DocumentPreviewProps = {
  title: string;
  link: DriveLink;
  type: DocumentType;
  /**
   * Folder listing, requested by the click that opens the dialog: `use()`
   * needs a promise created outside render (a server action called while
   * rendering updates the router mid-render).
   */
  items?: Promise<AlbumItems>;
};

/** Google's viewer for one file (PDF, Doc, …); `aspect-ratio` reserves its box. */
function DriveFrame({ title, link }: { title: string; link: DriveLink }) {
  return (
    <AspectRatio ratio={16 / 9} rounded="md" overflow="hidden" bg="black">
      <iframe
        title={title}
        src={drivePreviewUrl(link)}
        allow="autoplay; fullscreen"
        allowFullScreen
        style={{ border: 0 }}
      />
    </AspectRatio>
  );
}

/**
 * Native player for a Drive video, streamed through `/api/drive/[id]`, at the
 * video's own aspect ratio and capped to the viewport height, so portrait
 * reels fit the screen instead of a letterboxed 16:9 box. Starts
 * as soon as it opens: with sound when the browser allows it (the dialog was
 * opened by a click), otherwise muted, the autoplay rule browsers enforce.
 * Falls back to Drive's player if the stream fails (no API key, private file,
 * or a codec the browser can't decode).
 */
function VideoPlayer({
  id,
  title,
  poster = driveThumbnailUrl(id, 1280),
}: {
  id: string;
  title: string;
  poster?: string;
}) {
  const t = useTranslations('documents.preview');
  const ref = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;

    video.play().catch(() => {
      video.muted = true;
      video.play().catch(() => {});
    });
  }, [failed]);

  if (failed) return <DriveFrame title={title} link={{ id, kind: 'file' }} />;

  return (
    <Center>
      <chakra.video
        ref={ref}
        display="block"
        maxWidth="full"
        maxHeight="calc(100dvh - 12rem)"
        rounded="md"
        bg="black"
        src={driveStreamUrl(id)}
        poster={poster}
        aria-label={title}
        controls
        playsInline
        preload="metadata"
        onError={() => setFailed(true)}
      >
        {t('unsupported')}
      </chakra.video>
    </Center>
  );
}

/**
 * Thumbnail of an album item at `size` px: the signed link from the listing
 * when Drive returned one, the public thumbnail endpoint otherwise.
 */
const mediaThumbnail = (item: DriveMedia, size: number) =>
  item.thumbnail
    ? `${item.thumbnail}=s${size}`
    : driveThumbnailUrl(item.id, size);

/** File name and type icon, standing in for media that isn't (or can't be) shown. */
function MediaPlaceholder({
  item,
  ...rest
}: { item: DriveMedia } & StackProps) {
  const Icon = item.kind === 'video' ? Film : ImageIcon;

  return (
    <VStack
      justifyContent="center"
      gap={1}
      paddingInline={2}
      color="fg.muted"
      {...rest}
    >
      <Icon size={24} strokeWidth={1.5} aria-hidden />
      <Text fontSize="xs" maxWidth="full" truncate>
        {item.name}
      </Text>
    </VStack>
  );
}

/**
 * Grid tile content. Holds the file name and a type icon until the thumbnail
 * has loaded (and keeps them if it fails), instead of a broken image.
 */
function MediaTile({ item }: { item: DriveMedia }) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'failed'>(
    'loading',
  );
  const loaded = status === 'loaded';

  return (
    <>
      {!loaded && (
        <MediaPlaceholder item={item} position="absolute" inset={0} />
      )}
      {status !== 'failed' && (
        <Image
          src={mediaThumbnail(item, 400)}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          position="absolute"
          inset={0}
          width="full"
          height="full"
          objectFit="cover"
          opacity={loaded ? 1 : 0}
          transition="opacity 0.2s"
          onLoad={() => setStatus('loaded')}
          onError={() => setStatus('failed')}
        />
      )}
      {loaded && item.kind === 'video' && (
        <Center position="absolute" inset={0} color="white" bg="blackAlpha.400">
          <Play size={28} fill="currentColor" aria-hidden />
        </Center>
      )}
    </>
  );
}

/**
 * A photo at viewing size, kept inside the viewport. A skeleton holds its box
 * while the full-size image downloads; a failed load keeps the name.
 */
function Photo({ item }: { item: DriveMedia }) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'failed'>(
    'loading',
  );

  if (status === 'failed') {
    return (
      <MediaPlaceholder item={item} height="50vh" rounded="md" bg="bg.muted" />
    );
  }

  return (
    <>
      {status === 'loading' && (
        <Skeleton height="50vh" width="full" rounded="md" />
      )}
      {/* Rendered (and downloading) while hidden behind the skeleton. */}
      <Center
        bg="black"
        rounded="md"
        overflow="hidden"
        display={status === 'loaded' ? 'flex' : 'none'}
      >
        <Image
          src={mediaThumbnail(item, 1600)}
          referrerPolicy="no-referrer"
          alt={item.name}
          maxHeight="50vh"
          objectFit="contain"
          onLoad={() => setStatus('loaded')}
          onError={() => setStatus('failed')}
        />
      </Center>
    </>
  );
}

/** Same shape as the album grid, so nothing shifts when it streams in. */
function AlbumSkeleton() {
  return (
    <SimpleGrid columns={{ base: 2, md: 3 }} gap={2}>
      {Array.from({ length: 6 }).map((_, index) => (
        <Skeleton key={index} aspectRatio={4 / 3} rounded="md" />
      ))}
    </SimpleGrid>
  );
}

function AlbumGrid({
  title,
  link,
  items: pending,
}: {
  title: string;
  link: DriveLink;
  items: Promise<AlbumItems>;
}) {
  const t = useTranslations('documents.preview');
  const items = use(pending);
  const [active, setActive] = useState<Nullable<DriveMedia>>(null);

  // Listing unavailable: Drive's own folder view (opens items in Drive).
  if (items === null) {
    return (
      <Box height="50vh" rounded="md" overflow="hidden" bg="white">
        <iframe
          title={title}
          src={drivePreviewUrl(link)}
          style={{ width: '100%', height: '100%', border: 0 }}
        />
      </Box>
    );
  }

  if (active) {
    return (
      <>
        <HStack justifyContent="space-between" marginBottom={2}>
          <Button
            size="xs"
            variant="ghost"
            flexShrink={0}
            onClick={() => setActive(null)}
          >
            <ArrowLeft /> {t('allItems')}
          </Button>
          <Text fontSize="sm" color="fg.muted" truncate>
            {active.name}
          </Text>
        </HStack>
        {active.kind === 'video' ? (
          <VideoPlayer
            id={active.id}
            title={active.name}
            poster={mediaThumbnail(active, 1280)}
          />
        ) : (
          <Photo key={active.id} item={active} />
        )}
      </>
    );
  }

  if (items.length === 0) {
    return <EmptyState title={t('emptyFolder')} />;
  }

  return (
    <SimpleGrid
      columns={{ base: 2, md: 3 }}
      gap={2}
      maxHeight="50vh"
      overflowY="auto"
    >
      {items.map((item) => (
        <Box
          key={item.id}
          asChild
          position="relative"
          aspectRatio={4 / 3}
          rounded="md"
          overflow="hidden"
          bg="bg.muted"
          cursor="pointer"
        >
          <button
            type="button"
            aria-label={t(item.kind === 'video' ? 'playItem' : 'viewItem', {
              name: item.name,
            })}
            onClick={() => setActive(item)}
          >
            <MediaTile item={item} />
          </button>
        </Box>
      ))}
    </SimpleGrid>
  );
}

/**
 * Album folder: our own grid (Drive API) so photos and videos open here, not
 * in a Drive tab. The listing streams in through Suspense behind a skeleton.
 */
function Album({
  title,
  link,
  items,
}: {
  title: string;
  link: DriveLink;
  items: Promise<AlbumItems>;
}) {
  return (
    <Suspense fallback={<AlbumSkeleton />}>
      <AlbumGrid title={title} link={link} items={items} />
    </Suspense>
  );
}

/**
 * Shows a Drive item inside the app, so nothing touches our storage: an album
 * as a photo/video grid, a video or tactic in a native player that starts on open, any
 * other file in Drive's viewer. A folder opened without a listing shows
 * Drive's own folder view.
 */
export const DocumentPreview = createOverlay<DocumentPreviewProps>(
  ({ title, link, type, items, ...rest }) => (
    <Dialog.Root size={{ base: 'sm', md: 'lg' }} placement="center" {...rest}>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.CloseTrigger asChild>
              <CloseButton />
            </Dialog.CloseTrigger>
            <Dialog.Header>
              <Dialog.Title lineClamp={1}>{title}</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body paddingBottom={6}>
              {link.kind === 'folder' && items ? (
                <Album title={title} link={link} items={items} />
              ) : isPlayable(type) ? (
                <VideoPlayer id={link.id} title={title} />
              ) : (
                <DriveFrame title={title} link={link} />
              )}
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  ),
);
