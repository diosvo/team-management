/**
 * @description Trigger a browser download for an in-memory blob.
 */
export const triggerDownload = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

/**
 * @description Ensure `filename` ends with `ext`
 * @example "filename.pdf"
 * */
export const withExtension = (filename: string, ext: string) =>
  filename.endsWith(ext) ? filename : `${filename}${ext}`;
