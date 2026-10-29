import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// Select built on Radix: input-styled trigger and a Fibery-style popup menu (radius 8px, 32px rows).
// MultiSelect is its several-values sibling for filters, on a dropdown menu with checkable rows.
import { forwardRef } from "react";
import * as DropdownPrimitive from "@radix-ui/react-dropdown-menu";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { cx } from "../cx";
export const Select = SelectPrimitive.Root;
export const SelectGroup = SelectPrimitive.Group;
export const SelectValue = SelectPrimitive.Value;
/** Input-styled button that opens the select; put a `<SelectValue placeholder="…" />` inside. */
export const SelectTrigger = forwardRef(({ size = "md", invalid, className, children, ...props }, ref) => (_jsxs(SelectPrimitive.Trigger, { ref: ref, "data-size": size, "aria-invalid": invalid || undefined, className: cx("fui-input fui-select-trigger", className), ...props, children: [_jsx("span", { className: "fui-select-trigger__value", children: children }), _jsx(SelectPrimitive.Icon, { asChild: true, children: _jsx(ChevronDown, {}) })] })));
SelectTrigger.displayName = "SelectTrigger";
/** Popup list, at least as wide as the trigger. */
export const SelectContent = forwardRef(({ className, children, position = "popper", sideOffset = 4, ...props }, ref) => (_jsx(SelectPrimitive.Portal, { children: _jsx(SelectPrimitive.Content, { ref: ref, position: position, sideOffset: sideOffset, className: cx("fui-popup fui-select-content", className), ...props, children: _jsx(SelectPrimitive.Viewport, { className: "fui-select-viewport", children: children }) }) })));
SelectContent.displayName = "SelectContent";
/** Option row with a check mark when selected. Children may start with an icon or EnumBadge. */
export const SelectItem = forwardRef(({ className, children, ...props }, ref) => (_jsxs(SelectPrimitive.Item, { ref: ref, className: cx("fui-menu-item", className), ...props, children: [_jsx(SelectPrimitive.ItemText, { children: children }), _jsx(SelectPrimitive.ItemIndicator, { className: "fui-menu-item__check", children: _jsx(Check, {}) })] })));
SelectItem.displayName = "SelectItem";
/** Muted group caption inside SelectContent. */
export const SelectLabel = forwardRef(({ className, ...props }, ref) => _jsx(SelectPrimitive.Label, { ref: ref, className: cx("fui-menu-label", className), ...props }));
SelectLabel.displayName = "SelectLabel";
export const SelectSeparator = forwardRef(({ className, ...props }, ref) => _jsx(SelectPrimitive.Separator, { ref: ref, className: cx("fui-menu-separator", className), ...props }));
SelectSeparator.displayName = "SelectSeparator";
/**
 * Filter picker for several values: an input-styled trigger "Label: first value +N" and a menu of checkable rows
 * that stays open while toggling. An empty selection means "no filter".
 */
export function MultiSelect({ label, options, value, onValueChange, placeholder = "Все", clearLabel = "Сбросить", size = "md", className, "aria-label": ariaLabel, }) {
    const selected = options.filter((o) => value.includes(o.value));
    const toggle = (option, checked) => onValueChange(checked ? [...value, option] : value.filter((v) => v !== option));
    return (_jsxs(DropdownPrimitive.Root, { children: [_jsxs(DropdownPrimitive.Trigger, { "data-size": size, "data-placeholder": selected.length === 0 ? "" : undefined, "aria-label": ariaLabel, className: cx("fui-input fui-select-trigger fui-multiselect", className), children: [_jsxs("span", { className: "fui-select-trigger__value", children: [_jsx("span", { className: "fui-multiselect__label", children: label }), selected.length === 0 ? (placeholder) : (_jsxs(_Fragment, { children: [selected[0].label, selected.length > 1 && _jsxs("span", { className: "fui-multiselect__more", children: ["+", selected.length - 1] })] }))] }), _jsx(ChevronDown, {})] }), _jsx(DropdownPrimitive.Portal, { children: _jsxs(DropdownPrimitive.Content, { sideOffset: 4, align: "start", className: "fui-popup fui-menu", children: [options.map((o) => (_jsxs(DropdownPrimitive.CheckboxItem, { className: "fui-menu-item", checked: value.includes(o.value), onCheckedChange: (checked) => toggle(o.value, checked === true), 
                            // Keep the menu open: a filter is usually several clicks.
                            onSelect: (e) => e.preventDefault(), children: [_jsx("span", { className: "fui-menu-item__text", children: o.label }), _jsx(DropdownPrimitive.ItemIndicator, { className: "fui-menu-item__check", children: _jsx(Check, {}) })] }, o.value))), selected.length > 0 && (_jsxs(_Fragment, { children: [_jsx(DropdownPrimitive.Separator, { className: "fui-menu-separator" }), _jsx(DropdownPrimitive.Item, { className: "fui-menu-item", onSelect: () => onValueChange([]), children: _jsx("span", { className: "fui-menu-item__text", children: clearLabel }) })] }))] }) })] }));
}
