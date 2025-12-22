export function isPdf(media) {
    if (!media || !media.data) return false;

    if (media.mimetype && /pdf/i.test(media.mimetype)) return true;
    if (media.filename && media.filename.toLowerCase().endsWith(".pdf")) return true;

    const buf = Buffer.from(media.data, "base64");
    const header = buf.slice(0, 1024).toString("latin1");

    return header.includes("%PDF");
}
