const IMAGE_RE = /\.(png|jpe?g|gif|webp|svg|bmp|avif)(\?|$)/i;
const VIDEO_RE = /\.(mp4|mov|webm|avi|mkv|m4v)(\?|$)/i;

export function isImageAttachment(mimeType: string | null, name: string, url: string) {
  return mimeType?.startsWith("image/") || IMAGE_RE.test(name) || IMAGE_RE.test(url);
}

export function isVideoAttachment(mimeType: string | null, name: string, url: string) {
  return mimeType?.startsWith("video/") || VIDEO_RE.test(name) || VIDEO_RE.test(url);
}
