"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function TrelloCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState(false);

  useEffect(() => {
    const token = new URLSearchParams(window.location.hash.slice(1)).get("token");

    const run = async () => {
      if (!token) throw new Error("missing token");
      const res = await fetch("/api/auth/trello/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (!res.ok) throw new Error("session failed");
      router.replace("/");
    };

    run().catch(() => setError(true));
  }, [router]);

  return (
    <div className="flex h-full min-h-screen items-center justify-center px-4">
      <p className="text-sm text-muted-foreground">
        {error ? "Trello sign-in failed. " : "Signing you in with Trello…"}
        {error && (
          <a href="/login" className="text-primary underline underline-offset-4">
            Back to login
          </a>
        )}
      </p>
    </div>
  );
}
