import type { DriveLink } from '@/utils/drive';
import { DocumentType } from '@/utils/enum';

import {
  MOCK_DRIVE_FILE_ID,
  MOCK_DRIVE_FOLDER_ID,
} from '@/test/mocks/document';
import {
  act,
  fireEvent,
  renderWithUI,
  screen,
  setupTestLifecycle,
  waitFor,
} from '@/test/utilities';

import { type AlbumItems, DocumentPreview } from './DocumentPreview';

const FILE: DriveLink = { id: MOCK_DRIVE_FILE_ID, kind: 'file' };
const FOLDER: DriveLink = { id: MOCK_DRIVE_FOLDER_ID, kind: 'folder' };
const VIDEO = {
  id: 'video-id-123',
  name: 'IMG_0029.MOV',
  kind: 'video' as const,
  thumbnail: 'https://lh3.googleusercontent.com/drive-storage/video',
};
const PHOTO = {
  id: 'photo-id-456',
  name: 'IMG_0032.HEIC',
  kind: 'image' as const,
  thumbnail: null,
};

describe('DocumentPreview', () => {
  // jsdom has no media playback.
  const play = vi.spyOn(HTMLMediaElement.prototype, 'play');

  setupTestLifecycle();

  beforeEach(() => {
    play.mockResolvedValue();
  });

  const open = (
    link: DriveLink,
    type: DocumentType,
    items?: Promise<AlbumItems>,
  ) => {
    const view = renderWithUI(<DocumentPreview.Viewport />);

    act(() => {
      DocumentPreview.open('preview-document', {
        title: 'Match day',
        link,
        type,
        items,
      });
    });

    return view;
  };

  const video = () =>
    screen.findByLabelText('Match day', { selector: 'video' });

  afterEach(() => {
    act(() => DocumentPreview.removeAll());
  });

  test("opens a file in Drive's viewer", async () => {
    open(FILE, DocumentType.FILE);

    const frame = await screen.findByTitle('Match day');
    expect(frame).toHaveAttribute(
      'src',
      `https://drive.google.com/file/d/${MOCK_DRIVE_FILE_ID}/preview`,
    );
    expect(frame).toHaveAttribute('allowfullscreen');
  });

  describe('videos', () => {
    test('plays the stream in a native player as soon as it opens', async () => {
      open(FILE, DocumentType.VIDEO);

      const player = await video();
      expect(player).toHaveAttribute('src', `/api/drive/${MOCK_DRIVE_FILE_ID}`);
      expect(player).toHaveAttribute(
        'poster',
        expect.stringContaining(`id=${MOCK_DRIVE_FILE_ID}`),
      );
      expect(player).toHaveAttribute('controls');
      expect(player).toHaveAttribute('playsinline');
      await waitFor(() => expect(play).toHaveBeenCalled());
      expect((player as HTMLVideoElement).muted).toBe(false);
    });

    test('starts muted when the browser blocks autoplay with sound', async () => {
      play
        .mockRejectedValueOnce(new Error('NotAllowedError'))
        .mockRejectedValueOnce(new Error('still blocked'));
      open(FILE, DocumentType.VIDEO);

      const player = (await video()) as HTMLVideoElement;

      await waitFor(() => expect(play).toHaveBeenCalledTimes(2));
      expect(player.muted).toBe(true);
    });

    test("falls back to Drive's player when the stream fails", async () => {
      open(FILE, DocumentType.VIDEO);

      fireEvent.error(await video());

      expect(await screen.findByTitle('Match day')).toHaveAttribute(
        'src',
        `https://drive.google.com/file/d/${MOCK_DRIVE_FILE_ID}/preview`,
      );
    });
  });

  test('closes from the close button', async () => {
    const { user } = open(FILE, DocumentType.FILE);

    await user.click(await screen.findByRole('button', { name: /close/i }));

    await waitFor(() => {
      expect(screen.queryByTitle('Match day')).not.toBeInTheDocument();
    });
  });

  describe('albums', () => {
    test('shows a skeleton while the folder loads', async () => {
      open(FOLDER, DocumentType.ALBUM, new Promise(() => {}));

      await screen.findByRole('heading', { name: 'Match day' });
      await waitFor(() =>
        expect(
          document.querySelectorAll('.chakra-skeleton').length,
        ).toBeGreaterThan(0),
      );
    });

    test('lists photos and videos and plays a video in the dialog', async () => {
      const { user } = open(
        FOLDER,
        DocumentType.ALBUM,
        Promise.resolve([VIDEO, PHOTO]),
      );

      await user.click(
        await screen.findByRole('button', { name: `Play ${VIDEO.name}` }),
      );

      const player = screen.getByLabelText(VIDEO.name, { selector: 'video' });
      expect(player).toHaveAttribute('src', `/api/drive/${VIDEO.id}`);
      expect(player).toHaveAttribute('poster', `${VIDEO.thumbnail}=s1280`);

      await user.click(screen.getByRole('button', { name: /all items/i }));
      expect(
        screen.getByRole('button', { name: `View ${PHOTO.name}` }),
      ).toBeInTheDocument();
    });

    test('shows a photo at viewing size', async () => {
      const { user } = open(
        FOLDER,
        DocumentType.ALBUM,
        Promise.resolve([VIDEO, PHOTO]),
      );

      await user.click(
        await screen.findByRole('button', { name: `View ${PHOTO.name}` }),
      );

      expect(
        screen.getByRole('img', { name: PHOTO.name, hidden: true }),
      ).toHaveAttribute(
        'src',
        expect.stringContaining(`id=${PHOTO.id}&sz=w1600`),
      );
    });

    test('shows a skeleton until the photo has downloaded', async () => {
      const { user } = open(
        FOLDER,
        DocumentType.ALBUM,
        Promise.resolve([PHOTO]),
      );
      await user.click(
        await screen.findByRole('button', { name: `View ${PHOTO.name}` }),
      );

      const photo = screen.getByRole('img', { name: PHOTO.name, hidden: true });
      const skeletons = () => document.querySelectorAll('.chakra-skeleton');
      expect(skeletons().length).toBe(1);
      expect(photo).not.toBeVisible();

      fireEvent.load(photo);

      expect(skeletons().length).toBe(0);
      expect(photo).toBeVisible();
    });

    test('keeps the name when the photo fails to load', async () => {
      const { user } = open(
        FOLDER,
        DocumentType.ALBUM,
        Promise.resolve([PHOTO]),
      );
      await user.click(
        await screen.findByRole('button', { name: `View ${PHOTO.name}` }),
      );

      fireEvent.error(
        screen.getByRole('img', { name: PHOTO.name, hidden: true }),
      );

      expect(
        screen.queryByRole('img', { name: PHOTO.name, hidden: true }),
      ).not.toBeInTheDocument();
      expect(screen.getAllByText(PHOTO.name).length).toBeGreaterThan(0);
    });

    test('holds each tile with its name and icon until the thumbnail loads', async () => {
      open(FOLDER, DocumentType.ALBUM, Promise.resolve([VIDEO, PHOTO]));

      const tile = await screen.findByRole('button', {
        name: `Play ${VIDEO.name}`,
      });
      const image = tile.querySelector('img')!;
      // Signed link from the listing, sized for the grid.
      expect(image).toHaveAttribute('src', `${VIDEO.thumbnail}=s400`);
      expect(image).toHaveAttribute('referrerpolicy', 'no-referrer');
      expect(tile).toHaveTextContent(VIDEO.name);

      fireEvent.load(image);

      expect(tile).not.toHaveTextContent(VIDEO.name);
    });

    test('keeps the name instead of a broken image when the thumbnail fails', async () => {
      open(FOLDER, DocumentType.ALBUM, Promise.resolve([PHOTO]));

      const tile = await screen.findByRole('button', {
        name: `View ${PHOTO.name}`,
      });
      // No signed link: falls back to the public thumbnail endpoint.
      expect(tile.querySelector('img')).toHaveAttribute(
        'src',
        expect.stringContaining(`id=${PHOTO.id}&sz=w400`),
      );

      fireEvent.error(tile.querySelector('img')!);

      expect(tile.querySelector('img')).toBeNull();
      expect(tile).toHaveTextContent(PHOTO.name);
    });

    test('says so when the folder has no media', async () => {
      open(FOLDER, DocumentType.ALBUM, Promise.resolve([]));

      expect(
        await screen.findByText('This folder has no photos or videos'),
      ).toBeInTheDocument();
    });

    test("falls back to Drive's folder view when listing is unavailable", async () => {
      open(FOLDER, DocumentType.ALBUM, Promise.resolve(null));

      expect(await screen.findByTitle('Match day')).toHaveAttribute(
        'src',
        `https://drive.google.com/embeddedfolderview?id=${MOCK_DRIVE_FOLDER_ID}#grid`,
      );
    });

    test("shows Drive's folder view when opened without a listing", async () => {
      open(FOLDER, DocumentType.ALBUM);

      expect(await screen.findByTitle('Match day')).toHaveAttribute(
        'src',
        `https://drive.google.com/embeddedfolderview?id=${MOCK_DRIVE_FOLDER_ID}#grid`,
      );
    });
  });
});
