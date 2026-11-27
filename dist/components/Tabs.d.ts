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
export type TabsTriggerProps = ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> & {
    /**
     * Round counter after the label (fixed width for "999", tabular digits). 0 hides it but keeps its place, so the
     * tabs never shift; leave it undefined for a tab without a counter. Say what it counts in the tab's `title`.
     */
    count?: number;
    /**
     * A 0 counter: `"reserve"` (default) keeps its empty place, so the tabs never shift; `"hide"` drops it, for a tab
     * whose counter stays at 0 for long and would leave a permanent gap (the tabs then shift when it appears).
     */
    zero?: "reserve" | "hide";
    /** `"alert"` — the counter on a red plate, e.g. when overdue work is among it; neutral by default. */
    tone?: "neutral" | "alert";
};
export declare const TabsTrigger: import("react").ForwardRefExoticComponent<Omit<TabsPrimitive.TabsTriggerProps & import("react").RefAttributes<HTMLButtonElement>, "ref"> & {
    /**
     * Round counter after the label (fixed width for "999", tabular digits). 0 hides it but keeps its place, so the
     * tabs never shift; leave it undefined for a tab without a counter. Say what it counts in the tab's `title`.
     */
    count?: number;
    /**
     * A 0 counter: `"reserve"` (default) keeps its empty place, so the tabs never shift; `"hide"` drops it, for a tab
     * whose counter stays at 0 for long and would leave a permanent gap (the tabs then shift when it appears).
     */
    zero?: "reserve" | "hide";
    /** `"alert"` — the counter on a red plate, e.g. when overdue work is among it; neutral by default. */
    tone?: "neutral" | "alert";
} & import("react").RefAttributes<HTMLButtonElement>>;
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
    /** Mark before the label: a Dot in the option's color, an emoji, a direction arrow. */
    glyph?: ReactNode;
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
    /**
     * Takes the full width of its container, the room left over shared equally by the options — for a form field,
     * where the control stands in a column of full-width inputs.
     */
    fill?: boolean;
    className?: string;
};
/**
 * Single-choice segmented switch (radio group), 28px high to line up with small inputs.
 * Arrow keys move the selection, like native radio buttons.
 */
export declare function SegmentedControl<T extends string>({ options, value, onValueChange, scale, label, fill, className, ...props }: SegmentedControlProps<T>): import("react").JSX.Element;
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
