import type { HTMLAttributes, ReactNode } from "react";
export type SpinnerProps = {
    size?: "sm" | "md" | "lg";
    className?: string;
};
/** Indeterminate spinner: 12 / 16 / 24px. */
export declare function Spinner({ size, className }: SpinnerProps): import("react").JSX.Element;
/** Pulsing placeholder block; size it with `className` or `style`. */
export declare function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>): import("react").JSX.Element;
export type SkeletonRowsProps = {
    /** Number of rows; 5 by default. */
    rows?: number;
    /** Row height in px, the same as the real rows so nothing jumps when data arrives; 36 by default. */
    height?: number;
    /** Width of a block in a leading column, e.g. 40 for a time column; none by default. */
    lead?: number;
    /** Block widths per text line, e.g. `[[120, 180], [240]]` for a two-line row; `[[160]]` by default. */
    lines?: number[][];
    /** Block widths at the right edge, e.g. a badge and the actions. */
    trail?: number[];
    /** Hairlines between rows, as in `<List variant="divided">`; on by default. */
    divided?: boolean;
    /** Screen-reader text; «Загрузка…» / "Loading…" by default. */
    label?: string;
    className?: string;
};
/** Placeholder rows in the shape of the list that is loading: same height, columns and line count as the real rows. */
export declare function SkeletonRows({ rows, height, lead, lines, trail, divided, label, className }: SkeletonRowsProps): import("react").JSX.Element;
export type LoadingStateProps = {
    children?: ReactNode;
    className?: string;
};
/** Spinner with a caption, «Загрузка…» / "Loading…" by default. */
export declare function LoadingState({ children, className }: LoadingStateProps): import("react").JSX.Element;
export type ErrorStateProps = {
    error: unknown;
    title?: ReactNode;
    /** Shows a «Повторить» / "Retry" button that calls it, before `action`. */
    onRetry?: () => void;
    /** Spinner on the retry button while the retry runs. */
    retrying?: boolean;
    /** Any extra controls under the message. */
    action?: ReactNode;
    className?: string;
};
/**
 * Error box. For transient failures (Fibery unavailable, rate limit, no connection) it explains them in plain
 * words; the underlying message is always shown too, small and muted under that text: Fibery API errors carry
 * the exact diagnostic needed to report the problem.
 */
export declare function ErrorState({ error, title, onRetry, retrying, action, className }: ErrorStateProps): import("react").JSX.Element;
export type EmptyStateProps = {
    title: ReactNode;
    description?: ReactNode;
    /** Lucide icon element; an inbox by default. */
    icon?: ReactNode;
    action?: ReactNode;
    className?: string;
};
/** Centered placeholder for an empty list or view. */
export declare function EmptyState({ title, description, icon, action, className }: EmptyStateProps): import("react").JSX.Element;
export type CalloutProps = {
    /** `"info"` — blue (default); `"warning"` — yellow; `"error"` — red, a problem that blocks the action (e.g. a form
     *  error not tied to one field); `"neutral"` — grey; `"plain"` — no fill, a thin ring and muted text: the quietest
     *  note, for a rule that applies to several fields at once. */
    tone?: "info" | "warning" | "error" | "neutral" | "plain";
    /** Replaces the tone's default icon; `null` hides it. */
    icon?: ReactNode;
    children: ReactNode;
    className?: string;
};
/** Always-visible note in the workspace highlight palette, e.g. how a form behaves. */
export declare function Callout({ tone, icon, children, className }: CalloutProps): import("react").JSX.Element;
export type RefreshWarningProps = {
    error: unknown;
    onRetry: () => void;
    /** Spinner on the retry button while the refetch runs. */
    retrying?: boolean;
    /** Lead text; default «Не удалось обновить данные.» / "Couldn't refresh data." */
    title?: ReactNode;
    className?: string;
};
/**
 * Compact warning above a screen whose background refetch failed. The data already on screen stays usable (it may
 * only be stale), so a full-screen ErrorState would hide it for nothing; ErrorState is for screens with no data yet.
 * Shows the plain-words reason, a retry button, and the raw message (clamped: a gateway error may carry a whole page).
 */
export declare function RefreshWarning({ error, onRetry, retrying, title, className }: RefreshWarningProps): import("react").JSX.Element;
