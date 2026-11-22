import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// Navigator over a screen made of several lists: one anchor per section with its icon, short name and count. A click
// tells the app (to open the section) and scrolls to it; the row sticks to the top while the screen scrolls.
import { useEffect, useRef, useState } from "react";
import { cx } from "../cx";
import { useKitTexts } from "./KitLang";
const FLASH_MS = 900;
/**
 * Sticky row of section anchors "icon · name · count" in one segmented frame. Each anchor keeps one width whatever
 * its count (room for "999", tabular digits); a zero count turns muted and its icon neutral. Below 700px of
 * container width only icons and counts remain.
 */
export function CountNav({ items, onSelect, scroll = true, surface = "background", className, ...props }) {
    const t = useKitTexts();
    const sentinel = useRef(null);
    const [stuck, setStuck] = useState(false);
    // A hairline under the bar only while it is stuck over scrolled content.
    useEffect(() => {
        const el = sentinel.current;
        if (!el || typeof IntersectionObserver === "undefined")
            return;
        const observer = new IntersectionObserver(([entry]) => setStuck(!entry.isIntersecting && entry.boundingClientRect.top < (entry.rootBounds?.top ?? 0)));
        observer.observe(el);
        return () => observer.disconnect();
    }, []);
    const select = (id) => {
        onSelect?.(id);
        if (!scroll)
            return;
        // Two frames: the app first renders the section it was asked to open.
        requestAnimationFrame(() => requestAnimationFrame(() => {
            const target = document.getElementById(id);
            if (!target)
                return;
            const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
            target.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
            target.setAttribute("data-flash", "");
            window.setTimeout(() => target.removeAttribute("data-flash"), FLASH_MS);
        }));
    };
    return (_jsxs(_Fragment, { children: [_jsx("div", { ref: sentinel, className: "fui-count-nav__sentinel", "aria-hidden": true }), _jsx("nav", { "aria-label": props["aria-label"] ?? t.sections, "data-stuck": stuck ? "" : undefined, "data-surface": surface, className: cx("fui-count-nav", className), children: _jsx("div", { className: "fui-count-nav__track", children: items.map((item) => (_jsxs("button", { type: "button", className: "fui-count-nav__item", "data-hue": item.count > 0 ? item.hue : undefined, "data-zero": item.count === 0 ? "" : undefined, title: item.label, "aria-label": `${item.label}: ${item.count}`, onClick: () => select(item.id), children: [item.icon, _jsx("span", { className: "fui-count-nav__label", children: item.label }), _jsx("span", { className: "fui-count-nav__count", children: item.count })] }, item.id))) }) })] }));
}
