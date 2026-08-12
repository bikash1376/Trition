"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const CanvasEditor = dynamic(() => import("./canvas-editor").then((m) => m.CanvasEditor), { ssr: false });

export default function CanvasEditorWrapper({ listId }: { listId?: string }) {
  const [params, setParams] = useState<{ listId?: string; boardId?: string }>({});

  useEffect(() => {
    // prefer explicit prop, otherwise read from URL
    if (listId) {
      setParams({ listId });
      return;
    }
    try {
      const qs = new URLSearchParams(window.location.search);
      const l = qs.get("listId") ?? undefined;
      const b = qs.get("boardId") ?? undefined;
      setParams({ listId: l ?? undefined, boardId: b ?? undefined });
    } catch {
      setParams({});
    }
  }, [listId]);

  return <CanvasEditor initialListId={params.listId} initialBoardId={params.boardId} />;
}
