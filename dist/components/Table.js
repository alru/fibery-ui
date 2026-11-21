import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ArrowDown, ArrowUp } from "lucide-react";
import { cx } from "../cx";
/** Table on a card-like surface; scrolls horizontally when wider than its container (unless the header sticks). */
export function Table({ editing, flat, header = "plain", stickyHeader, valign = "middle", density = "compact", responsive, className, ...props }) {
    const sticky = stickyHeader != null && stickyHeader !== false;
    return (_jsx("div", { className: "fui-table-wrap", "data-editing": editing ? "" : undefined, "data-flat": flat ? "" : undefined, "data-header": header === "tinted" ? "tinted" : undefined, "data-sticky": sticky ? "" : undefined, "data-valign": valign === "top" ? "top" : undefined, "data-density": density === "comfortable" ? "comfortable" : undefined, "data-responsive": responsive ? "" : undefined, style: typeof stickyHeader === "number" ? { "--fui-sticky-top": `${stickyHeader}px` } : undefined, children: _jsx("table", { className: cx("fui-table", className), ...props }) }));
}
/**
 * Sortable header cell: renders the `<th>` itself (so it carries `aria-sort`) with a button across the whole cell.
 * The arrow (↑ / ↓, 12px) follows the text only on the active column; the others keep its place, so headers never
 * shift when the sort changes.
 */
export function SortHeader({ active, dir, onSort, className, children, ...props }) {
    const Arrow = dir === "asc" ? ArrowUp : ArrowDown;
    return (_jsx("th", { "aria-sort": active ? (dir === "asc" ? "ascending" : "descending") : undefined, className: cx("fui-sort-header", className), ...props, children: _jsxs("button", { type: "button", className: "fui-sort-header__button", onClick: onSort, children: [_jsx("span", { className: "fui-sort-header__text", children: children }), _jsx(Arrow, { className: "fui-sort-header__arrow", "data-active": active ? "" : undefined, "aria-hidden": true })] }) }));
}
/** Caption row that starts a group of body rows, e.g. a category; may carry its own totals. */
export function TableGroupRow({ label, colSpan, level = 1, children }) {
    return (_jsxs("tr", { className: "fui-table__group", "data-level": level, children: [_jsx("th", { colSpan: children ? undefined : colSpan, scope: children ? "row" : "colgroup", children: label }), children] }));
}
