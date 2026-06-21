import { triggerDownload, withExtension } from './download';

describe('triggerDownload', () => {
  const createObjectURL = vi.fn(() => 'blob:mock-url');
  const revokeObjectURL = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  test('creates an anchor with the object URL and filename, then clicks it', () => {
    const click = vi.fn();
    const link = {
      href: '',
      download: '',
      click,
    } as unknown as HTMLAnchorElement;
    const createElement = vi
      .spyOn(document, 'createElement')
      .mockReturnValue(link);

    const blob = new Blob(['data'], { type: 'text/plain' });
    triggerDownload(blob, 'report.pdf');

    expect(createObjectURL).toHaveBeenCalledWith(blob);
    expect(createElement).toHaveBeenCalledWith('a');
    expect(link.href).toBe('blob:mock-url');
    expect(link.download).toBe('report.pdf');
    expect(click).toHaveBeenCalledTimes(1);
  });

  test('revokes the object URL after triggering the download', () => {
    const link = {
      href: '',
      download: '',
      click: vi.fn(),
    } as unknown as HTMLAnchorElement;
    vi.spyOn(document, 'createElement').mockReturnValue(link);

    triggerDownload(new Blob(['data']), 'report.pdf');

    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
  });
});

describe('withExtension', () => {
  test('appends the extension when missing', () => {
    expect(withExtension('report', '.pdf')).toBe('report.pdf');
  });

  test('keeps the filename unchanged when it already ends with the extension', () => {
    expect(withExtension('report.pdf', '.pdf')).toBe('report.pdf');
  });

  test('does not treat an extension in the middle as a match', () => {
    expect(withExtension('report.pdf.bak', '.pdf')).toBe('report.pdf.bak.pdf');
  });

  test('handles an empty filename', () => {
    expect(withExtension('', '.pdf')).toBe('.pdf');
  });
});
