import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// Select built on Radix: input-styled trigger and a Fibery-style popup menu (radius 8px, 32px rows).
import { forwardRef } from "react";
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
