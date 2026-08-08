import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { DaSpaceMark } from "@/components/icons";

export function AppSidebar() {
  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-2 px-3 py-3">
        <DaSpaceMark className="h-5 w-5" />
        <span className="text-sm font-semibold">DaSpace</span>
      </div>

      <Separator className="bg-sidebar-border" />

      <ScrollArea className="flex-1 px-2 py-2">
        <p className="px-2 py-1.5 text-xs text-muted-foreground">
          Pages will appear here once your Trello workspace is connected.
        </p>
      </ScrollArea>

      <Separator className="bg-sidebar-border" />

      <form action="/api/auth/logout" method="post" className="p-2">
        <Button type="submit" variant="ghost" size="sm" className="w-full justify-start">
          Log out
        </Button>
      </form>
    </aside>
  );
}
