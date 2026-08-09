"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Progress } from "@/components/ui/progress";

const MIN_DISPLAY_MS = 3500;

export default function TrelloCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState(false);
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [progress, setProgress] = useState(0);

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
    const timer = setTimeout(() => setMinTimeElapsed(true), MIN_DISPLAY_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      setProgress(Math.min(96, (elapsed / MIN_DISPLAY_MS) * 100));
    }, 60);
    return () => clearInterval(interval);
  }, []);

  const done = minTimeElapsed && sessionReady;

  useEffect(() => {
    if (!done) return;
    const timer = setTimeout(() => router.replace("/"), 200);
    return () => clearTimeout(timer);
  }, [done, router]);

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
      <div className="w-full max-w-xs space-y-3 text-center">
        <p className="text-sm text-muted-foreground">Setting up your workspace…</p>
        <Progress value={done ? 100 : progress} />
      </div>
    </div>
  );
}
