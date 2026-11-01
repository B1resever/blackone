import { z } from 'zod';
export const MAX_DOCUMENT_BYTES = 2 * 1024 * 1024;
export const documentUploadSchema = z.object({
  mimeType: z.enum(['image/jpeg', 'image/png']),
  base64: z.string().min(4).max(Math.ceil(MAX_DOCUMENT_BYTES / 3) * 4).regex(/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/),
}).superRefine((value, ctx) => {
  const bytes = Buffer.from(value.base64, 'base64');
  const jpeg = bytes.length >= 4 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  const png = bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  if (bytes.length > MAX_DOCUMENT_BYTES || !(value.mimeType === 'image/jpeg' ? jpeg : png)) ctx.addIssue({ code: 'custom', message: 'Select a JPEG or PNG image up to 2 MB.' });
});
