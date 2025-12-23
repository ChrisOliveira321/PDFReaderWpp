export function isPdf(media) {
  if (!media?.data) return false;

  const buffer = Buffer.from(media.data, "base64");

  // PDF sempre começa com %PDF-
  const header = buffer.slice(0, 5).toString("ascii");

  return header === "%PDF-";
}
