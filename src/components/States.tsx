// Feedback placeholders: spinner, skeleton, and loading / error / empty states for React Query results.
import type {HTMLAttributes, ReactNode} from "react";
import {CircleAlert, Inbox} from "lucide-react";
import {cx} from "../cx";

export type SpinnerProps = {size?: "sm" | "md" | "lg"; className?: string};

/** Indeterminate spinner: 12 / 16 / 24px. */
export function Spinner({size = "md", className}: SpinnerProps) {
  return <span aria-hidden data-size={size} className={cx("fui-spinner", className)} />;
}

/** Pulsing placeholder block; size it with `className` or `style`. */
export function Skeleton({className, ...props}: HTMLAttributes<HTMLDivElement>) {
  return <div aria-hidden className={cx("fui-skeleton", className)} {...props} />;
}

export type LoadingStateProps = {children?: ReactNode; className?: string};

/** Spinner with a caption, `"Загрузка…"` by default. */
export function LoadingState({children = "Загрузка…", className}: LoadingStateProps) {
  return (
    <div role="status" className={cx("fui-state", className)}>
      <Spinner />
      {children}
    </div>
  );
}

export type ErrorStateProps = {error: unknown; title?: ReactNode; action?: ReactNode; className?: string};

/**
 * Error box that always shows the underlying message: Fibery API errors carry the exact
 * diagnostic needed to report the problem.
 */
export function ErrorState({error, title = "Не удалось загрузить данные", action, className}: ErrorStateProps) {
  const message = error instanceof Error ? error.message : String(error);
  return (
    <div role="alert" className={cx("fui-error", className)}>
      <CircleAlert />
      <div className="fui-error__body">
        <strong className="fui-error__title">{title}</strong>
        <span className="fui-error__message">{message}</span>
        {action && <div className="fui-error__action">{action}</div>}
      </div>
    </div>
  );
}

export type EmptyStateProps = {
  title: ReactNode;
  description?: ReactNode;
  /** Lucide icon element; an inbox by default. */
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
};

/** Centered placeholder for an empty list or view. */
export function EmptyState({title, description, icon = <Inbox />, action, className}: EmptyStateProps) {
  return (
    <div className={cx("fui-empty", className)}>
      <span className="fui-empty__icon">{icon}</span>
      <strong className="fui-empty__title">{title}</strong>
      {description && <p className="fui-empty__description">{description}</p>}
      {action && <div className="fui-empty__action">{action}</div>}
    </div>
  );
}
