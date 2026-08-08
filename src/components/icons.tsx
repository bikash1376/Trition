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

export function GoogleMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className}>
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.28 1.48-1.13 2.73-2.4 3.58v3h3.88c2.27-2.09 3.54-5.17 3.54-8.82z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.07 7.93-2.91l-3.88-3c-1.08.72-2.45 1.16-4.05 1.16-3.11 0-5.75-2.1-6.69-4.92H1.3v3.09C3.27 21.3 7.31 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.31 14.33c-.24-.72-.38-1.49-.38-2.28s.14-1.56.38-2.28V6.68H1.3A11.96 11.96 0 000 12.05c0 1.93.46 3.76 1.3 5.37l4.01-3.09z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.94 1.19 15.24 0 12 0 7.31 0 3.27 2.7 1.3 6.68l4.01 3.09c.94-2.82 3.58-4.92 6.69-4.92z"
      />
    </svg>
  );
}
