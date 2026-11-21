import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// Content building blocks modeled on Fibery entity pages: avatar, card, list rows (Fibery relation rows or divided
// worklist rows with an actions column), property list.
import { createContext, forwardRef, useContext, useState, } from "react";
import { ChevronDown, Plus } from "lucide-react";
import { cx } from "../cx";
import { Button, IconButton } from "./Button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, Tooltip } from "./Overlay";
import { Spinner } from "./States";
import { useKitTexts } from "./KitLang";
const initials = (name) => name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
/** Round avatar, 20 / 24 / 32px; falls back to initials. */
export function Avatar({ name, src, size = "md", hue, className }) {
    return (_jsx("span", { "data-size": size, "data-hue": hue, className: cx("fui-avatar", className), title: name, children: src ? _jsx("img", { src: src, alt: name }) : initials(name) }));
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
export const List = forwardRef(({ variant = "default", className, ...props }, ref) => (_jsx("ul", { ref: ref, "data-variant": variant, className: cx("fui-list", className), ...props })));
List.displayName = "List";
const stopEvent = (e) => e.stopPropagation();
/**
 * Row in the style of Fibery relation lists: ringed, radius 6px, single-line text with ellipsis; inside
 * `<List variant="divided">`, a flat worklist row.
 */
export const ListItem = forwardRef(({ leading, trailing, onClick, multiline, selected, actions, actionSlots, actionsVisible, busy, className, children, ...props }, ref) => {
    const onKeyDown = (e) => {
        // Enter on a control inside the row belongs to that control.
        if (e.target !== e.currentTarget)
            return;
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClick?.();
        }
    };
    return (_jsxs("li", { ref: ref, "data-multiline": multiline ? "" : undefined, "data-selected": selected ? "" : undefined, "aria-busy": busy || undefined, className: cx("fui-list-item", className), ...(onClick && { role: "button", tabIndex: 0, onClick, onKeyDown, "aria-pressed": selected, "data-interactive": "" }), ...props, children: [leading, _jsx("span", { className: "fui-list-item__main", children: children }), trailing && _jsx("span", { className: "fui-list-item__trailing", children: trailing }), actions && (_jsx("span", { className: "fui-list-item__actions", "data-visible": actionsVisible ? "" : undefined, style: { "--fui-action-slots": Math.max(actionSlots ?? 0, actions.length) }, onClick: stopEvent, onKeyDown: stopEvent, children: _jsx("fieldset", { className: "fui-list-item__action-set", disabled: busy, children: actions.map((action, i) => (_jsx("span", { className: "fui-list-item__action", "data-main": i === 0 ? "" : undefined, children: i === 0 && busy ? _jsx(Spinner, { size: "sm" }) : action }, i))) }) }))] }));
});
ListItem.displayName = "ListItem";
/**
 * Icon-only verb for a ListItem's `actions`: a small ghost IconButton with a tooltip. Also works as a menu trigger
 * (`<DropdownMenuTrigger asChild><RowAction … /></DropdownMenuTrigger>`).
 */
export const RowAction = forwardRef(({ label, ...props }, ref) => (_jsx(Tooltip, { content: label, children: _jsx(IconButton, { ref: ref, "aria-label": label, size: "sm", ...props }) })));
RowAction.displayName = "RowAction";
const HideEmptyContext = createContext(false);
/** Two-column label/value grid, like the field list on a Fibery entity page. */
export const PropertyList = forwardRef(({ hideEmpty = false, className, ...props }, ref) => (_jsx(HideEmptyContext.Provider, { value: hideEmpty, children: _jsx("dl", { ref: ref, className: cx("fui-properties", className), ...props }) })));
PropertyList.displayName = "PropertyList";
const isBlank = (node) => node == null || node === false || node === "" || (Array.isArray(node) && node.every(isBlank));
/** One row of a PropertyList. */
export function Property({ label, icon, empty, children }) {
    const hideEmpty = useContext(HideEmptyContext);
    if (hideEmpty && (empty ?? isBlank(children)))
        return null;
    return (_jsxs(_Fragment, { children: [_jsxs("dt", { className: "fui-property__label", children: [icon, label] }), _jsx("dd", { className: "fui-property__value", children: children })] }));
}
/** «+ Поле» / "+ Field" button with a menu of the empty fields, e.g. in a PropertyGroup's `actions`. */
export function PropertyAdd({ fields, onAdd, label, className }) {
    const t = useKitTexts();
    if (fields.length === 0)
        return null;
    return (_jsxs(DropdownMenu, { children: [_jsx(DropdownMenuTrigger, { asChild: true, children: _jsx(Button, { variant: "ghost", size: "sm", icon: _jsx(Plus, {}), className: className, children: label ?? t.addField }) }), _jsx(DropdownMenuContent, { align: "end", children: fields.map((f) => (_jsx(DropdownMenuItem, { icon: f.icon, onSelect: () => onAdd(f.id), children: f.label }, f.id))) })] }));
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
