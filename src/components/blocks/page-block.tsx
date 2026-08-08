import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { File01Icon } from "@hugeicons/core-free-icons";

export function PageBlock({ href, name }: { href: string; name: string }) {
  return (
    <Link
      href={href}
      className="flex w-fit items-center gap-2 rounded-md px-1 py-1.5 text-sm font-medium underline decoration-border underline-offset-4 hover:bg-accent"
    >
      <HugeiconsIcon icon={File01Icon} size={16} className="text-muted-foreground" />
      {name}
    </Link>
  );
}
