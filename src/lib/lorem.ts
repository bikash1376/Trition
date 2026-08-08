const LOREM_WORDS = [
  "lorem", "ipsum", "dolor", "sit", "amet", "consectetur", "adipiscing", "elit", "sed", "do",
  "eiusmod", "tempor", "incididunt", "ut", "labore", "et", "dolore", "magna", "aliqua", "enim",
  "ad", "minim", "veniam", "quis", "nostrud", "exercitation", "ullamco", "laboris", "nisi", "aliquip",
  "ex", "ea", "commodo", "consequat", "duis", "aute", "irure", "in", "reprehenderit", "voluptate",
  "velit", "esse", "cillum", "fugiat", "nulla", "pariatur", "excepteur", "sint", "occaecat", "cupidatat",
  "non", "proident", "sunt", "culpa", "qui", "officia", "deserunt", "mollit", "anim", "id", "est", "laborum",
];

export function generateLorem(count: number): string {
  const n = Math.max(1, Math.min(count, 500));
  const words = Array.from({ length: n }, (_, i) => LOREM_WORDS[i % LOREM_WORDS.length]);
  words[0] = words[0].charAt(0).toUpperCase() + words[0].slice(1);
  return `${words.join(" ")}.`;
}

const LOREM_TRIGGER_RE = /(^|\s)(lorem(\d+))$/i;

export function expandLoremAtCursor(value: string, cursorPos: number): { value: string; cursorPos: number } | null {
  const before = value.slice(0, cursorPos);
  const match = before.match(LOREM_TRIGGER_RE);
  if (!match) return null;

  const token = match[2];
  const count = parseInt(match[3], 10);
  if (!count) return null;

  const wordStart = cursorPos - token.length;
  const replacement = `${generateLorem(count)} `;
  return {
    value: value.slice(0, wordStart) + replacement + value.slice(cursorPos),
    cursorPos: wordStart + replacement.length,
  };
}
