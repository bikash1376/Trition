import { Skeleton } from "@/components/ui/skeleton";

export function ContentSkeleton() {
  return (
    <div className="px-10 py-12">
      <Skeleton className="mb-6 h-9 w-64" />
      <div className="flex flex-col gap-2">
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-5/6" />
        <Skeleton className="h-5 w-2/3" />
      </div>
    </div>
  );
}
