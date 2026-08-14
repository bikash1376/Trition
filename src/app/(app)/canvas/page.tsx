import { requireToken } from "@/lib/trello/guard";
import CanvasEditorWrapper from "@/components/canvas/canvas-editor-wrapper";

export default async function CanvasPage() {
  await requireToken();
  return (
    <div className="h-full w-full">
      <CanvasEditorWrapper />
    </div>
  );
}
