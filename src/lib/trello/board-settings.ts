export interface WorkspaceSettings {
  showLastEditedColumn: boolean;
  // Lists created as a Table block's embedded backing store — not real pages, so they're
  // excluded from sidebar navigation and "link to an existing page" search. Page blocks'
  // backing lists are deliberately NOT tracked here; those are meant to be real pages.
  tableListIds: string[];
  // Lists created as a Canvas command — these are real pages but should open in the shared
  // canvas editor instead of the normal page view.
  canvasListIds: string[];
}

export const DEFAULT_WORKSPACE_SETTINGS: WorkspaceSettings = {
  showLastEditedColumn: true,
  tableListIds: [],
  canvasListIds: [],
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
