export type ColumnType = "text" | "number" | "date" | "checkbox" | "select";

export interface SelectOption {
  id: string;
  name: string;
  color: string;
}

export interface ColumnDef {
  id: string;
  name: string;
  type: ColumnType;
  options?: SelectOption[];
}

export const COLUMNS_SCHEMA_CARD_NAME = "__daspace_columns__";

export type PropsValue = string | number | boolean | null;
export type CardProps = Record<string, PropsValue>;

export function parseColumnSchema(desc: string): ColumnDef[] {
  try {
    const parsed = JSON.parse(desc);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function serializeColumnSchema(columns: ColumnDef[]): string {
  return JSON.stringify(columns);
}

const PROPS_MARKER_RE = /^<!-- daspace:props=([A-Za-z0-9+/=]*) -->\n?/;

export function parseCardProps(desc: string): { props: CardProps; rest: string } {
  const match = desc.match(PROPS_MARKER_RE);
  if (!match) return { props: {}, rest: desc };
  try {
    const json = Buffer.from(match[1], "base64").toString("utf-8");
    const props = JSON.parse(json);
    return { props: props && typeof props === "object" ? props : {}, rest: desc.slice(match[0].length) };
  } catch {
    return { props: {}, rest: desc.slice(match[0].length) };
  }
}

export function serializeCardProps(props: CardProps, rest: string): string {
  if (Object.keys(props).length === 0) return rest;
  const b64 = Buffer.from(JSON.stringify(props), "utf-8").toString("base64");
  const marker = `<!-- daspace:props=${b64} -->`;
  return rest ? `${marker}\n${rest}` : marker;
}

export function newColumnId(): string {
  return `col_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function newOptionId(): string {
  return `opt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
