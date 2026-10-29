import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cx } from "../cx";
/** Table on a card-like surface; scrolls horizontally when wider than its container. */
export function Table({ className, ...props }) {
    return (_jsx("div", { className: "fui-table-wrap", children: _jsx("table", { className: cx("fui-table", className), ...props }) }));
}
/** Caption row that starts a group of body rows, e.g. a category; may carry its own totals. */
export function TableGroupRow({ label, colSpan, level = 1, children }) {
    return (_jsxs("tr", { className: "fui-table__group", "data-level": level, children: [_jsx("th", { colSpan: children ? undefined : colSpan, scope: children ? "row" : "colgroup", children: label }), children] }));
}
