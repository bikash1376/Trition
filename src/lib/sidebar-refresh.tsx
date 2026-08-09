"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

interface SidebarRefreshValue {
  nonce: number;
  refreshSidebar: () => void;
}

const SidebarRefreshContext = createContext<SidebarRefreshValue | null>(null);

export function SidebarRefreshProvider({ children }: { children: ReactNode }) {
  const [nonce, setNonce] = useState(0);
  const refreshSidebar = useCallback(() => setNonce((n) => n + 1), []);

  return <SidebarRefreshContext.Provider value={{ nonce, refreshSidebar }}>{children}</SidebarRefreshContext.Provider>;
}

export function useSidebarRefresh() {
  const ctx = useContext(SidebarRefreshContext);
  if (!ctx) throw new Error("useSidebarRefresh must be used within a SidebarRefreshProvider");
  return ctx;
}
