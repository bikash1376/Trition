"use client";

import { useEffect, useState, type TransitionEvent } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { PlayCircleIcon } from "@hugeicons/core-free-icons";
import { TrelloMark } from "@/components/icons";

type Phase = "video-big" | "video-shrink" | "video-up" | "done";

interface LoginHeroProps {
  demoEnabled: boolean;
}

export function LoginHero({ demoEnabled }: LoginHeroProps) {
  const [phase, setPhase] = useState<Phase>("video-big");
  const isDone = phase === "done";

  // Login always plays the video intro against the dark theme, regardless of the
  // signed-in appearance preference — restore whatever was active on unmount.
  useEffect(() => {
    const root = document.documentElement;
    const hadDark = root.classList.contains("dark");
    const hadExp = root.classList.contains("theme-exp");
    const hadTerminal = root.classList.contains("theme-terminal");
    root.classList.add("dark");
    root.classList.remove("theme-exp", "theme-terminal");
    return () => {
      root.classList.toggle("dark", hadDark);
      root.classList.toggle("theme-exp", hadExp);
      root.classList.toggle("theme-terminal", hadTerminal);
    };
  }, []);

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
    <div className="flex h-screen flex-1 flex-col items-center justify-center gap-4 overflow-hidden bg-[#181818] px-4 py-10">
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
            style={{ color: "#ffffff" }}
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

          {demoEnabled ? (
            <form action="/api/auth/demo" method="post" className="contents">
              <button
                type="submit"
                className="flex flex-col items-center gap-2 rounded-lg border border-border bg-card px-4 py-5 transition-colors hover:bg-accent"
              >
                <HugeiconsIcon icon={PlayCircleIcon} className="h-6 w-6" />
                <span className="text-sm font-medium">Try now</span>
              </button>
            </form>
          ) : (
            <button
              type="button"
              disabled
              className="flex cursor-not-allowed flex-col items-center gap-2 rounded-lg border border-border bg-card px-4 py-5 opacity-50"
            >
              <HugeiconsIcon icon={PlayCircleIcon} className="h-6 w-6" />
              <span className="text-sm font-medium">Try now</span>
            </button>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          {demoEnabled
            ? "No Trello account? Explore a shared demo workspace — it resets periodically."
            : "Demo mode isn't configured on this deployment."}
        </p>
      </div>
    </div>
  );
}
