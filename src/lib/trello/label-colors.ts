const LABEL_COLORS: Record<string, string> = {
  green: "#4bce97",
  yellow: "#e2b203",
  orange: "#faa53d",
  red: "#f87462",
  purple: "#9f8fef",
  blue: "#579dff",
  sky: "#6cc3e0",
  lime: "#94c748",
  pink: "#e774bb",
  black: "#8c9bab",
};

export function labelColor(color: string | null) {
  return color ? (LABEL_COLORS[color] ?? "#8c9bab") : "#8c9bab";
}
