import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// Tabs on Radix in two looks: Fibery's segmented switch ("Workspace / Personal") and underlined page tabs,
// plus SegmentedControl — the same segmented look for picking a value (filters) rather than switching panels — and
// SegmentedToggles, the same look with options toggled on and off independently.
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
            return (_jsx("button", { type: "button", role: "radio", "aria-checked": active, tabIndex: active ? 0 : -1, "data-value": option.value, "data-variant": "segmented", "data-state": active ? "active" : "inactive", "data-filled": (scale === "from" ? index >= selectedIndex : scale && index <= selectedIndex) ? "" : undefined, className: "fui-tabs-trigger", onClick: () => onValueChange(option.value), children: option.label }, option.value));
        }) }));
    return label ? (_jsxs("div", { className: cx("fui-segmented-field", className), children: [_jsx("span", { className: "fui-segmented-field__label", children: label }), group] })) : (group);
}
/**
 * SegmentedControl's look with independent toggles: each option turns on and off by itself and is filled while on,
 * e.g. a filter that shows any combination of levels. Every option may be off; what that means is up to the caller.
 */
export function SegmentedToggles({ options, value, onValueChange, label, className, ...props }) {
    const toggle = (option) => onValueChange(options.map((o) => o.value).filter((v) => (v === option ? !value.includes(v) : value.includes(v))));
    const group = (_jsx("div", { role: "group", "aria-label": props["aria-label"], "data-variant": "segmented", "data-scale": "", className: cx("fui-tabs-list", !label && className), children: options.map((option) => {
            const on = value.includes(option.value);
            return (_jsx("button", { type: "button", "aria-pressed": on, "data-variant": "segmented", "data-filled": on ? "" : undefined, className: "fui-tabs-trigger", onClick: () => toggle(option.value), children: option.label }, option.value));
        }) }));
    return label ? (_jsxs("div", { className: cx("fui-segmented-field", className), children: [_jsx("span", { className: "fui-segmented-field__label", children: label }), group] })) : (group);
}
