import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// Search helpers shared by app-side filtering and match highlighting, so both agree on what "matches" means.
import { Fragment } from "react";
/** Lowercases and folds "ё" into "е" so "рублев" finds "Рублёв". Keeps the string length unchanged. */
export const normalizeSearchText = (text) => text.toLowerCase().replace(/ё/g, "е");
/** Splits a search query into normalized, non-empty words. */
export const searchTokens = (query) => normalizeSearchText(query).split(/\s+/).filter(Boolean);
/** Renders `text` with query matches wrapped in `<mark>`, case- and "ё"-insensitive. */
export function Highlight({ text, query = [], separator }) {
    if (separator && text.includes(separator)) {
        return (_jsx(_Fragment, { children: text.split(separator).map((segment, index) => (_jsxs(Fragment, { children: [index > 0 && _jsx("span", { className: "fui-path-separator", children: separator.trim() }), _jsx(Highlight, { text: segment, query: query })] }, index))) }));
    }
    const tokens = Array.isArray(query) ? query.map(normalizeSearchText).filter(Boolean) : searchTokens(query);
    const normalized = normalizeSearchText(text);
    // Lowercasing a few exotic characters changes length; positions would drift, so skip highlighting then.
    if (!tokens.length || normalized.length !== text.length)
        return _jsx(_Fragment, { children: text });
    const marked = new Array(text.length).fill(false);
    for (const token of tokens) {
        for (let i = normalized.indexOf(token); i !== -1; i = normalized.indexOf(token, i + token.length)) {
            marked.fill(true, i, i + token.length);
        }
    }
    const parts = [];
    let start = 0;
    for (let i = 1; i <= text.length; i++) {
        if (i === text.length || marked[i] !== marked[start]) {
            const chunk = text.slice(start, i);
            parts.push(marked[start] ? _jsx("mark", { className: "fui-highlight", children: chunk }, start) : chunk);
            start = i;
        }
    }
    return _jsx(_Fragment, { children: parts });
}
