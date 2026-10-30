import { type ComponentPropsWithoutRef, type ReactNode } from "react";
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
export type TabsContentProps = ComponentPropsWithoutRef<typeof TabsPrimitive.Content> & {
    /** Keep the panel mounted while hidden, so its state (filters, selection, scroll) survives tab switches. */
    keepMounted?: boolean;
};
export declare const TabsContent: import("react").ForwardRefExoticComponent<Omit<TabsPrimitive.TabsContentProps & import("react").RefAttributes<HTMLDivElement>, "ref"> & {
    /** Keep the panel mounted while hidden, so its state (filters, selection, scroll) survives tab switches. */
    keepMounted?: boolean;
} & import("react").RefAttributes<HTMLDivElement>>;
export type SegmentedOption<T extends string> = {
    value: T;
    label: ReactNode;
};
export type SegmentedControlProps<T extends string> = {
    options: SegmentedOption<T>[];
    value: T;
    onValueChange: (value: T) => void;
    /** Describes the choice for screen readers, e.g. "Minimum level". */
    "aria-label"?: string;
    /** Ordered scale: every option up to and including the selected one is filled, like a level meter. */
    scale?: boolean;
    /** Muted caption inside an input-styled frame, like MultiSelect's: lines the control up with filter pickers. */
    label?: ReactNode;
    className?: string;
};
/**
 * Single-choice segmented switch (radio group), 28px high to line up with small inputs.
 * Arrow keys move the selection, like native radio buttons.
 */
export declare function SegmentedControl<T extends string>({ options, value, onValueChange, scale, label, className, ...props }: SegmentedControlProps<T>): import("react").JSX.Element;
export {};
