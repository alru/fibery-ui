import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// Buttons in Fibery's compact style: 24/28/32px heights, icon on the left, ghost buttons for secondary actions.
import { forwardRef } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cx } from "../cx";
import { Spinner } from "./States";
/**
 * Themed button. Defaults to `type="button"` so it never submits a form by accident.
 * Without children it renders as a square icon-only button.
 */
export const Button = forwardRef(({ variant = "primary", size = "md", icon, loading = false, asChild = false, type = "button", disabled, className, children, ...props }, ref) => {
    if (asChild) {
        return (_jsx(Slot, { ref: ref, "data-variant": variant, "data-size": size, className: cx("fui-button", className), ...props, children: children }));
    }
    return (_jsxs("button", { ref: ref, type: type, disabled: disabled || loading, "aria-busy": loading || undefined, "data-variant": variant, "data-size": size, "data-icon-only": children == null && (icon || loading) ? "" : undefined, className: cx("fui-button", className), ...props, children: [loading ? _jsx(Spinner, { size: "sm" }) : icon, children] }));
});
Button.displayName = "Button";
/** Square icon-only button, ghost by default like Fibery's toolbar buttons. */
export const IconButton = forwardRef(({ variant = "ghost", ...props }, ref) => (_jsx(Button, { ref: ref, variant: variant, ...props })));
IconButton.displayName = "IconButton";
