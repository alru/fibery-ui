import { type ButtonHTMLAttributes, type ReactNode } from "react";
export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "destructive";
export type ButtonSize = "sm" | "md" | "lg";
export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant;
    size?: ButtonSize;
    /** Icon before the label, e.g. `<Plus />` from lucide-react. */
    icon?: ReactNode;
    /** Replaces the icon with a spinner and disables the button. */
    loading?: boolean;
    /** Applies button styles to the single child (e.g. an `<a>`) instead of rendering a `<button>`. */
    asChild?: boolean;
};
/**
 * Themed button. Defaults to `type="button"` so it never submits a form by accident.
 * Without children it renders as a square icon-only button.
 */
export declare const Button: import("react").ForwardRefExoticComponent<ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant;
    size?: ButtonSize;
    /** Icon before the label, e.g. `<Plus />` from lucide-react. */
    icon?: ReactNode;
    /** Replaces the icon with a spinner and disables the button. */
    loading?: boolean;
    /** Applies button styles to the single child (e.g. an `<a>`) instead of rendering a `<button>`. */
    asChild?: boolean;
} & import("react").RefAttributes<HTMLButtonElement>>;
export type IconButtonProps = Omit<ButtonProps, "icon" | "children" | "asChild"> & {
    icon: ReactNode;
    /** Required: an icon-only button has no visible text for screen readers. */
    "aria-label": string;
};
/** Square icon-only button, ghost by default like Fibery's toolbar buttons. */
export declare const IconButton: import("react").ForwardRefExoticComponent<Omit<ButtonProps, "asChild" | "children" | "icon"> & {
    icon: ReactNode;
    /** Required: an icon-only button has no visible text for screen readers. */
    "aria-label": string;
} & import("react").RefAttributes<HTMLButtonElement>>;
