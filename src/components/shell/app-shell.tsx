export function AppShell({
  sidebar,
  children,
}: {
  sidebar: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-full overflow-hidden">
      {sidebar}
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
