import { requireToken } from "@/lib/trello/guard";
import CanvasEditorWrapper from "@/components/canvas/canvas-editor-wrapper";

export default async function CanvasPage() {
  await requireToken();
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-10 sm:py-12">
      <CanvasEditorWrapper />
    </div>
  );
}
