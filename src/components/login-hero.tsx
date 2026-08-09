"use client";

import { useState, type TransitionEvent } from "react";
import { GoogleMark, TrelloMark } from "@/components/icons";

type Phase = "video-big" | "video-shrink" | "video-up" | "done";

export function LoginHero() {
  const [phase, setPhase] = useState<Phase>("video-big");
  const isDone = phase === "done";

  function handleWrapperTransitionEnd(e: TransitionEvent<HTMLDivElement>) {
    if (phase === "video-shrink" && e.propertyName === "height") {
      setPhase("video-up");
    } else if (phase === "video-up" && e.propertyName === "translate") {
      setPhase("done");
    }
  }

  const wrapperClass =
    phase === "video-big"
      ? "transition-all ease-out duration-700 h-[min(80vh,1200px)] w-[min(80vh,1200px)]"
      : phase === "video-shrink"
        ? "transition-all ease-out duration-500 h-96 w-96"
        : phase === "video-up"
          ? "transition-all ease-out duration-500 h-96 w-96 translate-y-0"
          : "h-96 w-96 -translate-y-40"; // done: no transition/duration classes — instant, silent, fixed

  return (
    <div className="flex h-screen flex-1 flex-col items-center justify-center gap-4 overflow-hidden px-4 py-10">
      <div onTransitionEnd={handleWrapperTransitionEnd} className={`flex items-center justify-center ${wrapperClass}`}>
        {!isDone ? (
          <video
            src="/trition-write-main.mp4"
            autoPlay
            muted
            playsInline
            onEnded={() => setPhase("video-shrink")}
            className="h-full w-full object-contain"
          />
        ) : (
          <h1
            className="font-script self-end text-[63px] leading-none whitespace-nowrap"
            style={{ color: "#ffffff", WebkitTextStroke: "1.0px #ffffff" }}
          >
            Trition
          </h1>
        )}
      </div>

      <div
        className={`flex w-full max-w-sm flex-col items-center gap-6 text-center transition-opacity duration-500 -translate-y-30 ${
          isDone ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">Your Trello, as a workspace.</h2>
          <p className="text-sm text-muted-foreground">Log in with your Trello account to continue</p>
        </div>

        <div className="grid w-full grid-cols-2 gap-3">
          <a
            href="/api/auth/trello/authorize"
            className="flex flex-col items-center gap-2 rounded-lg border border-border bg-card px-4 py-5 transition-colors hover:bg-accent"
          >
            <TrelloMark className="h-6 w-6" />
            <span className="text-sm font-medium">Trello</span>
          </a>

          <button
            type="button"
            disabled
            className="flex cursor-not-allowed flex-col items-center gap-2 rounded-lg border border-border bg-card px-4 py-5 opacity-50"
          >
            <GoogleMark className="h-6 w-6" />
            <span className="text-sm font-medium">Google</span>
          </button>
        </div>

        <p className="text-xs text-muted-foreground">Google sign-in is coming later.</p>
      </div>
    </div>
  );
}
