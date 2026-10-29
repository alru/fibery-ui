// Buttons in Fibery's compact style: 24/28/32px heights, icon on the left, ghost buttons for secondary actions.
import {forwardRef, type ButtonHTMLAttributes, type ReactNode, type Ref} from "react";
import {Slot} from "@radix-ui/react-slot";
import {cx} from "../cx";
import {Spinner} from "./States";

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
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {variant = "primary", size = "md", icon, loading = false, asChild = false, type = "button", disabled, className, children, ...props},
    ref,
  ) => {
    if (asChild) {
      return (
        <Slot ref={ref as Ref<HTMLElement>} data-variant={variant} data-size={size} className={cx("fui-button", className)} {...props}>
          {children}
        </Slot>
      );
    }
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        data-variant={variant}
        data-size={size}
        data-icon-only={children == null && (icon || loading) ? "" : undefined}
        className={cx("fui-button", className)}
        {...props}
      >
        {loading ? <Spinner size="sm" /> : icon}
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";

export type IconButtonProps = Omit<ButtonProps, "icon" | "children" | "asChild"> & {
  icon: ReactNode;
  /** Required: an icon-only button has no visible text for screen readers. */
  "aria-label": string;
};

/** Square icon-only button, ghost by default like Fibery's toolbar buttons. */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(({variant = "ghost", ...props}, ref) => (
  <Button ref={ref} variant={variant} {...props} />
));
IconButton.displayName = "IconButton";
