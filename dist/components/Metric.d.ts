import type { ReactNode } from "react";
export type MetricCompare = {
    /** The previous period's value, as shown: «было 11» / "was 11". */
    prev: ReactNode;
    /** Value minus `prev`; written with its sign and an arrow, never colored. */
    delta: number;
};
export type MetricCardProps = {
    /** The number, e.g. 163 or "760 h". */
    value: ReactNode;
    /** What it counts: "Deals in progress". */
    label: ReactNode;
    /** How it is counted, in one line under the label: a number without its definition is a guess. */
    definition: ReactNode;
    /**
     * `"line"` (default): the definition stays in view under the label. `"hint"`: a "?" after the label shows it on
     * hover; screen readers still get it with the label.
     */
    definitionAs?: "line" | "hint";
    /**
     * The previous period: «было 11 · ↑ +7». `null` keeps the line's room empty (a period with nothing to compare,
     * e.g. "all time"), so cards don't change height when the period changes; leave it out for metrics that never
     * compare ("right now").
     */
    compare?: MetricCompare | null;
    /** One more muted line under the definition, e.g. "3 more without a return date". Plain text in a clickable card. */
    note?: ReactNode;
    /** Makes the whole card a button, e.g. to open the list behind the number. */
    onClick?: () => void;
    /** A grey block in place of the number while data loads; the rest of the card keeps its place. */
    loading?: boolean;
    className?: string;
};
/**
 * A flat sheet (like `Card variant="flat"`): the number in 24px monospace digits, the label, its definition, and the
 * comparison line pinned to the bottom, so cards in a row line up. The change has no color: growth of lost deals is
 * bad and growth of replies is good, so a red/green by sign would lie on half the metrics.
 */
export declare function MetricCard({ value, label, definition, definitionAs, compare, note, onClick, loading, className, }: MetricCardProps): import("react").JSX.Element;
