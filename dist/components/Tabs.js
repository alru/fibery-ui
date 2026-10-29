import { jsx as _jsx } from "react/jsx-runtime";
// Tabs on Radix in two looks: Fibery's segmented switch ("Workspace / Personal") and underlined page tabs.
import { createContext, forwardRef, useContext } from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cx } from "../cx";
export const Tabs = TabsPrimitive.Root;
const VariantContext = createContext("segmented");
/** Row of tab triggers; `variant` styles the whole row. */
export const TabsList = forwardRef(({ variant = "segmented", className, ...props }, ref) => (_jsx(VariantContext.Provider, { value: variant, children: _jsx(TabsPrimitive.List, { ref: ref, "data-variant": variant, className: cx("fui-tabs-list", className), ...props }) })));
TabsList.displayName = "TabsList";
export const TabsTrigger = forwardRef(({ className, ...props }, ref) => (_jsx(TabsPrimitive.Trigger, { ref: ref, "data-variant": useContext(VariantContext), className: cx("fui-tabs-trigger", className), ...props })));
TabsTrigger.displayName = "TabsTrigger";
export const TabsContent = forwardRef(({ className, ...props }, ref) => _jsx(TabsPrimitive.Content, { ref: ref, className: cx("fui-tabs-content", className), ...props }));
TabsContent.displayName = "TabsContent";
