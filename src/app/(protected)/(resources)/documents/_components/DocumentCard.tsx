'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Badge,
  Box,
  Button,
  Card,
  Center,
  IconButton,
  Image,
  Text,
} from '@chakra-ui/react';
import {
  ClipboardList,
  ExternalLink,
  Eye,
  File,
  Film,
  FolderOpen,
  type LucideIcon,
  Pencil,
  Play,
} from 'lucide-react';

import { formatDate } from '@/utils/datetime';
import {
  type DriveLink,
  driveThumbnailUrl,
  isPlayable,
  parseDriveUrl,
} from '@/utils/drive';
import { DocumentType } from '@/utils/enum';

import HighlightText from '@/components/HighlightText';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip } from '@/components/ui/tooltip';
import type { Document } from '@/drizzle/schema/document';
import { enumLabel } from '@/i18n/enums';

const TYPE_ICON: Record<DocumentType, LucideIcon> = {
  [DocumentType.ALBUM]: FolderOpen,
  [DocumentType.VIDEO]: Film,
  [DocumentType.TACTIC]: ClipboardList,
  [DocumentType.FILE]: File,
};

const TYPE_COLOR: Record<DocumentType, string> = {
  [DocumentType.ALBUM]: 'blue',
  [DocumentType.VIDEO]: 'purple',
  [DocumentType.TACTIC]: 'orange',
  [DocumentType.FILE]: 'gray',
};

type DocumentCardProps = {
  item: Document;
  query: string;
  canEdit: boolean;
  onEdit: (item: Document) => void;
  onPreview: (item: Document, link: DriveLink) => void;
} & Partial<{
  selection: {
    selected: boolean;
    onSelect: (checked: boolean) => void;
  };
}>;

export default function DocumentCard({
  item,
  query,
  canEdit,
  selection,
  onEdit,
  onPreview,
}: DocumentCardProps) {
  const t = useTranslations('documents.card');
  const tEnums = useTranslations('enums');
  // A private or removed file has no public thumbnail; fall back to the icon.
  const [thumbnailBroken, setThumbnailBroken] = useState(false);

  const link = parseDriveUrl(item.url);
  const plays = isPlayable(item.type);
  // Videos and tactics play; albums open a photo grid; files open the Drive viewer.
  const PreviewIcon = plays ? Play : Eye;
  const previewAction = plays ? 'play' : 'preview';
  // Folders never expose a thumbnail, only files do.
  const thumbnail =
    link?.kind === 'file' && !thumbnailBroken
      ? driveThumbnailUrl(link.id)
      : null;
  const Icon = TYPE_ICON[item.type];

  const media = thumbnail ? (
    <Image
      src={thumbnail}
      alt=""
      loading="lazy"
      width="full"
      height="full"
      objectFit="cover"
      onError={() => setThumbnailBroken(true)}
    />
  ) : (
    <Center width="full" height="full" color="fg.muted">
      <Icon size={40} strokeWidth={1.25} aria-hidden />
    </Center>
  );

  return (
    <Card.Root
      size="sm"
      overflow="hidden"
      data-selected={selection?.selected ? '' : undefined}
      _selected={{ borderColor: 'colorPalette.solid', shadow: 'sm' }}
    >
      {/* overflow keeps a portrait thumbnail from stretching the 16:9 box. */}
      <Box
        position="relative"
        aspectRatio={16 / 9}
        overflow="hidden"
        bg="bg.muted"
      >
        {link ? (
          <Box
            asChild
            display="block"
            width="full"
            height="full"
            cursor="pointer"
          >
            <button
              type="button"
              aria-label={t(`${previewAction}Label`, { title: item.title })}
              onClick={() => onPreview(item, link)}
            >
              {media}
              <Center
                position="absolute"
                inset={0}
                color="white"
                bg="blackAlpha.400"
                _hover={{ bg: 'blackAlpha.500' }}
                transition="background 0.2s"
              >
                <PreviewIcon
                  size={36}
                  fill={plays ? 'currentColor' : 'none'}
                  aria-hidden
                />
              </Center>
            </button>
          </Box>
        ) : (
          <Box
            asChild
            display="block"
            width="full"
            height="full"
            aria-label={t('openInDriveLabel', { title: item.title })}
          >
            <a href={item.url} target="_blank" rel="noopener noreferrer">
              {media}
            </a>
          </Box>
        )}

        {selection && (
          <Checkbox
            position="absolute"
            top={2}
            left={2}
            bg="bg"
            rounded="sm"
            aria-label={t('selectDocument')}
            checked={selection.selected}
            onCheckedChange={({ checked }) =>
              selection.onSelect(checked === true)
            }
          />
        )}
        <Badge
          position="absolute"
          top={2}
          right={2}
          variant="solid"
          borderRadius="full"
          colorPalette={TYPE_COLOR[item.type]}
        >
          {enumLabel(tEnums, 'documentType', item.type)}
        </Badge>
      </Box>

      <Card.Body gap={1}>
        <Card.Title lineClamp={1} title={item.title}>
          <HighlightText query={query}>{item.title}</HighlightText>
        </Card.Title>
        <Text fontSize="sm" color="fg.muted">
          {formatDate(item.event_date)}
        </Text>
        {item.note && (
          <Text fontSize="xs" color="fg.muted" lineClamp={2}>
            {item.note}
          </Text>
        )}
      </Card.Body>

      <Card.Footer justifyContent="space-between" paddingTop={0}>
        <Button asChild size="xs" variant="ghost">
          <a href={item.url} target="_blank" rel="noopener noreferrer">
            <ExternalLink />
            {t('openInDrive')}
          </a>
        </Button>
        {canEdit && (
          <Tooltip content={t('edit')}>
            <IconButton
              size="xs"
              variant="ghost"
              aria-label={t('editLabel', { title: item.title })}
              onClick={() => onEdit(item)}
            >
              <Pencil />
            </IconButton>
          </Tooltip>
        )}
      </Card.Footer>
    </Card.Root>
  );
}
