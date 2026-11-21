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
    /** Quick choices with their dates, computed by the app (e.g. "Tomorrow" = tomorrow 10:00). */
    terms: QuickTerm[];
    value: Date | null;
    onChange: (value: Date | null) => void;
    /** Time input next to the date and the time in the resolved line; on by default. */
    withTime?: boolean;
    invalid?: boolean;
    disabled?: boolean;
    /** Names the field for screen readers when no Field label points at it. */
    "aria-label"?: string;
    className?: string;
};
/**
 * Date field for planning: quick-term chips, «Дата…» / "Date…" for a date input (and a time input), and the resolved
 * date spelled out under the chips — «пн 24 ноября, 10:00» — which also opens the inputs to adjust the time. A value
 * keeps its chip picked while it stays on that chip's day. The chips never change size, so nothing shifts.
 */
export declare function QuickDate({ terms, value, onChange, withTime, invalid, disabled, className, ...props }: QuickDateProps): import("react").JSX.Element;
