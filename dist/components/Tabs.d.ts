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
    /**
     * Ordered scale. `true`: every option up to and including the selected one is filled, like a level meter.
     * `"from"`: the selected option and every one after it are filled, like a threshold filter ("D and up" with options
     * D, C, B, A fills all four; "A" fills one).
     */
    scale?: boolean | "from";
    /** Muted caption inside an input-styled frame, like MultiSelect's: lines the control up with filter pickers. */
    label?: ReactNode;
    className?: string;
};
/**
 * Single-choice segmented switch (radio group), 28px high to line up with small inputs.
 * Arrow keys move the selection, like native radio buttons.
 */
export declare function SegmentedControl<T extends string>({ options, value, onValueChange, scale, label, className, ...props }: SegmentedControlProps<T>): import("react").JSX.Element;
export type SegmentedTogglesProps<T extends string> = {
    options: SegmentedOption<T>[];
    /** Options that are on, in any order. */
    value: T[];
    /** Gets the options that are on, in the order of `options`. */
    onValueChange: (value: T[]) => void;
    /** Describes the group for screen readers, e.g. "Levels". */
    "aria-label"?: string;
    /** Muted caption inside an input-styled frame, as on SegmentedControl. */
    label?: ReactNode;
    className?: string;
};
/**
 * SegmentedControl's look with independent toggles: each option turns on and off by itself and is filled while on,
 * e.g. a filter that shows any combination of levels. Every option may be off; what that means is up to the caller.
 */
export declare function SegmentedToggles<T extends string>({ options, value, onValueChange, label, className, ...props }: SegmentedTogglesProps<T>): import("react").JSX.Element;
export {};
