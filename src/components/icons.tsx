export function DaSpaceMark({ className }: { className?: string }) {
  return (
    <div
      className={className}
      style={{
        background: "linear-gradient(135deg, #2383e2, #4d9fef)",
        borderRadius: "8px",
      }}
    />
  );
}

export function TrelloMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <rect width="24" height="24" rx="5" fill="#0079BF" />
      <rect x="4" y="4" width="6" height="11" rx="1.2" fill="white" />
      <rect x="14" y="4" width="6" height="7" rx="1.2" fill="white" />
    </svg>
  );
}
