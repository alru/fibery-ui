import { type ReactNode } from "react";
export type TimelineItem = {
    id: string;
    /**
     * 12px mark on the spine, in a 16px circle that covers the line: a Dot (e.g. a hollow ring for something planned),
     * a Lucide icon (an arrow for who wrote, an X for cancelled). Its shape should carry the meaning; color repeats it.
     */
    marker: ReactNode;
    /** Time column (80px, tabular digits, muted by default): «20 ноя», «пн 1 дек». */
    time: ReactNode;
    /** The event, one line with an ellipsis. */
    title: ReactNode;
    /** Muted context at the right edge, e.g. channel and person. */
    meta?: ReactNode;
    /** Muted second line under the title. */
    description?: ReactNode;
    /** Struck-through muted title: the event was cancelled. */
    struck?: boolean;
    /** Makes the row clickable (Enter / Space too), e.g. to edit the event. */
    onClick?: () => void;
};
export type TimelineProps = {
    /** Events in display order, usually latest first with the planned ones on top. */
    items: TimelineItem[];
    /** Rows above the "now" line (see `nowLineIndex`); `null` or omitted — no line. Not drawn while hidden by «Ещё». */
    nowIndex?: number | null;
    /** Caption of the "now" line, e.g. «сейчас 11:42»; «сейчас» / "now" by default. */
    nowLabel?: ReactNode;
    /** Rows shown before «Ещё N» / "N more"; 10 by default. */
    limit?: number;
    /** Shown instead of an empty timeline, e.g. "No activities yet" with a button. */
    empty?: ReactNode;
    /**
     * The row where the record began, after the last event, e.g. `{time: "16.06.25", label: "Opened"}`: a filled dot
     * ends the spine there, so a latest-first history reads from "now" down to its start. Shown once every row is
     * (not while «Ещё N» hides some), and in an otherwise empty timeline too.
     */
    start?: {
        time: ReactNode;
        label: ReactNode;
    };
    "aria-label"?: string;
    className?: string;
};
/**
 * Vertical timeline: spine 12px from the left edge, markers in circles of the card color (set
 * `--fui-timeline-bg` on another surface), time column, title with optional second line, muted meta on the right.
 */
export declare function Timeline({ items, nowIndex, nowLabel, limit, empty, start, className, ...props }: TimelineProps): import("react").JSX.Element | null;
