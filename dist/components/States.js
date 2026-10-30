import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { CircleAlert, Inbox, Info, TriangleAlert } from "lucide-react";
import { cx } from "../cx";
/** Indeterminate spinner: 12 / 16 / 24px. */
export function Spinner({ size = "md", className }) {
    return _jsx("span", { "aria-hidden": true, "data-size": size, className: cx("fui-spinner", className) });
}
/** Pulsing placeholder block; size it with `className` or `style`. */
export function Skeleton({ className, ...props }) {
    return _jsx("div", { "aria-hidden": true, className: cx("fui-skeleton", className), ...props });
}
/** Spinner with a caption, `"Загрузка…"` by default. */
export function LoadingState({ children = "Загрузка…", className }) {
    return (_jsxs("div", { role: "status", className: cx("fui-state", className), children: [_jsx(Spinner, {}), children] }));
}
/**
 * Error box that always shows the underlying message: Fibery API errors carry the exact
 * diagnostic needed to report the problem.
 */
export function ErrorState({ error, title = "Не удалось загрузить данные", action, className }) {
    const message = error instanceof Error ? error.message : String(error);
    return (_jsxs("div", { role: "alert", className: cx("fui-error", className), children: [_jsx(CircleAlert, {}), _jsxs("div", { className: "fui-error__body", children: [_jsx("strong", { className: "fui-error__title", children: title }), _jsx("span", { className: "fui-error__message", children: message }), action && _jsx("div", { className: "fui-error__action", children: action })] })] }));
}
/** Centered placeholder for an empty list or view. */
export function EmptyState({ title, description, icon = _jsx(Inbox, {}), action, className }) {
    return (_jsxs("div", { className: cx("fui-empty", className), children: [_jsx("span", { className: "fui-empty__icon", children: icon }), _jsx("strong", { className: "fui-empty__title", children: title }), description && _jsx("p", { className: "fui-empty__description", children: description }), action && _jsx("div", { className: "fui-empty__action", children: action })] }));
}
const CALLOUT_ICONS = { info: _jsx(Info, {}), warning: _jsx(TriangleAlert, {}), neutral: _jsx(Info, {}) };
/** Always-visible note in the workspace highlight palette, e.g. how a form behaves. */
export function Callout({ tone = "info", icon, children, className }) {
    const shown = icon === undefined ? CALLOUT_ICONS[tone] : icon;
    return (_jsxs("div", { "data-tone": tone, className: cx("fui-callout", className), children: [shown && _jsx("span", { className: "fui-callout__icon", children: shown }), _jsx("div", { className: "fui-callout__text", children: children })] }));
}
