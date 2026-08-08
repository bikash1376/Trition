import { Skeleton } from "@/components/ui/skeleton";

export function PageSkeleton() {
  return (
    <div className="flex h-screen w-full overflow-hidden">
      <aside className="flex h-full w-64 shrink-0 flex-col gap-4 border-r border-sidebar-border bg-sidebar p-3">
        <Skeleton className="h-5 w-24" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-3/4" />
        </div>
        <div className="mt-auto flex flex-col gap-2">
          <Skeleton className="h-6 w-full" />
        </div>
      </aside>
      <main className="flex-1 px-10 py-12">
        <Skeleton className="mb-6 h-9 w-64" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-5/6" />
          <Skeleton className="h-5 w-2/3" />
        </div>
      </main>
    </div>
  );
}
