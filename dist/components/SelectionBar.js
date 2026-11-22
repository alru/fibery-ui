import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// Bar of actions on the rows selected in a list or table: how many are selected, what to do with them, and the
// progress of a bulk write. Sticks to the bottom of the scrolling area, so it stays at hand in a long list.
import { useLayoutEffect, useRef } from "react";
import { X } from "lucide-react";
import { cx } from "../cx";
import { Button } from "./Button";
import { useKitTexts } from "./KitLang";
// Heights of the open bars; the tallest lifts the toasts (overlay.css, `--fui-toasts-offset`) by itself plus a gap.
const openBars = new Map();
const liftToasts = () => {
    const tallest = Math.max(0, ...openBars.values());
    const root = document.documentElement.style;
    if (tallest)
        root.setProperty("--fui-toasts-offset", `${tallest + 12}px`);
    else
        root.removeProperty("--fui-toasts-offset");
};
/**
 * Sticky bar at the bottom of a list with selected rows: «Выбрано: N» / "N selected", the actions, «Снять выбор» /
 * "Clear". Render it while something is selected; toasts move up above it while it is open. The count and the
 * progress have fixed widths with tabular digits, so nothing moves while they change.
 */
export function SelectionBar({ count, actions, onClear, progress, busy, className }) {
    const t = useKitTexts();
    const locked = busy || progress != null;
    const ref = useRef(null);
    // Measured, not assumed: the bar wraps to two lines in a narrow window.
    useLayoutEffect(() => {
        const bar = ref.current;
        if (!bar)
            return;
        const observer = new ResizeObserver(() => {
            openBars.set(bar, bar.offsetHeight);
            liftToasts();
        });
        observer.observe(bar);
        return () => {
            observer.disconnect();
            openBars.delete(bar);
            liftToasts();
        };
    }, []);
    return (_jsxs("div", { ref: ref, role: "group", "aria-label": t.selectionActions, className: cx("fui-selection-bar", className), children: [_jsx("span", { className: "fui-selection-bar__count", "aria-live": "polite", children: t.selected(count) }), progress ? (_jsxs("div", { className: "fui-selection-bar__progress", children: [_jsx("span", { className: "fui-selection-bar__progress-label", children: t.progress(progress.done, progress.total) }), _jsx("div", { className: "fui-progress", role: "progressbar", "aria-valuemin": 0, "aria-valuemax": progress.total, "aria-valuenow": progress.done, children: _jsx("div", { className: "fui-progress__bar", style: { width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` } }) })] })) : (_jsx("fieldset", { className: "fui-selection-bar__actions", disabled: locked, children: actions })), _jsx(Button, { variant: "ghost", size: "sm", icon: _jsx(X, {}), className: "fui-selection-bar__clear", disabled: locked, onClick: onClear, children: t.clearSelection })] }));
}
