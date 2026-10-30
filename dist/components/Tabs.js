import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// Tabs on Radix in two looks: Fibery's segmented switch ("Workspace / Personal") and underlined page tabs,
// plus SegmentedControl — the same segmented look for picking a value (filters) rather than switching panels.
import { createContext, forwardRef, useContext, } from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cx } from "../cx";
export const Tabs = TabsPrimitive.Root;
const VariantContext = createContext("segmented");
/** Row of tab triggers; `variant` styles the whole row. */
export const TabsList = forwardRef(({ variant = "segmented", className, ...props }, ref) => (_jsx(VariantContext.Provider, { value: variant, children: _jsx(TabsPrimitive.List, { ref: ref, "data-variant": variant, className: cx("fui-tabs-list", className), ...props }) })));
TabsList.displayName = "TabsList";
export const TabsTrigger = forwardRef(({ className, ...props }, ref) => (_jsx(TabsPrimitive.Trigger, { ref: ref, "data-variant": useContext(VariantContext), className: cx("fui-tabs-trigger", className), ...props })));
TabsTrigger.displayName = "TabsTrigger";
export const TabsContent = forwardRef(({ keepMounted, className, ...props }, ref) => (_jsx(TabsPrimitive.Content, { ref: ref, forceMount: keepMounted || undefined, className: cx("fui-tabs-content", className), ...props })));
TabsContent.displayName = "TabsContent";
/**
 * Single-choice segmented switch (radio group), 28px high to line up with small inputs.
 * Arrow keys move the selection, like native radio buttons.
 */
export function SegmentedControl({ options, value, onValueChange, scale, label, className, ...props }) {
    const selectedIndex = options.findIndex((o) => o.value === value);
    const onKeyDown = (e) => {
        const step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
        if (!step)
            return;
        e.preventDefault();
        const next = options[(selectedIndex + step + options.length) % options.length];
        onValueChange(next.value);
        e.currentTarget.querySelector(`[data-value="${CSS.escape(next.value)}"]`)?.focus();
    };
    const group = (_jsx("div", { role: "radiogroup", "aria-label": props["aria-label"], "data-variant": "segmented", "data-scale": scale ? "" : undefined, className: cx("fui-tabs-list", !label && className), onKeyDown: onKeyDown, children: options.map((option, index) => {
            const active = option.value === value;
            return (_jsx("button", { type: "button", role: "radio", "aria-checked": active, tabIndex: active ? 0 : -1, "data-value": option.value, "data-variant": "segmented", "data-state": active ? "active" : "inactive", "data-filled": scale && index <= selectedIndex ? "" : undefined, className: "fui-tabs-trigger", onClick: () => onValueChange(option.value), children: option.label }, option.value));
        }) }));
    return label ? (_jsxs("div", { className: cx("fui-segmented-field", className), children: [_jsx("span", { className: "fui-segmented-field__label", children: label }), group] })) : (group);
}
