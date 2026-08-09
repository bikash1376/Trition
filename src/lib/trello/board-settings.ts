export interface WorkspaceSettings {
  showLastEditedColumn: boolean;
}

export const DEFAULT_WORKSPACE_SETTINGS: WorkspaceSettings = {
  showLastEditedColumn: true,
};

// Hidden marker prepended to the board's own `desc` field — same trick used for block/column/props
// markers on card descriptions, just at the board level so it applies workspace-wide.
const SETTINGS_MARKER_RE = /^<!-- daspace:settings=([A-Za-z0-9+/=]*) -->\n?/;

export function parseWorkspaceSettings(boardDesc: string | undefined | null): {
  settings: WorkspaceSettings;
  rest: string;
} {
  const desc = boardDesc ?? "";
  const match = desc.match(SETTINGS_MARKER_RE);
  if (!match) return { settings: DEFAULT_WORKSPACE_SETTINGS, rest: desc };
  try {
    const json = Buffer.from(match[1], "base64").toString("utf-8");
    const parsed = JSON.parse(json);
    return {
      settings: { ...DEFAULT_WORKSPACE_SETTINGS, ...(parsed && typeof parsed === "object" ? parsed : {}) },
      rest: desc.slice(match[0].length),
    };
  } catch {
    return { settings: DEFAULT_WORKSPACE_SETTINGS, rest: desc.slice(match[0].length) };
  }
}

export function serializeWorkspaceSettings(settings: WorkspaceSettings, rest: string): string {
  const b64 = Buffer.from(JSON.stringify(settings), "utf-8").toString("base64");
  const marker = `<!-- daspace:settings=${b64} -->`;
  return rest ? `${marker}\n${rest}` : marker;
}
