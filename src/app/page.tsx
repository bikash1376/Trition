import { redirect } from "next/navigation";
import { getMe, getMyBoards } from "@/lib/trello/client";
import { requireToken, withAuthGuard } from "@/lib/trello/guard";
import { Button } from "@/components/ui/button";

export default async function Home() {
  const token = await requireToken();

  const [me, boards] = await withAuthGuard(Promise.all([getMe(token), getMyBoards(token)]));

  if (boards.length > 0) redirect(`/b/${boards[0].id}`);

  return (
    <div className="flex h-screen items-center justify-center px-6">
      <div className="max-w-sm space-y-3 text-center">
        <h1 className="text-lg font-semibold">No Trello boards found</h1>
        <p className="text-sm text-muted-foreground">
          Signed in as {me.fullName || me.username}. Create a board in Trello, then refresh this page.
        </p>
        <form action="/api/auth/logout" method="post">
          <Button type="submit" variant="outline" size="sm">
            Log out
          </Button>
        </form>
      </div>
    </div>
  );
}
