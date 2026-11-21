import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// Badges and marks: theme-colored labels and pills (Badge), Fibery options on theme hues (OptionBadge), labels painted
// with an option's own color (EnumBadge), 8px dots (Dot), the progress ring of a workflow state (StageGlyph) and emoji
// that are left out where the browser can't draw them (Emoji).
import { forwardRef } from "react";
import { X } from "lucide-react";
import { cx } from "../cx";
import { emojiRenders, fiberyEmoji, fiberyHue } from "../colors";
import { sectorPath } from "../glyphs";
import { useKitTexts } from "./KitLang";
/** Small label colored with the workspace highlight palette (follows light/dark theme). */
export const Badge = forwardRef(({ hue, variant = "soft", caps, shape = "rect", wrap, onRemove, removeLabel, className, children, ...props }, ref) => {
    const t = useKitTexts();
    return (_jsxs("span", { ref: ref, "data-hue": hue, "data-variant": variant, "data-caps": caps ? "" : undefined, "data-shape": shape === "pill" ? "pill" : undefined, "data-wrap": wrap ? "" : undefined, className: cx("fui-badge", className), ...props, children: [children, onRemove && (_jsx("button", { type: "button", className: "fui-badge__remove", "aria-label": removeLabel ?? t.remove, onClick: onRemove, children: _jsx(X, {}) }))] }));
});
Badge.displayName = "Badge";
/**
 * Renders a Fibery select/workflow option in its own color. The color is data, not theme,
 * so it is applied as-is and never used as a text background.
 */
export const EnumBadge = forwardRef(({ name, color, variant = "dot", wrap, className, style, ...props }, ref) => (_jsxs("span", { ref: ref, "data-variant": variant, "data-wrap": wrap ? "" : undefined, className: cx("fui-enum-badge", className), style: color ? { ...style, ["--fui-enum-color"]: color } : style, ...props, children: [variant === "dot" && _jsx("span", { className: "fui-enum-badge__dot", "aria-hidden": true }), variant === "circle" ? _jsx("span", { className: "fui-enum-badge__letter", children: name }) : _jsx("span", { className: "fui-enum-badge__name", children: name })] })));
EnumBadge.displayName = "EnumBadge";
/**
 * Small round mark in a theme hue: an attribute or a secondary state next to its text ("● Outbound"). Decorative
 * by default (`aria-hidden`); give it `aria-label` when nothing next to it says what it means.
 */
export const Dot = forwardRef(({ hue, variant = "filled", size = "sm", className, ...props }, ref) => (_jsx("span", { ref: ref, "aria-hidden": props["aria-label"] ? undefined : true, role: props["aria-label"] ? "img" : undefined, "data-hue": hue, "data-variant": variant, "data-size": size, className: cx("fui-dot", className), ...props })));
Dot.displayName = "Dot";
/**
 * A Fibery select or workflow option in the owner's colors and emoji, drawn with the theme's highlight hues (so light
 * and dark themes work): `fiberyHue(color)` picks the hue, `fiberyEmoji(icon)` the emoji (left out where the browser
 * can't draw it). No color → neutral badge (or a grey dot).
 */
export const OptionBadge = forwardRef(({ name, color, icon, fallbackHue, variant = "soft", glyph, shape = "rect", wrap, className, ...props }, ref) => {
    const hue = fiberyHue(color) ?? fallbackHue;
    const mark = glyph ?? _jsx(Emoji, { char: fiberyEmoji(icon) });
    if (variant === "dot") {
        return (_jsxs("span", { ref: ref, "data-wrap": wrap ? "" : undefined, className: cx("fui-option-dot", className), ...props, children: [_jsx(Dot, { hue: hue ?? "grey" }), mark, _jsx("span", { className: "fui-option-dot__name", children: name })] }));
    }
    return (_jsxs(Badge, { ref: ref, hue: hue, variant: variant, shape: shape, wrap: wrap ?? shape === "pill", className: cx("fui-option-badge", className), ...props, children: [mark, _jsx("span", { className: "fui-option-badge__name", children: name })] }));
});
OptionBadge.displayName = "OptionBadge";
/**
 * 12px progress ring of a workflow state, like Fibery's state icons: how far a record has come, readable without
 * the state's name. Drawn in `currentColor`; inside a neutral Badge it takes the muted text color.
 */
export function StageGlyph({ type, step = 0, steps = 1, className, ...props }) {
    const label = props["aria-label"];
    const sector = type === "started" ? sectorPath(step, steps) : "";
    return (_jsxs("svg", { viewBox: "0 0 12 12", width: "12", height: "12", fill: "none", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", role: label ? "img" : undefined, "aria-label": label, "aria-hidden": label ? undefined : true, "data-type": type, className: cx("fui-stage-glyph", className), children: [_jsx("circle", { cx: "6", cy: "6", r: "5", strokeWidth: "1.25" }), sector && _jsx("path", { d: sector, fill: "currentColor", stroke: "none" }), type === "finished" && _jsx("path", { d: "M3.8 6.1 5.3 7.6 8.2 4.6", strokeWidth: "1.4" }), type === "paused" && _jsx("path", { d: "M4.9 4.2v3.6M7.1 4.2v3.6", strokeWidth: "1.4" }), type === "failed" && _jsx("path", { d: "m4.4 4.4 3.2 3.2m0-3.2-3.2 3.2", strokeWidth: "1.4" })] }));
}
/**
 * An emoji at 12px in a 14px box, e.g. a channel's before its name. Renders nothing where the browser can't draw it
 * (`emojiRenders`): an empty box is worse than no mark, and the name next to it carries the meaning.
 */
export function Emoji({ char, label, className, ...props }) {
    if (!char || !emojiRenders(char))
        return null;
    return (_jsx("span", { role: label ? "img" : undefined, "aria-label": label, "aria-hidden": label ? undefined : true, className: cx("fui-emoji-mark", className), ...props, children: char }));
}
