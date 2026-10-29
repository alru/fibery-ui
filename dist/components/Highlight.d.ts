/** Lowercases and folds "ё" into "е" so "рублев" finds "Рублёв". Keeps the string length unchanged. */
export declare const normalizeSearchText: (text: string) => string;
/** Splits a search query into normalized, non-empty words. */
export declare const searchTokens: (query: string) => string[];
export type HighlightProps = {
    text: string;
    /** Raw query string or tokens from `searchTokens`; every occurrence of every word is marked. Omit to only format. */
    query?: string | string[];
    /** Path separator inside `text` (e.g. " > "): segments are highlighted separately, separators drawn small and muted. */
    separator?: string;
};
/** Renders `text` with query matches wrapped in `<mark>`, case- and "ё"-insensitive. */
export declare function Highlight({ text, query, separator }: HighlightProps): import("react").JSX.Element;
