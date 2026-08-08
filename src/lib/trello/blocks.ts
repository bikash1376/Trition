export const HOME_LIST_NAME = "DaSpace";
export const PERSONAL_BOARD_NAME = "DaSpace Personal";

export type BlockType = "text" | "page" | "bookmark" | "image" | "table";

const BLOCK_TYPES: BlockType[] = ["text", "page", "bookmark", "image", "table"];

export interface ParsedBlock {
  type: BlockType;
  ref: string | null;
  content: string;
}

const MARKER_RE = /^<!-- daspace:block=(\w+)(?:;ref=([^\s]+))? -->\n?/;

export function parseBlock(desc: string): ParsedBlock {
  const match = desc.match(MARKER_RE);
  if (!match) return { type: "text", ref: null, content: desc };
  const [full, type, ref] = match;
  const blockType = BLOCK_TYPES.includes(type as BlockType) ? (type as BlockType) : "text";
  return { type: blockType, ref: ref ?? null, content: desc.slice(full.length) };
}

export function serializeBlock(type: BlockType, ref: string | null, content: string) {
  const marker = ref ? `<!-- daspace:block=${type};ref=${ref} -->` : `<!-- daspace:block=${type} -->`;
  return content ? `${marker}\n${content}` : marker;
}

export function isBlockCard(desc: string) {
  return MARKER_RE.test(desc);
}

export function isCanvasList(cardDescs: string[]) {
  return cardDescs.length === 0 || cardDescs.every(isBlockCard);
}
