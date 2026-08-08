import { redirect } from "next/navigation";
import { DaSpaceMark, GoogleMark, TrelloMark } from "@/components/icons";
import { getTrelloToken } from "@/lib/trello/session";

export default async function LoginPage() {
  const token = await getTrelloToken();
  if (token) redirect("/");

  return (
    <div className="flex min-h-screen flex-1 items-center justify-center px-4 py-16">
      <div className="flex w-full max-w-sm flex-col items-center gap-6 text-center">
        <DaSpaceMark className="h-10 w-10" />

        <div className="space-y-1">
          <h1 className="text-xl font-semibold">Your Trello, as a workspace.</h1>
          <p className="text-sm text-muted-foreground">
            Log in with your Trello account to continue
          </p>
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
