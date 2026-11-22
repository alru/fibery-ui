import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// History of a record as a vertical timeline: a spine through the markers, a time column, the event and its context,
// the red "now" line between what is planned and what is past, an optional row where the record began (the spine ends
// there), and «Ещё N» under a long history.
import { Fragment, useState } from "react";
import { cx } from "../cx";
import { Button } from "./Button";
import { Separator } from "./Layout";
import { useKitTexts } from "./KitLang";
/**
 * Vertical timeline: spine 12px from the left edge, markers in circles of the card color (set
 * `--fui-timeline-bg` on another surface), time column, title with optional second line, muted meta on the right.
 */
export function Timeline({ items, nowIndex, nowLabel, limit = 10, empty, start, className, ...props }) {
    const t = useKitTexts();
    const [all, setAll] = useState(false);
    if (items.length === 0 && !start)
        return empty ? _jsx("div", { className: cx("fui-timeline__empty", className), children: empty }) : null;
    const shown = all ? items.length : Math.min(limit, items.length);
    const nowAt = nowIndex != null && nowIndex >= 0 && nowIndex <= shown ? nowIndex : null;
    const nowLine = _jsx(Separator, { as: "li", tone: "alert", label: nowLabel ?? t.now, className: "fui-timeline__now" });
    const onKeyDown = (item) => (e) => {
        if (e.target !== e.currentTarget || (e.key !== "Enter" && e.key !== " "))
            return;
        e.preventDefault();
        item.onClick?.();
    };
    return (_jsxs("div", { className: cx("fui-timeline", className), children: [_jsxs("ol", { className: "fui-timeline__list", "aria-label": props["aria-label"], children: [items.slice(0, shown).map((item, i) => (_jsxs(Fragment, { children: [nowAt === i && nowLine, _jsxs("li", { className: "fui-timeline__item", "data-struck": item.struck ? "" : undefined, ...(item.onClick && {
                                    role: "button",
                                    tabIndex: 0,
                                    onClick: item.onClick,
                                    onKeyDown: onKeyDown(item),
                                    "data-interactive": "",
                                }), children: [_jsx("span", { className: "fui-timeline__marker", children: item.marker }), _jsx("span", { className: "fui-timeline__time", children: item.time }), _jsxs("span", { className: "fui-timeline__main", children: [_jsx("span", { className: "fui-timeline__title", children: item.title }), item.description != null && _jsx("span", { className: "fui-timeline__description", children: item.description })] }), item.meta != null && _jsx("span", { className: "fui-timeline__meta", children: item.meta })] })] }, item.id))), nowAt === shown && nowLine, start && shown === items.length && (_jsxs("li", { className: "fui-timeline__item fui-timeline__start", children: [_jsx("span", { className: "fui-timeline__marker", children: _jsx("span", { className: "fui-timeline__start-dot" }) }), _jsx("span", { className: "fui-timeline__time", children: start.time }), _jsx("span", { className: "fui-timeline__main", children: _jsx("span", { className: "fui-timeline__title", children: start.label }) })] }))] }), items.length === 0 && empty && _jsx("div", { className: "fui-timeline__empty", children: empty }), shown < items.length && (_jsx(Button, { variant: "ghost", size: "sm", className: "fui-timeline__more", onClick: () => setAll(true), children: t.moreCount(items.length - shown) }))] }));
}
