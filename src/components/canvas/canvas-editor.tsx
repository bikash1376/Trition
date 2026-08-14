"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Delete02Icon, FilePasteIcon, ImageAdd01Icon } from "@hugeicons/core-free-icons";
import { Spinner } from "@/components/ui/spinner";
import { useSidebarRefresh } from "@/lib/sidebar-refresh";

// Every image gets the same on-canvas footprint at scale 1 (letterboxed to
// preserve aspect ratio) so a huge photo doesn't dwarf a small screenshot.
const BASE_IMAGE_SIZE = 220;

type CanvasImage = {
  id: string;
  src: string;
  x: number;
  y: number;
  scale: number;
  cardId?: string | null;
  attachmentId?: string | null;
  pending?: boolean;
};

export function CanvasEditor({ initialListId, initialBoardId }: { initialListId?: string; initialBoardId?: string }) {
  const [images, setImages] = useState<CanvasImage[]>(() => {
    try {
      const raw = localStorage.getItem("canvas-images");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [serverImagesLoaded, setServerImagesLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [boards, setBoards] = useState<{ id: string; name: string }[]>([]);
  const [selectedBoard, setSelectedBoard] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [scaleCanvas, setScaleCanvas] = useState(1);
  const [loadingServerImages, setLoadingServerImages] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Persist locally so multiple users can still use their own view.
  useEffect(() => {
    try {
      localStorage.setItem("canvas-images", JSON.stringify(images));
    } catch {}
  }, [images]);

  const addImage = useCallback(
    async (src: string) => {
      const id = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      const rect = containerRef.current?.getBoundingClientRect();
      // center pasted image in container
      const cx = rect ? rect.width / 2 : 100;
      const cy = rect ? rect.height / 2 : 100;
      const centeredX = cx - 64;
      const centeredY = cy - 64;
      // add pending local image (centered)
      setImages((s) => [...s, { id, src, x: centeredX, y: centeredY, scale: 1, pending: true }]);

      // If we have a selected board or an existing canvas list, save immediately to Trello
      if (!selectedBoard && !initialListId) return;

      try {
        // if initialListId provided, use it directly
        let listId: string | null = initialListId ?? null;
        if (!listId) {
          // find or create Canvas list
          const pagesRes = await fetch(`/api/boards/${selectedBoard}/pages`);
          if (pagesRes.ok) {
            const pagesData = await pagesRes.json();
            const found = (pagesData.lists || []).find((l: any) => l.name === "Canvas");
            if (found) listId = found.id;
          }
        }
        if (!listId) {
          const createRes = await fetch(`/api/boards/${selectedBoard}/pages`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: "Canvas", type: "canvas" }),
          });
          if (createRes.ok) {
            const { list } = await createRes.json();
            listId = list?.id ?? null;
            try {
              refreshSidebar();
            } catch {}
          }
        }

        if (!listId) return;

        // upload image as file
        const blob = await (await fetch(src)).blob();
        const form = new FormData();
        form.append("file", new File([blob], `canvas-${id}.png`, { type: blob.type }));
        const uploadRes = await fetch(`/api/lists/${listId}/blocks/image`, { method: "POST", body: form });
        if (!uploadRes.ok) return;
        const data = await uploadRes.json();
        const card = data?.card;
        const attachmentId = card?.attachments?.[0]?.id ?? null;
        // reconcile local image with card info, and switch over to the
        // server-fetched URL so the upload is actually verified round-trip
        // instead of just showing the local blob forever
        setImages((prev) =>
          prev.map((it) =>
            it.id === id
              ? {
                  ...it,
                  pending: false,
                  cardId: card?.id ?? null,
                  attachmentId,
                  src: card?.id && attachmentId ? `/api/attachments/${card.id}/${attachmentId}` : it.src,
                }
              : it,
          ),
        );
      } catch (err) {
        // leave pending false if failed
        setImages((prev) => prev.map((it) => (it.id === id ? { ...it, pending: false } : it)));
      }
    },
    [selectedBoard, initialListId],
  );
  const { refreshSidebar } = useSidebarRefresh();

  const pasteFromClipboard = useCallback(async () => {
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        const imageType = item.types.find((t) => t.startsWith("image/"));
        if (!imageType) continue;
        const blob = await item.getType(imageType);
        const reader = new FileReader();
        reader.onload = () => addImage(String(reader.result));
        reader.readAsDataURL(blob);
        return;
      }
    } catch {
      // clipboard read denied or empty — nothing to paste
    }
  }, [addImage]);

  // Handle paste events to accept images (files or dataURLs)
  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      if (!e.clipboardData) return;
      const items = Array.from(e.clipboardData.items);
      let handled = false;
      items.forEach((item) => {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (!file) return;
          const reader = new FileReader();
          reader.onload = () => {
            addImage(String(reader.result));
          };
          reader.readAsDataURL(file);
          handled = true;
        }
      });

      // If no image file, support pasted image URLs as plain text
      if (!handled) {
        const text = e.clipboardData.getData("text");
        if (text && /(https?:\/\/.+\.(png|jpe?g|gif|webp|svg))/i.test(text)) {
          addImage(text);
          handled = true;
        }
      }

      if (handled) e.preventDefault();
    }
    window.addEventListener("paste", onPaste as EventListener);
    return () => window.removeEventListener("paste", onPaste as EventListener);
  }, [addImage]);

  // fetch available boards for saving
  useEffect(() => {
    let cancelled = false;
    fetch("/api/boards")
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data.boards) {
          setBoards(data.boards.map((b: any) => ({ id: b.id, name: b.name })));
          if (initialBoardId) setSelectedBoard(initialBoardId);
          else if (data.boards.length > 0) setSelectedBoard(data.boards[0].id);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [initialBoardId]);

  useEffect(() => {
    if (!initialListId) return;
    let cancelled = false;
    setLoadingServerImages(true);

    fetch(`/api/lists/${initialListId}/canvas-images`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled) return;
        if (data?.images) {
          setImages(data.images);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) {
          setLoadingServerImages(false);
          setServerImagesLoaded(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [initialListId]);

  // Dragging
  const dragState = useRef<{ id: string | null; offsetX: number; offsetY: number } | null>(null);

  function onPointerDown(e: React.PointerEvent, id: string) {
    const img = images.find((i) => i.id === id);
    if (!img || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left - img.x;
    const offsetY = e.clientY - rect.top - img.y;
    dragState.current = { id, offsetX, offsetY };
    (e.target as Element).setPointerCapture(e.pointerId);
    setSelectedImageId(id);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragState.current || !containerRef.current) return;
    const { id, offsetX, offsetY } = dragState.current;
    setImages((prev) => prev.map((it) => (it.id === id ? { ...it, x: e.clientX - (containerRef.current!.getBoundingClientRect().left + offsetX), y: e.clientY - (containerRef.current!.getBoundingClientRect().top + offsetY) } : it)));
  }

  function onPointerUp(e: React.PointerEvent) {
    if (dragState.current) {
      try {
        (e.target as Element).releasePointerCapture?.(e.pointerId);
      } catch {}
    }
    dragState.current = null;
  }

  // color extraction removed per request

  async function removeImage(id: string) {
    const img = images.find((i) => i.id === id);
    if (img?.cardId) {
      try {
        await fetch(`/api/blocks/${img.cardId}`, { method: "DELETE" });
      } catch {}
    }
    setImages((s) => s.filter((i) => i.id !== id));
    if (selectedImageId === id) setSelectedImageId(null);
  }

  function changeScale(id: string, factor: number) {
    setImages((s) => s.map((i) => (i.id === id ? { ...i, scale: Math.max(0.1, +(i.scale * factor).toFixed(2)) } : i)));
  }

  // Zoom canvas with Ctrl/Cmd + wheel and +/- keys
  useEffect(() => {
    function onWheel(e: WheelEvent) {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      setScaleCanvas((s) => Math.max(0.2, Math.min(3, +(s - Math.sign(e.deltaY) * 0.1).toFixed(2))));
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "+" || e.key === "=") {
        setScaleCanvas((s) => Math.min(3, +(s + 0.1).toFixed(2)));
      }
      if (e.key === "-") {
        setScaleCanvas((s) => Math.max(0.2, +(s - 0.1).toFixed(2)));
      }
    }
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("wheel", onWheel as EventListener);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  // Periodically save metadata (position & scale) for uploaded images to Trello
  useEffect(() => {
    const id = setInterval(() => {
      images.forEach((img) => {
        if (!img.cardId || !img.attachmentId) return;
        const meta = { x: img.x, y: img.y, scale: img.scale };
        // Must include type/ref so this hits the generic read-modify-write
        // path in the PATCH route — omitting them trips its plain-text-block
        // fast path, which stamps the card back to type=text and drops the
        // image ref, silently breaking the image on the next fetch.
        fetch(`/api/blocks/${img.cardId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "image", ref: img.attachmentId, content: JSON.stringify({ meta }) }),
        }).catch(() => {});
      });
    }, 5000);
    return () => clearInterval(id);
  }, [images]);

  return (
    <div className="relative h-full w-full bg-background">
      {/* upload / paste icons top-right — aligned with the sidebar toggle icon's top-3, h-7 w-7 */}
      <div className="absolute right-3 top-3 z-50 flex items-center gap-1">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          title="Upload image from computer"
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <HugeiconsIcon icon={ImageAdd01Icon} size={16} />
        </button>
        <button
          type="button"
          onClick={pasteFromClipboard}
          title="Paste image from clipboard"
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <HugeiconsIcon icon={FilePasteIcon} size={16} />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.currentTarget.files?.[0];
            if (!f) return;
            const reader = new FileReader();
            reader.onload = () => addImage(String(reader.result));
            reader.readAsDataURL(f);
            e.currentTarget.value = "";
          }}
        />
      </div>

      <div
        ref={containerRef}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="absolute inset-0 overflow-hidden"
      >
        {loadingServerImages && (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-background/90 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 rounded-full border border-border bg-popover px-4 py-2 shadow-md">
              <Spinner className="size-4" />
              Loading canvas images…
            </div>
          </div>
        )}
        <div
          className="absolute left-0 top-0 h-full w-full"
          style={{ transform: `scale(${scaleCanvas})`, transformOrigin: "center center" }}
        >
          {images.map((img) => (
            <div
              key={img.id}
              onPointerDown={(e) => onPointerDown(e, img.id)}
              style={{ left: img.x, top: img.y }}
              className="group absolute touch-none select-none z-10"
            >
              <div className="relative" style={{ width: BASE_IMAGE_SIZE * img.scale, height: BASE_IMAGE_SIZE * img.scale }}>
                <img
                  src={img.src}
                  alt="pasted"
                  draggable={false}
                  onClick={() => setSelectedImageId(img.id)}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    display: "block",
                  }}
                  className={`cursor-pointer rounded-md ${selectedImageId === img.id ? "ring-2 ring-primary" : ""}`}
                />
                {img.pending && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-md bg-black/30 px-2 text-[11px] font-medium text-white pointer-events-none">
                    Uploading…
                  </div>
                )}
                {/* counter-scale so controls stay a constant, clickable screen size
                    regardless of canvas zoom */}
                <div
                  className="absolute right-1 top-1 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100"
                  style={{ transform: `scale(${1 / scaleCanvas})`, transformOrigin: "top right" }}
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      changeScale(img.id, 1.1);
                    }}
                    title="Zoom in"
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-muted/60 text-xs hover:bg-muted"
                  >
                    +
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      changeScale(img.id, 0.9);
                    }}
                    title="Zoom out"
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-muted/60 text-xs hover:bg-muted"
                  >
                    −
                  </button>
                  <button
                    type="button"
                    onClick={async (e) => {
                      e.stopPropagation();
                      await removeImage(img.id);
                    }}
                    title="Delete image"
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-destructive/80 text-destructive-foreground hover:bg-destructive"
                  >
                    <HugeiconsIcon icon={Delete02Icon} size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {/* small right sidebar with delete for selected image */}
        <div className="absolute right-4 top-20 z-50 flex flex-col gap-2">
          <button
            type="button"
            onClick={async () => {
              if (!selectedImageId) return;
              await removeImage(selectedImageId);
            }}
            disabled={!selectedImageId}
            className="rounded-md bg-muted/30 p-2 hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
            title="Delete selected image"
          >
            <HugeiconsIcon icon={Delete02Icon} size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
