export function ImageBlock({ cardId, attachmentId, alt }: { cardId: string; attachmentId: string | null; alt: string }) {
  if (!attachmentId) {
    return <p className="text-sm text-muted-foreground italic">Image failed to upload</p>;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/api/attachments/${cardId}/${attachmentId}`}
      alt={alt}
      className="max-w-full rounded-md border border-border"
    />
  );
}
