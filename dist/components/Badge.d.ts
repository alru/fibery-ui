import { type HTMLAttributes } from "react";
export type Hue = "grey" | "red" | "pink" | "purple" | "violet" | "blue" | "turquoise" | "aqua" | "aquamarine" | "green" | "yellow" | "orange";
export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
    /** Highlight hue from the workspace palette; omit for a neutral badge. */
    hue?: Hue;
    /** `"soft"` — filled (default); `"outline"` — transparent with a thin ring. */
    variant?: "soft" | "outline";
    /** Small uppercase letter-spaced label, like Fibery's database type badge. */
    caps?: boolean;
    /** Adds a × button, e.g. for an active filter chip. */
    onRemove?: () => void;
    /** Accessible label of the × button. */
    removeLabel?: string;
};
/** Small label colored with the workspace highlight palette (follows light/dark theme). */
export declare const Badge: import("react").ForwardRefExoticComponent<HTMLAttributes<HTMLSpanElement> & {
    /** Highlight hue from the workspace palette; omit for a neutral badge. */
    hue?: Hue;
    /** `"soft"` — filled (default); `"outline"` — transparent with a thin ring. */
    variant?: "soft" | "outline";
    /** Small uppercase letter-spaced label, like Fibery's database type badge. */
    caps?: boolean;
    /** Adds a × button, e.g. for an active filter chip. */
    onRemove?: () => void;
    /** Accessible label of the × button. */
    removeLabel?: string;
} & import("react").RefAttributes<HTMLSpanElement>>;
export type EnumBadgeProps = Omit<HTMLAttributes<HTMLSpanElement>, "color" | "children"> & {
    /** Option name, e.g. `enum/name` of a single-select or workflow state. */
    name: string;
    /** Option color as stored in Fibery (`enum/color`); `null` falls back to the muted theme color. */
    color?: string | null;
    /** `"dot"` — colored dot + name; `"circle"` — name inside a colored ring (for one-letter values like levels). */
    variant?: "dot" | "circle";
};
/**
 * Renders a Fibery select/workflow option in its own color. The color is data, not theme,
 * so it is applied as-is and never used as a text background.
 */
export declare const EnumBadge: import("react").ForwardRefExoticComponent<Omit<HTMLAttributes<HTMLSpanElement>, "children" | "color"> & {
    /** Option name, e.g. `enum/name` of a single-select or workflow state. */
    name: string;
    /** Option color as stored in Fibery (`enum/color`); `null` falls back to the muted theme color. */
    color?: string | null;
    /** `"dot"` — colored dot + name; `"circle"` — name inside a colored ring (for one-letter values like levels). */
    variant?: "dot" | "circle";
} & import("react").RefAttributes<HTMLSpanElement>>;
