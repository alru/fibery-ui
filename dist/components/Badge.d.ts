import { type HTMLAttributes, type ReactNode } from "react";
import { type Hue } from "../colors";
export type { Hue };
export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
    /** Highlight hue from the workspace palette; omit for a neutral badge. */
    hue?: Hue;
    /** `"soft"` — filled (default); `"outline"` — transparent with a thin ring. */
    variant?: "soft" | "outline";
    /** Small uppercase letter-spaced label, like Fibery's database type badge. */
    caps?: boolean;
    /**
     * `"rect"` (default) — Fibery's own 4px corners. `"pill"` — round ends, 8px sides, medium weight: a record's state
     * in lists and tables; with `variant="outline"` and no hue, a neutral chip for an attribute (a channel, a source).
     */
    shape?: "rect" | "pill";
    /**
     * The text wraps inside the badge instead of staying on one line, once the badge is wider than its container
     * (a narrow property column). Nothing is ever cut with "…".
     */
    wrap?: boolean;
    /**
     * What the value means, behind a "?" at the end of the badge (on hover and keyboard focus): one pill instead of a
     * pill with a separate "?" beside it.
     */
    hint?: ReactNode;
    /** Adds a × button, e.g. for an active filter chip. */
    onRemove?: () => void;
    /** Accessible label of the × button; «Убрать» / "Remove" by default. */
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
    /**
     * `"rect"` (default) — Fibery's own 4px corners. `"pill"` — round ends, 8px sides, medium weight: a record's state
     * in lists and tables; with `variant="outline"` and no hue, a neutral chip for an attribute (a channel, a source).
     */
    shape?: "rect" | "pill";
    /**
     * The text wraps inside the badge instead of staying on one line, once the badge is wider than its container
     * (a narrow property column). Nothing is ever cut with "…".
     */
    wrap?: boolean;
    /**
     * What the value means, behind a "?" at the end of the badge (on hover and keyboard focus): one pill instead of a
     * pill with a separate "?" beside it.
     */
    hint?: ReactNode;
    /** Adds a × button, e.g. for an active filter chip. */
    onRemove?: () => void;
    /** Accessible label of the × button; «Убрать» / "Remove" by default. */
    removeLabel?: string;
} & import("react").RefAttributes<HTMLSpanElement>>;
export type EnumBadgeProps = Omit<HTMLAttributes<HTMLSpanElement>, "color" | "children"> & {
    /** Option name, e.g. `enum/name` of a single-select or workflow state. */
    name: string;
    /** Option color as stored in Fibery (`enum/color`); `null` falls back to the muted theme color. */
    color?: string | null;
    /** `"dot"` — colored dot + name; `"circle"` — name inside a colored ring (for one-letter values like levels). */
    variant?: "dot" | "circle";
    /** A long name wraps onto more lines (the dot stays at the first) instead of ending with "…". */
    wrap?: boolean;
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
    /** A long name wraps onto more lines (the dot stays at the first) instead of ending with "…". */
    wrap?: boolean;
} & import("react").RefAttributes<HTMLSpanElement>>;
export type DotProps = Omit<HTMLAttributes<HTMLSpanElement>, "children"> & {
    /** Theme hue; omit for grey (filled) or the text color (ring). */
    hue?: Hue;
    /** `"filled"` (default) — a solid dot, e.g. an attribute's color; `"ring"` — hollow, e.g. something planned. */
    variant?: "filled" | "ring";
    /** 8px (default) or 10px. */
    size?: "sm" | "md";
};
/**
 * Small round mark in a theme hue: an attribute or a secondary state next to its text ("● Outbound"). Decorative
 * by default (`aria-hidden`); give it `aria-label` when nothing next to it says what it means.
 */
export declare const Dot: import("react").ForwardRefExoticComponent<Omit<HTMLAttributes<HTMLSpanElement>, "children"> & {
    /** Theme hue; omit for grey (filled) or the text color (ring). */
    hue?: Hue;
    /** `"filled"` (default) — a solid dot, e.g. an attribute's color; `"ring"` — hollow, e.g. something planned. */
    variant?: "filled" | "ring";
    /** 8px (default) or 10px. */
    size?: "sm" | "md";
} & import("react").RefAttributes<HTMLSpanElement>>;
export type OptionBadgeProps = Omit<HTMLAttributes<HTMLSpanElement>, "color" | "children"> & {
    /** Option name (`enum/name`). */
    name: string;
    /** Option color as stored in Fibery (`enum/color`), mapped to a theme hue by `fiberyHue`. */
    color?: string | null;
    /** Option emoji shortcode (`enum/icon`, ":rocket:"), shown before the name; unknown codes are left out. */
    icon?: string | null;
    /** Hue while the option has no color in Fibery: an app's own code. A color set in Fibery always wins. */
    fallbackHue?: Hue;
    /**
     * `"soft"` (default) — filled badge, the state of the record itself; `"outline"` — ring and text in the hue, a
     * record that dropped out (lost, cancelled); `"dot"` — dot + plain text, an attribute or a secondary record's state.
     */
    variant?: "soft" | "outline" | "dot";
    /** Mark before the name in place of the emoji, e.g. a StageGlyph. */
    glyph?: ReactNode;
    /** Badge shape for `"soft"` and `"outline"`, see Badge: `"pill"` for states in lists and tables. */
    shape?: "rect" | "pill";
    /** A long name wraps instead of ending with "…". Default: on for pills, off otherwise. */
    wrap?: boolean;
    /** The option's meaning behind a "?" inside the badge (see Badge); not for the `"dot"` variant. */
    hint?: ReactNode;
};
/**
 * A Fibery select or workflow option in the owner's colors and emoji, drawn with the theme's highlight hues (so light
 * and dark themes work): `fiberyHue(color)` picks the hue, `fiberyEmoji(icon)` the emoji (left out where the browser
 * can't draw it). No color → neutral badge (or a grey dot).
 */
export declare const OptionBadge: import("react").ForwardRefExoticComponent<Omit<HTMLAttributes<HTMLSpanElement>, "children" | "color"> & {
    /** Option name (`enum/name`). */
    name: string;
    /** Option color as stored in Fibery (`enum/color`), mapped to a theme hue by `fiberyHue`. */
    color?: string | null;
    /** Option emoji shortcode (`enum/icon`, ":rocket:"), shown before the name; unknown codes are left out. */
    icon?: string | null;
    /** Hue while the option has no color in Fibery: an app's own code. A color set in Fibery always wins. */
    fallbackHue?: Hue;
    /**
     * `"soft"` (default) — filled badge, the state of the record itself; `"outline"` — ring and text in the hue, a
     * record that dropped out (lost, cancelled); `"dot"` — dot + plain text, an attribute or a secondary record's state.
     */
    variant?: "soft" | "outline" | "dot";
    /** Mark before the name in place of the emoji, e.g. a StageGlyph. */
    glyph?: ReactNode;
    /** Badge shape for `"soft"` and `"outline"`, see Badge: `"pill"` for states in lists and tables. */
    shape?: "rect" | "pill";
    /** A long name wraps instead of ending with "…". Default: on for pills, off otherwise. */
    wrap?: boolean;
    /** The option's meaning behind a "?" inside the badge (see Badge); not for the `"dot"` variant. */
    hint?: ReactNode;
} & import("react").RefAttributes<HTMLSpanElement>>;
export type StageGlyphProps = {
    /**
     * Kind of state, as Fibery's workflow types: `notStarted` — empty ring; `started` — ring filled `step / steps`;
     * `finished` — check; `paused` — pause bars; `failed` — cross.
     */
    type: "notStarted" | "started" | "finished" | "paused" | "failed";
    /** For `started`: how far along, e.g. 2 of 6 open stages. */
    step?: number;
    steps?: number;
    /** Accessible name; without it the glyph is decorative (the badge text names the state). */
    "aria-label"?: string;
    className?: string;
};
/**
 * 12px progress ring of a workflow state, like Fibery's state icons: how far a record has come, readable without
 * the state's name. Drawn in `currentColor`; inside a neutral Badge it takes the muted text color.
 */
export declare function StageGlyph({ type, step, steps, className, ...props }: StageGlyphProps): import("react").JSX.Element;
export type EmojiProps = Omit<HTMLAttributes<HTMLSpanElement>, "children"> & {
    /** The emoji, e.g. `fiberyEmoji(option.icon)`; empty renders nothing. */
    char: string | null | undefined;
    /** Accessible name; without it the emoji is decorative (the text next to it says what it means). */
    label?: string;
};
/**
 * An emoji at 12px in a 14px box, e.g. a channel's before its name. Renders nothing where the browser can't draw it
 * (`emojiRenders`): an empty box is worse than no mark, and the name next to it carries the meaning.
 */
export declare function Emoji({ char, label, className, ...props }: EmojiProps): import("react").JSX.Element | null;
