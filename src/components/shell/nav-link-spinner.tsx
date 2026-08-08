"use client";

import { useLinkStatus } from "next/link";
import { Spinner } from "@/components/ui/spinner";

export function NavLinkSpinner() {
  const { pending } = useLinkStatus();
  if (!pending) return null;
  return <Spinner className="size-3 shrink-0 text-muted-foreground" />;
}
