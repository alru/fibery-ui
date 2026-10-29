import { jsx as _jsx } from "react/jsx-runtime";
import { cx } from "../cx";
/** Number with a background from almost transparent (at `min`) to the strongest tint (at `max`). */
export function HeatValue({ value, min, max, hue = "blue", className }) {
    if (!value)
        return _jsx("span", { className: cx("fui-heat", className), "data-empty": "", children: "\u2014" });
    // Equal min and max (a single distinct value) shows at full strength rather than invisible.
    const heat = max > min ? Math.min(1, Math.max(0, (value - min) / (max - min))) : 1;
    return (_jsx("span", { className: cx("fui-heat", className), "data-hue": hue, style: { "--fui-heat": heat }, children: value }));
}
