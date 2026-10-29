import type { HTMLAttributes, ReactNode } from "react";
export type SpinnerProps = {
    size?: "sm" | "md" | "lg";
    className?: string;
};
/** Indeterminate spinner: 12 / 16 / 24px. */
export declare function Spinner({ size, className }: SpinnerProps): import("react").JSX.Element;
/** Pulsing placeholder block; size it with `className` or `style`. */
export declare function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>): import("react").JSX.Element;
export type LoadingStateProps = {
    children?: ReactNode;
    className?: string;
};
/** Spinner with a caption, `"Загрузка…"` by default. */
export declare function LoadingState({ children, className }: LoadingStateProps): import("react").JSX.Element;
export type ErrorStateProps = {
    error: unknown;
    title?: ReactNode;
    action?: ReactNode;
    className?: string;
};
/**
 * Error box that always shows the underlying message: Fibery API errors carry the exact
 * diagnostic needed to report the problem.
 */
export declare function ErrorState({ error, title, action, className }: ErrorStateProps): import("react").JSX.Element;
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
