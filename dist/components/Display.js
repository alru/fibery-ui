import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// Content building blocks modeled on Fibery entity pages: avatar, card, relation-style list rows, property list.
import { forwardRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cx } from "../cx";
const initials = (name) => name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
/** Round avatar, 20 / 24 / 32px; falls back to initials. */
export function Avatar({ name, src, size = "md", className }) {
    return (_jsx("span", { "data-size": size, className: cx("fui-avatar", className), title: name, children: src ? _jsx("img", { src: src, alt: name }) : initials(name) }));
}
/** Surface with Fibery's card ring and soft shadow, radius 8px. */
export const Card = forwardRef(({ interactive, className, ...props }, ref) => (_jsx("div", { ref: ref, "data-interactive": interactive ? "" : undefined, className: cx("fui-card", className), ...props })));
Card.displayName = "Card";
/** Card title row with optional description and actions. */
export function CardHeader({ title, description, actions, className, ...props }) {
    return (_jsxs("div", { className: cx("fui-card__header", className), ...props, children: [_jsxs("div", { className: "fui-card__heading", children: [_jsx("h3", { className: "fui-card__title", children: title }), description && _jsx("p", { className: "fui-card__description", children: description })] }), actions && _jsx("div", { className: "fui-card__actions", children: actions })] }));
}
/** Padded card body. */
export function CardContent({ className, ...props }) {
    return _jsx("div", { className: cx("fui-card__content", className), ...props });
}
/** Vertical stack of ListItem rows. */
export const List = forwardRef(({ className, ...props }, ref) => (_jsx("ul", { ref: ref, className: cx("fui-list", className), ...props })));
List.displayName = "List";
/** Row in the style of Fibery relation lists: ringed, radius 6px, single-line text with ellipsis. */
export const ListItem = forwardRef(({ leading, trailing, onClick, multiline, selected, className, children, ...props }, ref) => {
    const onKeyDown = (e) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClick?.();
        }
    };
    return (_jsxs("li", { ref: ref, "data-multiline": multiline ? "" : undefined, "data-selected": selected ? "" : undefined, className: cx("fui-list-item", className), ...(onClick && { role: "button", tabIndex: 0, onClick, onKeyDown, "aria-pressed": selected, "data-interactive": "" }), ...props, children: [leading, _jsx("span", { className: "fui-list-item__main", children: children }), trailing && _jsx("span", { className: "fui-list-item__trailing", children: trailing })] }));
});
ListItem.displayName = "ListItem";
/** Two-column label/value grid, like the field list on a Fibery entity page. */
export const PropertyList = forwardRef(({ className, ...props }, ref) => (_jsx("dl", { ref: ref, className: cx("fui-properties", className), ...props })));
PropertyList.displayName = "PropertyList";
/** One row of a PropertyList. */
export function Property({ label, icon, children }) {
    return (_jsxs(_Fragment, { children: [_jsxs("dt", { className: "fui-property__label", children: [icon, label] }), _jsx("dd", { className: "fui-property__value", children: children })] }));
}
/**
 * Titled block of a details card ("Работа", "Контакты"): a bold title with an icon, a hairline above every group but
 * the first, and denser property rows with smaller muted labels, so groups read apart at a glance. With
 * `collapsible`, the header becomes a toggle with a chevron on the right.
 */
export function PropertyGroup({ title, icon, actions, children, collapsible, open: openProp, onOpenChange, defaultOpen = true, className, }) {
    const [ownOpen, setOwnOpen] = useState(defaultOpen);
    const open = !collapsible || (openProp ?? ownOpen);
    const toggle = () => {
        setOwnOpen(!open);
        onOpenChange?.(!open);
    };
    const heading = (_jsxs(_Fragment, { children: [icon, title] }));
    return (_jsxs("section", { className: cx("fui-property-group", className), "data-collapsed": open ? undefined : "", children: [_jsxs("div", { className: "fui-property-group__header", children: [_jsx("h3", { className: "fui-property-group__title", children: collapsible ? (_jsxs("button", { type: "button", className: "fui-property-group__toggle", "aria-expanded": open, onClick: toggle, children: [_jsx("span", { className: "fui-property-group__heading", children: heading }), _jsx(ChevronDown, { className: "fui-property-group__chevron", "aria-hidden": true })] })) : (heading) }), actions && _jsx("div", { className: "fui-property-group__actions", children: actions })] }), open && children] }));
}
