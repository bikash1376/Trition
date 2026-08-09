"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function TrelloCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState(false);
  const [videoEnded, setVideoEnded] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    const token = new URLSearchParams(window.location.hash.slice(1)).get("token");

    (async () => {
      try {
        if (!token) throw new Error("missing token");
        const res = await fetch("/api/auth/trello/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        if (!res.ok) throw new Error("session failed");
        setSessionReady(true);
      } catch {
        setError(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (videoEnded && sessionReady) router.replace("/");
  }, [videoEnded, sessionReady, router]);

  if (error) {
    return (
      <div className="flex h-full min-h-screen items-center justify-center px-4">
        <p className="text-sm text-muted-foreground">
          Trello sign-in failed.{" "}
          <a href="/login" className="text-primary underline underline-offset-4">
            Back to login
          </a>
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-screen flex-col items-center justify-center gap-4 px-4">
      <video
        src="/trition-write-main.mp4"
        autoPlay
        muted
        playsInline
        onEnded={() => setVideoEnded(true)}
        className="h-40 w-40 object-contain"
      />
      <p className="text-sm text-muted-foreground">Setting up your workspace…</p>
    </div>
  );
}
