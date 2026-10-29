import { type ComponentPropsWithoutRef } from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
export declare const Tabs: import("react").ForwardRefExoticComponent<TabsPrimitive.TabsProps & import("react").RefAttributes<HTMLDivElement>>;
type TabsVariant = "segmented" | "line";
export type TabsListProps = ComponentPropsWithoutRef<typeof TabsPrimitive.List> & {
    variant?: TabsVariant;
};
/** Row of tab triggers; `variant` styles the whole row. */
export declare const TabsList: import("react").ForwardRefExoticComponent<Omit<TabsPrimitive.TabsListProps & import("react").RefAttributes<HTMLDivElement>, "ref"> & {
    variant?: TabsVariant;
} & import("react").RefAttributes<HTMLDivElement>>;
export declare const TabsTrigger: import("react").ForwardRefExoticComponent<Omit<TabsPrimitive.TabsTriggerProps & import("react").RefAttributes<HTMLButtonElement>, "ref"> & import("react").RefAttributes<HTMLButtonElement>>;
export declare const TabsContent: import("react").ForwardRefExoticComponent<Omit<TabsPrimitive.TabsContentProps & import("react").RefAttributes<HTMLDivElement>, "ref"> & import("react").RefAttributes<HTMLDivElement>>;
export {};
