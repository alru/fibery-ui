/** Lowercases and folds "ё" into "е" so "рублев" finds "Рублёв". Keeps the string length unchanged. */
export declare const normalizeSearchText: (text: string) => string;
/** Splits a search query into normalized, non-empty words. */
export declare const searchTokens: (query: string) => string[];
export type HighlightProps = {
    text: string;
    /** Raw query string or tokens from `searchTokens`; every occurrence of every word is marked. */
    query: string | string[];
};
/** Renders `text` with query matches wrapped in `<mark>`, case- and "ё"-insensitive. */
export declare function Highlight({ text, query }: HighlightProps): import("react").JSX.Element;
