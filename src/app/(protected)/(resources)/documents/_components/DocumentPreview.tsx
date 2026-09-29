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
import { type DocumentType, DriveKind, MediaKind } from '@/utils/enum';

import type { DriveMedia } from '@/lib/drive';

import { CloseButton } from '@/components/ui/close-button';
import { EmptyState } from '@/components/ui/empty-state';

export type AlbumItems = Nullable<Array<DriveMedia>>;

type DocumentPreviewProps = {
  title: string;
  link: DriveLink;
  type: DocumentType;
  /** Folder listing fetched when the dialog opens. */
  items?: Promise<AlbumItems>;
};

const FALLBACK_RATIO = 16 / 9;
const PHOTO_MAX_HEIGHT = '50vh';
const VIDEO_MAX_HEIGHT = 'calc(100dvh - 12rem)';

type LoadStatus = 'loading' | 'loaded' | 'failed';

const useLoadStatus = () => useState<LoadStatus>('loading');

/**
 * Holds the box media at `ratio` fills under a `maxHeight` cap: full width,
 * or narrower and centered once the cap is reached, like the media itself.
 */
function MediaSkeleton({
  ratio,
  maxHeight,
}: {
  ratio: Nullable<number> | undefined;
  maxHeight: string;
}) {
  const aspect = ratio ?? FALLBACK_RATIO;

  return (
    <Skeleton
      aspectRatio={aspect}
      width={`min(100%, calc(${maxHeight} * ${aspect}))`}
      marginInline="auto"
      rounded="md"
    />
  );
}

// Google's viewer for one file (PDF, Doc ...)
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
 * Native Drive video player:
 * - Streams from `/api/drive/[id]` at the video's aspect ratio.
 * - Caps height, then widths and centers the player.
 * - Autoplays with sound where permitted, otherwise muted.
 * - Shows a matching skeleton until metadata loads.
 * - Falls back to Drive's player on stream failure.
 */
function VideoPlayer({
  id,
  title,
  poster = driveThumbnailUrl(id, 1280),
  ratio,
}: {
  id: string;
  title: string;
  poster?: string;
  ratio?: Nullable<number>;
}) {
  const t = useTranslations('documents.preview');
  const ref = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useLoadStatus();

  // On mount only: once the stream fails, Drive's player replaces the video.
  useEffect(() => {
    const video = ref.current!;

    video.play().catch(() => {
      video.muted = true;
      video.play().catch(() => {});
    });
  }, []);

  if (status === 'failed') {
    return <DriveFrame title={title} link={{ id, kind: DriveKind.FILE }} />;
  }

  const loaded = status === 'loaded';

  return (
    <>
      {!loaded && <MediaSkeleton ratio={ratio} maxHeight={VIDEO_MAX_HEIGHT} />}
      {/* Rendered (and loading) while hidden behind the skeleton. */}
      <Center display={loaded ? 'flex' : 'none'}>
        <chakra.video
          ref={ref}
          display="block"
          maxWidth="full"
          maxHeight={VIDEO_MAX_HEIGHT}
          rounded="md"
          bg="black"
          src={driveStreamUrl(id)}
          poster={poster}
          aria-label={title}
          controls
          playsInline
          preload="metadata"
          onLoadedMetadata={() => setStatus('loaded')}
          onError={() => setStatus('failed')}
        >
          {t('unsupported')}
        </chakra.video>
      </Center>
    </>
  );
}

const mediaThumbnail = (item: DriveMedia, size: number) =>
  item.thumbnail
    ? `${item.thumbnail}=s${size}`
    : driveThumbnailUrl(item.id, size);

function MediaPlaceholder({
  item,
  ...rest
}: { item: DriveMedia } & StackProps) {
  const Icon = item.kind === MediaKind.VIDEO ? Film : ImageIcon;

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

function MediaTile({ item }: { item: DriveMedia }) {
  const [status, setStatus] = useLoadStatus();
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
      {loaded && item.kind === MediaKind.VIDEO && (
        <Center position="absolute" inset={0} color="white" bg="blackAlpha.400">
          <Play size={28} fill="currentColor" aria-hidden />
        </Center>
      )}
    </>
  );
}

function Photo({ item }: { item: DriveMedia }) {
  const [status, setStatus] = useLoadStatus();

  if (status === 'failed') {
    return (
      <MediaPlaceholder
        item={item}
        height={PHOTO_MAX_HEIGHT}
        rounded="md"
        bg="bg.muted"
      />
    );
  }

  return (
    <>
      {status === 'loading' && (
        <MediaSkeleton ratio={item.ratio} maxHeight={PHOTO_MAX_HEIGHT} />
      )}
      {/* Sized like the video: centered, capped, in the skeleton's box. */}
      <Center display={status === 'loaded' ? 'flex' : 'none'}>
        <Image
          src={mediaThumbnail(item, 1600)}
          referrerPolicy="no-referrer"
          alt={item.name}
          maxWidth="full"
          maxHeight={PHOTO_MAX_HEIGHT}
          rounded="md"
          onLoad={() => setStatus('loaded')}
          onError={() => setStatus('failed')}
        />
      </Center>
    </>
  );
}

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
        {active.kind === MediaKind.VIDEO ? (
          <VideoPlayer
            key={active.id}
            id={active.id}
            title={active.name}
            poster={mediaThumbnail(active, 1280)}
            ratio={active.ratio}
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
            aria-label={t(
              item.kind === MediaKind.VIDEO ? 'playItem' : 'viewItem',
              {
                name: item.name,
              },
            )}
            onClick={() => setActive(item)}
          >
            <MediaTile item={item} />
          </button>
        </Box>
      ))}
    </SimpleGrid>
  );
}

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
 * Previews Drive items in-app:
 * - Albums: photo/video grid
 * - Videos and tactics: native player
 * - Other files: Drive viewer
 * - Unlisted folders: Drive folder view
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
              {link.kind === DriveKind.FOLDER && items ? (
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
