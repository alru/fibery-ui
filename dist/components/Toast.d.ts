import { type ReactNode } from "react";
export type ToastOptions = {
    message: ReactNode;
    /** Text of the action button, e.g. "Undo"; the toast closes when it is clicked. */
    actionLabel?: string;
    onAction?: () => void;
    /** More buttons after the action, e.g. "Schedule"; each closes the toast too. */
    moreActions?: ToastAction[];
    /** Milliseconds until the toast closes by itself. Default 6000. */
    duration?: number;
};
export type ToastAction = {
    label: string;
    onAction: () => void;
};
/** Renders toasts shown with `useToast`. Already included in FiberyUIProvider. */
export declare function ToastProvider({ children }: {
    children: ReactNode;
}): import("react").JSX.Element;
/**
 * Returns `toast(options)` to show a notice in the corner, e.g.
 * `toast({message: "Removed", actionLabel: "Undo", onAction: restore})`.
 */
export declare function useToast(): (options: ToastOptions) => void;
