// Search helpers shared by app-side filtering and match highlighting, so both agree on what "matches" means.
import type {ReactNode} from "react";

/** Lowercases and folds "ё" into "е" so "рублев" finds "Рублёв". Keeps the string length unchanged. */
export const normalizeSearchText = (text: string) => text.toLowerCase().replace(/ё/g, "е");

/** Splits a search query into normalized, non-empty words. */
export const searchTokens = (query: string) => normalizeSearchText(query).split(/\s+/).filter(Boolean);

export type HighlightProps = {
  text: string;
  /** Raw query string or tokens from `searchTokens`; every occurrence of every word is marked. */
  query: string | string[];
};

/** Renders `text` with query matches wrapped in `<mark>`, case- and "ё"-insensitive. */
export function Highlight({text, query}: HighlightProps) {
  const tokens = Array.isArray(query) ? query.map(normalizeSearchText).filter(Boolean) : searchTokens(query);
  const normalized = normalizeSearchText(text);
  // Lowercasing a few exotic characters changes length; positions would drift, so skip highlighting then.
  if (!tokens.length || normalized.length !== text.length) return <>{text}</>;

  const marked = new Array<boolean>(text.length).fill(false);
  for (const token of tokens) {
    for (let i = normalized.indexOf(token); i !== -1; i = normalized.indexOf(token, i + token.length)) {
      marked.fill(true, i, i + token.length);
    }
  }

  const parts: ReactNode[] = [];
  let start = 0;
  for (let i = 1; i <= text.length; i++) {
    if (i === text.length || marked[i] !== marked[start]) {
      const chunk = text.slice(start, i);
      parts.push(marked[start] ? <mark key={start} className="fui-highlight">{chunk}</mark> : chunk);
      start = i;
    }
  }
  return <>{parts}</>;
}
