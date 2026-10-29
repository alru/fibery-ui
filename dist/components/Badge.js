import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// Badges: theme-colored labels (Badge) and labels painted with a user-defined Fibery enum color (EnumBadge).
import { forwardRef } from "react";
import { X } from "lucide-react";
import { cx } from "../cx";
/** Small label colored with the workspace highlight palette (follows light/dark theme). */
export const Badge = forwardRef(({ hue, variant = "soft", caps, onRemove, removeLabel = "Убрать", className, children, ...props }, ref) => (_jsxs("span", { ref: ref, "data-hue": hue, "data-variant": variant, "data-caps": caps ? "" : undefined, className: cx("fui-badge", className), ...props, children: [children, onRemove && (_jsx("button", { type: "button", className: "fui-badge__remove", "aria-label": removeLabel, onClick: onRemove, children: _jsx(X, {}) }))] })));
Badge.displayName = "Badge";
/**
 * Renders a Fibery select/workflow option in its own color. The color is data, not theme,
 * so it is applied as-is and never used as a text background.
 */
export const EnumBadge = forwardRef(({ name, color, variant = "dot", className, style, ...props }, ref) => (_jsxs("span", { ref: ref, "data-variant": variant, className: cx("fui-enum-badge", className), style: color ? { ...style, ["--fui-enum-color"]: color } : style, ...props, children: [variant === "dot" && _jsx("span", { className: "fui-enum-badge__dot", "aria-hidden": true }), name] })));
EnumBadge.displayName = "EnumBadge";
