import { jsx as _jsx } from "react/jsx-runtime";
import { cx } from "../cx";
/** Table on a card-like surface; scrolls horizontally when wider than its container. */
export function Table({ className, ...props }) {
    return (_jsx("div", { className: "fui-table-wrap", children: _jsx("table", { className: cx("fui-table", className), ...props }) }));
}
/** Caption row that starts a group of body rows, e.g. a category. */
export function TableGroupRow({ label, colSpan, level = 1 }) {
    return (_jsx("tr", { className: "fui-table__group", "data-level": level, children: _jsx("th", { colSpan: colSpan, scope: "colgroup", children: label }) }));
}
