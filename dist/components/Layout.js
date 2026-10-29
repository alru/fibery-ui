import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { X } from "lucide-react";
import { cx } from "../cx";
import { IconButton } from "./Button";
/** Page title in Fibery's entity-title size (30px / 600) with optional actions on the right. */
export function PageHeader({ title, description, eyebrow, actions, className }) {
    return (_jsxs("header", { className: cx("fui-page-header", className), children: [_jsxs("div", { className: "fui-page-header__heading", children: [eyebrow && _jsx("div", { className: "fui-page-header__eyebrow", children: eyebrow }), _jsx("h1", { className: "fui-page-header__title", children: title }), description && _jsx("p", { className: "fui-page-header__description", children: description })] }), actions && _jsx("div", { className: "fui-page-header__actions", children: actions })] }));
}
/** Muted section label like "Skills" above a relation list on a Fibery entity page. */
export function SectionHeader({ title, icon, count, actions, className }) {
    return (_jsxs("div", { className: cx("fui-section-header", className), children: [_jsxs("h2", { className: "fui-section-header__title", children: [icon, title, count != null && _jsx("span", { className: "fui-section-header__count", children: count })] }), actions && _jsx("div", { className: "fui-section-header__actions", children: actions })] }));
}
/**
 * Details panel next to a list (master–detail): header with title and actions, scrollable body.
 * Position and width come from the parent layout, e.g. `className="sticky top-6 flex-1"`.
 */
export function SidePanel({ title, description, actions, onClose, className, children, ...props }) {
    const onKeyDown = (e) => {
        if (e.key === "Escape" && onClose) {
            e.stopPropagation();
            onClose();
        }
    };
    return (_jsxs("aside", { className: cx("fui-side-panel", className), onKeyDown: onKeyDown, ...props, children: [_jsxs("header", { className: "fui-side-panel__header", children: [_jsxs("div", { className: "fui-side-panel__heading", children: [_jsx("h2", { className: "fui-side-panel__title", children: title }), description && _jsx("p", { className: "fui-side-panel__description", children: description })] }), _jsxs("div", { className: "fui-side-panel__actions", children: [actions, onClose && _jsx(IconButton, { icon: _jsx(X, {}), "aria-label": "\u0417\u0430\u043A\u0440\u044B\u0442\u044C", size: "sm", onClick: onClose })] })] }), _jsx("div", { className: "fui-side-panel__body", children: children })] }));
}
/** Hairline divider. */
export function Separator({ orientation = "horizontal", className, ...props }) {
    return (_jsx("div", { role: "separator", "aria-orientation": orientation, "data-orientation": orientation, className: cx("fui-separator", className), ...props }));
}
