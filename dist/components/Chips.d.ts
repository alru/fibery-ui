import { type ReactNode } from "react";
import { type QuickTerm } from "../dates";
export type ChipOption<T extends string> = {
    value: T;
    label: ReactNode;
    /** Mark before the label, e.g. a channel's emoji or a Dot. */
    glyph?: ReactNode;
    /** Hover text, e.g. what the option means. */
    title?: string;
};
export type ChipGroupProps<T extends string> = {
    options: ChipOption<T>[];
    /** The picked option; `null` — none. */
    value: T | null;
    onValueChange: (value: T | null) => void;
    /** How many options show as chips; the rest are in a «ещё ▾» / "more ▾" menu. All by default. */
    visible?: number;
    /** A click on the picked chip clears the choice (`null`), for optional values. */
    deselectable?: boolean;
    disabled?: boolean;
    "aria-label"?: string;
    className?: string;
};
/**
 * Row of separate 24px chips with wrapping, one picked at a time (the picked one in the accent color: it is a choice,
 * not a code). A radio group: arrow keys move the choice. Unlike SegmentedControl (one joined strip that never
 * wraps), it fits many options, e.g. channels or date terms.
 */
export declare function ChipGroup<T extends string>({ options, value, onValueChange, visible, deselectable, disabled, className, ...props }: ChipGroupProps<T>): import("react").JSX.Element;
export type QuickDateProps = {
    /** Quick choices with their dates, computed by the app (e.g. "Tomorrow" = tomorrow 10:00); none by default. */
    terms?: QuickTerm[];
    value: Date | null;
    onChange: (value: Date | null) => void;
    /** TimeInput next to the date and the time in the preview; on by default. */
    withTime?: boolean;
    /**
     * «Сейчас» / "Now" (with the time) or «Сегодня» / "Today" (without): sets the current moment. The only quick choice
     * stands right after the inputs; with `terms` it leads the chips under them.
     */
    now?: boolean;
    /** The picked date spelled out under everything — «пн 24 ноября, 10:00»; on by default. */
    preview?: boolean;
    size?: "sm" | "md";
    invalid?: boolean;
    disabled?: boolean;
    /** Goes on the date's text field, so a Field's `htmlFor` focuses it. */
    id?: string;
    /** Names the field for screen readers when no Field label points at it. */
    "aria-label"?: string;
    className?: string;
};
/**
 * Date (and time) field with quick choices (owner, 2026-11-27): the date and time inputs on top, the quick-term chips
 * under them, then the picked date spelled out (`preview`). A value keeps its chip picked while it stays on that
 * chip's day. The chips never change size, so nothing shifts.
 */
export declare function QuickDate({ terms, value, onChange, withTime, now, preview, size, invalid, disabled, id, className, ...props }: QuickDateProps): import("react").JSX.Element;
