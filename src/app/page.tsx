import { redirect } from "next/navigation";
import { getTrelloToken } from "@/lib/trello/session";
import { AppShell } from "@/components/shell/app-shell";

export default async function Home() {
  const token = await getTrelloToken();
  if (!token) redirect("/login");

  return (
    <AppShell>
      <div className="flex h-full items-center justify-center px-6">
        <div className="max-w-md space-y-2 text-center">
          <h1 className="text-lg font-semibold">You&apos;re connected to Trello.</h1>
          <p className="text-sm text-muted-foreground">
            Board and page syncing hasn&apos;t been built yet — see CHECKLIST.md for progress.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
