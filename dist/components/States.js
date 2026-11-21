import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { CircleAlert, Inbox, Info, RotateCw, TriangleAlert } from "lucide-react";
import { cx } from "../cx";
import { friendlyErrorMessage } from "../errors";
import { Button } from "./Button";
import { useKitLang, useKitTexts } from "./KitLang";
/** Indeterminate spinner: 12 / 16 / 24px. */
export function Spinner({ size = "md", className }) {
    return _jsx("span", { "aria-hidden": true, "data-size": size, className: cx("fui-spinner", className) });
}
/** Pulsing placeholder block; size it with `className` or `style`. */
export function Skeleton({ className, ...props }) {
    return _jsx("div", { "aria-hidden": true, className: cx("fui-skeleton", className), ...props });
}
// Line widths shrink a little from row to row, so the placeholder reads as a list rather than a stamp.
const ROW_SHRINK = [1, 0.82, 0.92, 0.7, 0.88];
/** Placeholder rows in the shape of the list that is loading: same height, columns and line count as the real rows. */
export function SkeletonRows({ rows = 5, height = 36, lead, lines = [[160]], trail, divided = true, label, className }) {
    const t = useKitTexts();
    return (_jsxs("div", { role: "status", "data-divided": divided ? "" : undefined, className: cx("fui-skeleton-rows", className), children: [_jsx("span", { className: "fui-visually-hidden", children: label ?? t.loading }), Array.from({ length: rows }, (_, row) => {
                const k = ROW_SHRINK[row % ROW_SHRINK.length];
                return (_jsxs("div", { className: "fui-skeleton-rows__row", style: { height }, children: [lead != null && _jsx(Skeleton, { className: "fui-skeleton-rows__block", style: { width: lead } }), _jsx("div", { className: "fui-skeleton-rows__lines", children: lines.map((blocks, i) => (_jsx("div", { className: "fui-skeleton-rows__line", children: blocks.map((w, j) => (_jsx(Skeleton, { className: "fui-skeleton-rows__block", style: { width: Math.round(w * k) } }, j))) }, i))) }), trail?.map((w, j) => _jsx(Skeleton, { className: "fui-skeleton-rows__block", style: { width: w } }, j))] }, row));
            })] }));
}
/** Spinner with a caption, «Загрузка…» / "Loading…" by default. */
export function LoadingState({ children, className }) {
    const t = useKitTexts();
    return (_jsxs("div", { role: "status", className: cx("fui-state", className), children: [_jsx(Spinner, {}), children ?? t.loading] }));
}
/**
 * Error box. For transient failures (Fibery unavailable, rate limit, no connection) it explains them in plain
 * words; the underlying message is always shown too, small and muted under that text: Fibery API errors carry
 * the exact diagnostic needed to report the problem.
 */
export function ErrorState({ error, title, onRetry, retrying, action, className }) {
    const lang = useKitLang();
    const t = useKitTexts();
    const message = error instanceof Error ? error.message : String(error);
    const friendly = friendlyErrorMessage(error, lang);
    return (_jsxs("div", { role: "alert", className: cx("fui-error", className), children: [_jsx(CircleAlert, {}), _jsxs("div", { className: "fui-error__body", children: [_jsx("strong", { className: "fui-error__title", children: title ?? t.loadFailed }), friendly && _jsx("span", { className: "fui-error__text", children: friendly }), _jsx("span", { className: "fui-error__message", "data-muted": friendly ? "" : undefined, children: message }), (onRetry || action) && (_jsxs("div", { className: "fui-error__action", children: [onRetry && (_jsx(Button, { variant: "outline", size: "sm", icon: _jsx(RotateCw, {}), loading: retrying, onClick: onRetry, children: t.retry })), action] }))] })] }));
}
/** Centered placeholder for an empty list or view. */
export function EmptyState({ title, description, icon = _jsx(Inbox, {}), action, className }) {
    return (_jsxs("div", { className: cx("fui-empty", className), children: [_jsx("span", { className: "fui-empty__icon", children: icon }), _jsx("strong", { className: "fui-empty__title", children: title }), description && _jsx("p", { className: "fui-empty__description", children: description }), action && _jsx("div", { className: "fui-empty__action", children: action })] }));
}
const CALLOUT_ICONS = { info: _jsx(Info, {}), warning: _jsx(TriangleAlert, {}), error: _jsx(CircleAlert, {}), neutral: _jsx(Info, {}), plain: _jsx(Info, {}) };
/** Always-visible note in the workspace highlight palette, e.g. how a form behaves. */
export function Callout({ tone = "info", icon, children, className }) {
    const shown = icon === undefined ? CALLOUT_ICONS[tone] : icon;
    return (_jsxs("div", { "data-tone": tone, className: cx("fui-callout", className), children: [shown && _jsx("span", { className: "fui-callout__icon", children: shown }), _jsx("div", { className: "fui-callout__text", children: children })] }));
}
/**
 * Compact warning above a screen whose background refetch failed. The data already on screen stays usable (it may
 * only be stale), so a full-screen ErrorState would hide it for nothing; ErrorState is for screens with no data yet.
 * Shows the plain-words reason, a retry button, and the raw message (clamped: a gateway error may carry a whole page).
 */
export function RefreshWarning({ error, onRetry, retrying, title, className }) {
    const lang = useKitLang();
    const t = useKitTexts();
    const message = error instanceof Error ? error.message : String(error);
    const friendly = friendlyErrorMessage(error, lang);
    return (_jsxs(Callout, { tone: "warning", className: cx("fui-refresh-warning", className), children: [_jsxs("div", { className: "fui-refresh-warning__row", children: [_jsxs("span", { children: [title ?? t.refreshFailed, friendly && ` ${friendly}`] }), _jsx(Button, { variant: "outline", size: "sm", icon: _jsx(RotateCw, {}), loading: retrying, onClick: onRetry, children: t.retry })] }), _jsx("div", { className: "fui-refresh-warning__message", title: message, children: message })] }));
}
