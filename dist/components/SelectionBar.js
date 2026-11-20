import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { X } from "lucide-react";
import { cx } from "../cx";
import { Button } from "./Button";
import { useKitTexts } from "./KitLang";
/**
 * Sticky bar at the bottom of a list with selected rows: «Выбрано: N» / "N selected", the actions, «Снять выбор» /
 * "Clear". Render it while something is selected. The count and the progress have fixed widths with tabular digits,
 * so nothing moves while they change.
 */
export function SelectionBar({ count, actions, onClear, progress, busy, className }) {
    const t = useKitTexts();
    const locked = busy || progress != null;
    return (_jsxs("div", { role: "group", "aria-label": t.selectionActions, className: cx("fui-selection-bar", className), children: [_jsx("span", { className: "fui-selection-bar__count", "aria-live": "polite", children: t.selected(count) }), progress ? (_jsxs("div", { className: "fui-selection-bar__progress", children: [_jsx("span", { className: "fui-selection-bar__progress-label", children: t.progress(progress.done, progress.total) }), _jsx("div", { className: "fui-progress", role: "progressbar", "aria-valuemin": 0, "aria-valuemax": progress.total, "aria-valuenow": progress.done, children: _jsx("div", { className: "fui-progress__bar", style: { width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` } }) })] })) : (_jsx("fieldset", { className: "fui-selection-bar__actions", disabled: locked, children: actions })), _jsx(Button, { variant: "ghost", size: "sm", icon: _jsx(X, {}), className: "fui-selection-bar__clear", disabled: locked, onClick: onClear, children: t.clearSelection })] }));
}
