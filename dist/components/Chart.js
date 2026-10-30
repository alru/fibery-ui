import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cx } from "../cx";
const share = (value, total) => (total > 0 ? `${Math.round((value / total) * 100)}%` : "");
/**
 * Rows of "label, bar, value, share". The label column has a fixed width (`--fui-bar-label`, default 13rem), so bars
 * don't move when rows come and go with filters; long labels end with "…".
 */
export function BarList({ items, max, total, hue, className, style }) {
    const full = max ?? Math.max(0, ...items.map((i) => i.value));
    return (_jsx("ul", { className: cx("fui-bar-list", "fui-chart-hue", className), "data-hue": hue, "data-share": total != null ? "" : undefined, style: style, children: items.map((item) => {
            const content = (_jsxs(_Fragment, { children: [_jsxs("span", { className: "fui-bar-list__label", "data-muted": item.muted ? "" : undefined, children: [_jsx("span", { className: "fui-bar-list__text", title: typeof item.label === "string" ? item.label : undefined, children: item.label }), item.placeholder && _jsx("span", { className: "fui-bar-list__note", children: item.placeholder })] }), _jsx("span", { className: "fui-bar-list__track", children: _jsx("span", { className: "fui-bar-list__bar", "data-placeholder": item.placeholder ? "" : undefined, style: { width: `${full > 0 ? (item.value / full) * 100 : 0}%` } }) }), _jsx("span", { className: "fui-bar-list__value", "data-empty": item.value ? undefined : "", children: item.value || "—" }), total != null && _jsx("span", { className: "fui-bar-list__share", children: share(item.value, total) })] }));
            return (_jsx("li", { children: item.onClick && item.value ? (_jsx("button", { type: "button", className: "fui-bar-list__row", "data-interactive": "", onClick: item.onClick, children: content })) : (_jsx("div", { className: "fui-bar-list__row", children: content })) }, item.key));
        }) }));
}
/** One bar split into parts, with a legend of "swatch, label, value, share" under it. */
export function StackedBar({ segments, className }) {
    const total = segments.reduce((sum, s) => sum + s.value, 0);
    return (_jsxs("div", { className: cx("fui-stacked", className), children: [_jsx("div", { className: "fui-stacked__bar", "aria-hidden": true, children: segments
                    .filter((s) => s.value > 0)
                    .map((s) => (_jsx("span", { className: "fui-stacked__segment fui-chart-hue", "data-hue": s.hue, style: { flexGrow: s.value } }, s.key))) }), _jsx("ul", { className: "fui-stacked__legend", children: segments.map((s) => {
                    const content = (_jsxs(_Fragment, { children: [_jsx("span", { className: "fui-stacked__swatch fui-chart-hue", "data-hue": s.hue }), _jsx("span", { className: "fui-stacked__label", children: s.label }), _jsx("span", { className: "fui-stacked__value", children: s.value }), _jsx("span", { className: "fui-stacked__share", children: share(s.value, total) })] }));
                    return (_jsx("li", { children: s.onClick && s.value ? (_jsx("button", { type: "button", className: "fui-stacked__item", "data-interactive": "", onClick: s.onClick, children: content })) : (_jsx("span", { className: "fui-stacked__item", children: content })) }, s.key));
                }) })] }));
}
// Height of the tallest bar in px; both sides share the scale, so the axis sits where the data puts it.
const PLOT = 112;
function FlowBar({ value, scale, side, name, label, onClick }) {
    if (!value)
        return null;
    const parts = (_jsxs(_Fragment, { children: [_jsx("span", { className: "fui-flow__value", children: value }), _jsx("span", { className: "fui-flow__bar", style: { height: Math.max(2, (value / scale) * PLOT) } })] }));
    return onClick ? (_jsx("button", { type: "button", className: "fui-flow__stack", "data-side": side, "data-interactive": "", onClick: onClick, "aria-label": `${label}, ${name}: ${value}`, children: parts })) : (_jsx("span", { className: "fui-flow__stack", "data-side": side, "aria-label": `${label}, ${name}: ${value}`, role: "img", children: parts }));
}
/**
 * Per-period flow: `up` bars rise above the axis, `down` bars hang below it, each with its number; an optional level
 * line runs above them with its value at every point. Scrolls sideways when the periods don't fit (36px each at least).
 */
export function FlowChart({ periods, upLabel, downLabel, levelLabel, upHue = "green", downHue = "red", className }) {
    const upMax = Math.max(0, ...periods.map((p) => p.up));
    const downMax = Math.max(0, ...periods.map((p) => p.down));
    const scale = Math.max(1, upMax, downMax);
    const levels = periods.map((p) => p.level).filter((v) => v != null);
    const hasLevel = levelLabel != null && levels.length === periods.length && periods.length > 0;
    const levelMin = Math.min(...levels);
    const levelMax = Math.max(...levels);
    // Level y in % of its band, 0 at the top; the top 30% stay free for the value above the highest point, and a flat
    // line sits in the middle of the rest.
    const levelY = (v) => (levelMax > levelMin ? 88 - ((v - levelMin) / (levelMax - levelMin)) * 58 : 59);
    const sum = (pick) => periods.reduce((total, p) => total + pick(p), 0);
    return (_jsxs("div", { className: cx("fui-flow", className), children: [_jsxs("ul", { className: "fui-flow__legend", children: [_jsxs("li", { children: [_jsx("span", { className: "fui-flow__swatch fui-chart-hue", "data-hue": upHue }), upLabel, " ", _jsx("b", { children: sum((p) => p.up) })] }), _jsxs("li", { children: [_jsx("span", { className: "fui-flow__swatch fui-chart-hue", "data-hue": downHue }), downLabel, " ", _jsx("b", { children: sum((p) => p.down) })] }), hasLevel && (_jsxs("li", { children: [_jsx("span", { className: "fui-flow__swatch", "data-line": "" }), levelLabel] }))] }), _jsx("div", { className: "fui-flow__scroll", children: _jsxs("div", { className: "fui-flow__plot", style: { "--fui-flow-n": periods.length, "--fui-flow-up": `${(upMax / scale) * PLOT}px`, "--fui-flow-down": `${(downMax / scale) * PLOT}px` }, children: [hasLevel && (_jsx("svg", { className: "fui-flow__line", viewBox: `0 0 ${periods.length} 100`, preserveAspectRatio: "none", "aria-hidden": true, children: _jsx("polyline", { points: periods.map((p, i) => `${i + 0.5},${levelY(p.level)}`).join(" "), vectorEffect: "non-scaling-stroke" }) })), periods.map((p) => (_jsxs("div", { className: "fui-flow__column", children: [hasLevel && (_jsx("div", { className: "fui-flow__band", children: _jsx("span", { className: "fui-flow__level", style: { top: `${levelY(p.level)}%` }, children: _jsx("span", { className: "fui-flow__level-value", children: p.level }) }) })), _jsx("div", { className: "fui-flow__up fui-chart-hue", "data-hue": upHue, children: _jsx(FlowBar, { value: p.up, scale: scale, side: "up", name: p.name, label: upLabel, onClick: p.onUpClick }) }), _jsx("div", { className: "fui-flow__down fui-chart-hue", "data-hue": downHue, children: _jsx(FlowBar, { value: p.down, scale: scale, side: "down", name: p.name, label: downLabel, onClick: p.onDownClick }) }), _jsx("span", { className: "fui-flow__period", children: p.label })] }, p.key)))] }) })] }));
}
