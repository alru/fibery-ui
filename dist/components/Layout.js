import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ChevronRight, X } from "lucide-react";
import { cx } from "../cx";
import { Button, IconButton } from "./Button";
import { useKitTexts } from "./KitLang";
/** Page title in Fibery's entity-title size (30px / 600) with optional actions on the right. */
export function PageHeader({ title, description, eyebrow, actions, className }) {
    return (_jsxs("header", { className: cx("fui-page-header", className), children: [_jsxs("div", { className: "fui-page-header__heading", children: [eyebrow && _jsx("div", { className: "fui-page-header__eyebrow", children: eyebrow }), _jsx("h1", { className: "fui-page-header__title", children: title }), description && _jsx("p", { className: "fui-page-header__description", children: description })] }), actions && _jsx("div", { className: "fui-page-header__actions", children: actions })] }));
}
/**
 * Section label above a list: muted like "Skills" on a Fibery entity page, or strong with a hued icon plate and a
 * collapse chevron for the sections of a worklist.
 */
export function SectionHeader({ title, icon, count, actions, tone = "muted", iconHue, collapsible, open = true, onOpenChange, id, "aria-controls": controls, className, }) {
    const heading = (_jsxs(_Fragment, { children: [icon && iconHue ? (_jsx("span", { className: "fui-section-header__plate", "data-hue": iconHue, children: icon })) : (icon), title, count != null && _jsx("span", { className: "fui-section-header__count", children: count })] }));
    return (_jsxs("div", { id: id, "data-tone": tone, className: cx("fui-section-header", className), children: [_jsx("h2", { className: "fui-section-header__title", children: collapsible ? (_jsxs("button", { type: "button", className: "fui-section-header__toggle", "aria-expanded": open, "aria-controls": controls, onClick: () => onOpenChange?.(!open), children: [_jsx(ChevronRight, { className: "fui-section-header__chevron", "aria-hidden": true }), heading] })) : (heading) }), actions && _jsx("div", { className: "fui-section-header__actions", children: actions })] }));
}
/**
 * Row under a list cut short: «Показано 15 из 37» / "Showing 15 of 37" (fixed width, tabular digits) and
 * «Показать все» / "Show all".
 */
export function ShowMore({ shown, total, onShowAll, className }) {
    const t = useKitTexts();
    if (shown >= total)
        return null;
    return (_jsxs("div", { className: cx("fui-show-more", className), children: [_jsx("span", { className: "fui-show-more__count", children: t.shownOf(shown, total) }), _jsx(Button, { variant: "ghost", size: "sm", onClick: onShowAll, children: t.showAll })] }));
}
/**
 * Details panel next to a list (master–detail): header with title and actions, scrollable body.
 * Position and width come from the parent layout, e.g. `className="sticky top-6 flex-1"`.
 */
export function SidePanel({ title, description, actions, onClose, editing, className, children, ...props }) {
    const t = useKitTexts();
    const onKeyDown = (e) => {
        if (e.key === "Escape" && onClose) {
            e.stopPropagation();
            onClose();
        }
    };
    return (_jsxs("aside", { "data-editing": editing ? "" : undefined, className: cx("fui-side-panel", className), onKeyDown: onKeyDown, ...props, children: [_jsxs("header", { className: "fui-side-panel__header", children: [_jsxs("div", { className: "fui-side-panel__heading", children: [_jsx("h2", { className: "fui-side-panel__title", children: title }), description && _jsx("p", { className: "fui-side-panel__description", children: description })] }), _jsxs("div", { className: "fui-side-panel__actions", children: [actions, onClose && _jsx(IconButton, { icon: _jsx(X, {}), "aria-label": t.close, size: "sm", onClick: onClose })] })] }), _jsx("div", { className: "fui-side-panel__body", children: children })] }));
}
/**
 * List + details panel. Wide (≥ 1024px): side by side, the panel's own classes set its width and stickiness.
 * Narrow: both don't fit, so the panel floats over the list on the right and the list stays behind a veil;
 * clicking the veil calls `onDismiss`.
 */
export function PanelLayout({ children, panel, onDismiss, className }) {
    return (_jsxs("div", { className: cx("fui-panel-layout", className), "data-open": panel ? "" : undefined, children: [_jsx("div", { className: "fui-panel-layout__main", children: children }), panel && (_jsxs(_Fragment, { children: [_jsx("div", { className: "fui-panel-layout__veil", "aria-hidden": true, onClick: onDismiss }), _jsx("div", { className: "fui-panel-layout__panel", children: panel })] }))] }));
}
/** Raised block that sets one item apart inside a card, e.g. a record's key field together with its description. */
export function Inset({ footer, className, children, ...props }) {
    return (_jsxs("div", { className: cx("fui-inset", className), ...props, children: [children, footer != null && footer !== false && _jsx("div", { className: "fui-inset__footer", children: footer })] }));
}
/** Hairline divider; with `label`, a captioned one ("На английском ————"); `tone="alert"` makes it the "now" line. */
export function Separator({ orientation = "horizontal", label, tone = "default", as: Tag = "div", className, ...props }) {
    const tint = tone === "alert" ? "alert" : undefined;
    if (label != null) {
        return (_jsxs(Tag, { "data-tone": tint, className: cx("fui-separator-labeled", className), ...props, children: [_jsx("span", { className: "fui-separator-labeled__text", children: label }), _jsx("div", { role: "separator", "aria-orientation": "horizontal", "data-orientation": "horizontal", className: "fui-separator" })] }));
    }
    return (_jsx(Tag, { role: "separator", "aria-orientation": orientation, "data-orientation": orientation, "data-tone": tint, className: cx("fui-separator", className), ...props }));
}
