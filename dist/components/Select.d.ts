import { type ComponentPropsWithoutRef, type ReactNode } from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
export declare const Select: import("react").FC<SelectPrimitive.SelectProps>;
export declare const SelectGroup: import("react").ForwardRefExoticComponent<SelectPrimitive.SelectGroupProps & import("react").RefAttributes<HTMLDivElement>>;
export declare const SelectValue: import("react").ForwardRefExoticComponent<SelectPrimitive.SelectValueProps & import("react").RefAttributes<HTMLSpanElement>>;
export type SelectTriggerProps = ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> & {
    size?: "sm" | "md";
    invalid?: boolean;
};
/** Input-styled button that opens the select; put a `<SelectValue placeholder="…" />` inside. */
export declare const SelectTrigger: import("react").ForwardRefExoticComponent<Omit<SelectPrimitive.SelectTriggerProps & import("react").RefAttributes<HTMLButtonElement>, "ref"> & {
    size?: "sm" | "md";
    invalid?: boolean;
} & import("react").RefAttributes<HTMLButtonElement>>;
/** Popup list, at least as wide as the trigger. */
export declare const SelectContent: import("react").ForwardRefExoticComponent<Omit<SelectPrimitive.SelectContentProps & import("react").RefAttributes<HTMLDivElement>, "ref"> & import("react").RefAttributes<HTMLDivElement>>;
/** Option row with a check mark when selected. Children may start with an icon or EnumBadge. */
export declare const SelectItem: import("react").ForwardRefExoticComponent<Omit<SelectPrimitive.SelectItemProps & import("react").RefAttributes<HTMLDivElement>, "ref"> & import("react").RefAttributes<HTMLDivElement>>;
/** Muted group caption inside SelectContent. */
export declare const SelectLabel: import("react").ForwardRefExoticComponent<Omit<SelectPrimitive.SelectLabelProps & import("react").RefAttributes<HTMLDivElement>, "ref"> & import("react").RefAttributes<HTMLDivElement>>;
export declare const SelectSeparator: import("react").ForwardRefExoticComponent<Omit<SelectPrimitive.SelectSeparatorProps & import("react").RefAttributes<HTMLDivElement>, "ref"> & import("react").RefAttributes<HTMLDivElement>>;
export type MultiSelectOption = {
    value: string;
    /** Row content and trigger summary, e.g. an EnumBadge. */
    label: ReactNode;
};
export type MultiSelectProps = {
    /** Muted caption before the selection in the trigger, e.g. "Status". */
    label: ReactNode;
    options: MultiSelectOption[];
    value: string[];
    onValueChange: (value: string[]) => void;
    /** Trigger text while nothing is selected, i.e. the filter is off. */
    placeholder?: ReactNode;
    /** Text of the menu row that clears the selection; shown only when something is selected. */
    clearLabel?: string;
    size?: "sm" | "md";
    className?: string;
    "aria-label"?: string;
};
/**
 * Filter picker for several values: an input-styled trigger "Label: first value +N" and a menu of checkable rows
 * that stays open while toggling. An empty selection means "no filter".
 */
export declare function MultiSelect({ label, options, value, onValueChange, placeholder, clearLabel, size, className, "aria-label": ariaLabel, }: MultiSelectProps): import("react").JSX.Element;
