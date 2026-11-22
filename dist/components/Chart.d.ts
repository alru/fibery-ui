import { type CSSProperties, type ReactNode } from "react";
import type { Hue } from "./Badge";
export type BarListItem = {
    key: string;
    label: ReactNode;
    value: number;
    /** Makes the row a button, e.g. to open a list filtered by this value. Zero rows are never clickable. */
    onClick?: () => void;
    /** Muted label, for "not set" rows. */
    muted?: boolean;
    /** Hatched bar and a note after the label: the value is there, but it is a stand-in (a placeholder), not real data. */
    placeholder?: ReactNode;
};
export type BarListProps = {
    items: BarListItem[];
    /** Value of a full bar; default the largest value. Pass the total to read bars as shares of it. */
    max?: number;
    /** Shows a share column, value / total. */
    total?: number;
    /** Bar color; neutral by default. */
    hue?: Hue;
    className?: string;
    style?: CSSProperties;
};
/**
 * Rows of "label, bar, value, share". The label column has a fixed width (`--fui-bar-label`, default 13rem), so bars
 * don't move when rows come and go with filters; long labels end with "…".
 */
export declare function BarList({ items, max, total, hue, className, style }: BarListProps): import("react").JSX.Element;
export type StackedBarSegment = {
    key: string;
    label: ReactNode;
    value: number;
    hue?: Hue;
    /** Makes the legend entry a button. */
    onClick?: () => void;
};
export type StackedBarProps = {
    /** Parts of one whole, in display order; zero parts are left out of the bar but stay in the legend. */
    segments: StackedBarSegment[];
    className?: string;
};
/** One bar split into parts, with a legend of "swatch, label, value, share" under it. */
export declare function StackedBar({ segments, className }: StackedBarProps): import("react").JSX.Element;
export type FlowPeriod = {
    key: string;
    /** Axis caption, e.g. "янв" or "янв 26". */
    label: ReactNode;
    /** Spoken name of the period for screen readers, e.g. "январь 2026". */
    name: string;
    up: number;
    down: number;
    /** Value of the level line at this period, e.g. headcount at the month's end. */
    level?: number;
    onUpClick?: () => void;
    onDownClick?: () => void;
};
export type FlowChartProps = {
    periods: FlowPeriod[];
    /** Legend names of the series, e.g. "Пришли", "Ушли", "В работе на конец месяца". */
    upLabel: string;
    downLabel: string;
    levelLabel?: string;
    upHue?: Hue;
    downHue?: Hue;
    /**
     * Which points of the level line print their value: `"all"` (default), or `"changes"` — the first, the last and
     * every point that differs from the one before, so a long flat stretch doesn't repeat one number.
     */
    levelValues?: "all" | "changes";
    /** When the periods don't fit, start scrolled to the latest ones instead of the earliest. */
    scrollToEnd?: boolean;
    className?: string;
};
/**
 * Per-period flow: `up` bars rise above the axis, `down` bars hang below it, each with its number; an optional level
 * line runs above them with its value at every point. Scrolls sideways when the periods don't fit (36px each at least).
 */
export declare function FlowChart({ periods, upLabel, downLabel, levelLabel, upHue, downHue, levelValues, scrollToEnd, className, }: FlowChartProps): import("react").JSX.Element;
