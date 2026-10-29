import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cx } from "../cx";
/** Page title in Fibery's entity-title size (30px / 600) with optional actions on the right. */
export function PageHeader({ title, description, eyebrow, actions, className }) {
    return (_jsxs("header", { className: cx("fui-page-header", className), children: [_jsxs("div", { className: "fui-page-header__heading", children: [eyebrow && _jsx("div", { className: "fui-page-header__eyebrow", children: eyebrow }), _jsx("h1", { className: "fui-page-header__title", children: title }), description && _jsx("p", { className: "fui-page-header__description", children: description })] }), actions && _jsx("div", { className: "fui-page-header__actions", children: actions })] }));
}
/** Muted section label like "Skills" above a relation list on a Fibery entity page. */
export function SectionHeader({ title, icon, count, actions, className }) {
    return (_jsxs("div", { className: cx("fui-section-header", className), children: [_jsxs("h2", { className: "fui-section-header__title", children: [icon, title, count != null && _jsx("span", { className: "fui-section-header__count", children: count })] }), actions && _jsx("div", { className: "fui-section-header__actions", children: actions })] }));
}
/** Hairline divider. */
export function Separator({ orientation = "horizontal", className, ...props }) {
    return (_jsx("div", { role: "separator", "aria-orientation": orientation, "data-orientation": orientation, className: cx("fui-separator", className), ...props }));
}
