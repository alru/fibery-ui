import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ArrowDown, ArrowUp } from "lucide-react";
import { cx } from "../cx";
import { formatDelta } from "../metrics";
import { Skeleton } from "./States";
import { useKitTexts } from "./KitLang";
/**
 * A flat sheet (like `Card variant="flat"`): the number in 24px monospace digits, the label, its definition, and the
 * comparison line pinned to the bottom, so cards in a row line up. The change has no color: growth of lost deals is
 * bad and growth of replies is good, so a red/green by sign would lie on half the metrics.
 */
export function MetricCard({ value, label, definition, compare, note, onClick, loading, className }) {
    const t = useKitTexts();
    const Arrow = compare && compare.delta > 0 ? ArrowUp : compare && compare.delta < 0 ? ArrowDown : null;
    const content = (_jsxs(_Fragment, { children: [_jsx("span", { className: "fui-metric__value", children: loading ? _jsx(Skeleton, { className: "fui-metric__skeleton" }) : value }), _jsx("span", { className: "fui-metric__label", children: label }), _jsx("span", { className: "fui-metric__definition", children: definition }), note != null && _jsx("span", { className: "fui-metric__note", children: note }), compare !== undefined && (_jsx("span", { className: "fui-metric__compare", children: compare && !loading && (_jsxs(_Fragment, { children: [t.was, " ", compare.prev, " \u00B7 ", Arrow && _jsx(Arrow, { "aria-hidden": true }), formatDelta(compare.delta)] })) }))] }));
    return onClick ? (_jsx("button", { type: "button", className: cx("fui-metric", className), "data-interactive": "", onClick: onClick, children: content })) : (_jsx("div", { className: cx("fui-metric", className), children: content }));
}
