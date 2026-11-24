import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// Choice chips: ChipGroup — separate small chips that wrap, one value at a time, the rest in a «ещё ▾» menu — and
// QuickDate on top of it: quick terms ("Tomorrow", "+1 week"), «Дата…» for any date and time (the kit's DateInput and
// TimeInput), and the resolved date spelled out under the chips.
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cx } from "../cx";
import { formatQuickDate, fromDateInputs, matchQuickTerm, toDateInput, toTimeInput } from "../dates";
import { DateInput, TimeInput } from "./DatePicker";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./Overlay";
import { useKitLang, useKitTexts } from "./KitLang";
/**
 * Row of separate 24px chips with wrapping, one picked at a time (the picked one in the accent color: it is a choice,
 * not a code). A radio group: arrow keys move the choice. Unlike SegmentedControl (one joined strip that never
 * wraps), it fits many options, e.g. channels or date terms.
 */
export function ChipGroup({ options, value, onValueChange, visible, deselectable, disabled, className, ...props }) {
    const t = useKitTexts();
    const shown = visible != null && visible < options.length ? options.slice(0, visible) : options;
    const hidden = options.slice(shown.length);
    const hiddenPick = hidden.find((o) => o.value === value);
    const focusIndex = Math.max(0, shown.findIndex((o) => o.value === value));
    const pick = (option) => onValueChange(deselectable && option === value ? null : option);
    const onKeyDown = (e) => {
        const step = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
        const chip = e.target;
        if (!step || !(chip instanceof HTMLElement) || chip.getAttribute("role") !== "radio")
            return;
        e.preventDefault();
        const from = shown.findIndex((o) => o.value === chip.dataset.value);
        const next = shown[(from + step + shown.length) % shown.length];
        onValueChange(next.value);
        e.currentTarget.querySelector(`[data-value="${CSS.escape(next.value)}"]`)?.focus();
    };
    return (_jsxs("div", { role: "radiogroup", "aria-label": props["aria-label"], className: cx("fui-chips", className), onKeyDown: onKeyDown, children: [shown.map((option, i) => {
                const on = option.value === value;
                return (_jsxs("button", { type: "button", role: "radio", "aria-checked": on, tabIndex: i === focusIndex ? 0 : -1, "data-value": option.value, "data-picked": on ? "" : undefined, title: option.title, disabled: disabled, className: "fui-chip", onClick: () => pick(option.value), children: [option.glyph, option.label] }, option.value));
            }), hidden.length > 0 && (_jsxs(DropdownMenu, { children: [_jsx(DropdownMenuTrigger, { asChild: true, children: _jsxs("button", { type: "button", className: "fui-chip", "data-picked": hiddenPick ? "" : undefined, disabled: disabled, children: [hiddenPick ? (_jsxs(_Fragment, { children: [hiddenPick.glyph, hiddenPick.label] })) : (t.more), _jsx(ChevronDown, {})] }) }), _jsx(DropdownMenuContent, { children: hidden.map((option) => (_jsx(DropdownMenuItem, { icon: option.glyph, title: option.title, onSelect: () => pick(option.value), children: option.label }, option.value))) })] }))] }));
}
// Value of the «Дата…» chip; term ids are the app's own and never start with "fui:".
const CUSTOM = "fui:date";
/**
 * Date field for planning: quick-term chips, «Дата…» / "Date…" for a DateInput (and a TimeInput), and the resolved
 * date spelled out under the chips — «пн 24 ноября, 10:00» — which also opens the inputs to adjust the time. A value
 * keeps its chip picked while it stays on that chip's day. The chips never change size, so nothing shifts.
 */
export function QuickDate({ terms, value, onChange, withTime = true, invalid, disabled, className, ...props }) {
    const lang = useKitLang();
    const t = useKitTexts();
    const [custom, setCustom] = useState(false);
    const match = matchQuickTerm(terms, value);
    const open = custom || (value != null && !match);
    const picked = open ? CUSTOM : (match?.id ?? null);
    const choose = (id) => {
        if (id === CUSTOM) {
            setCustom(true);
            return;
        }
        const term = terms.find((x) => x.id === id);
        if (!term)
            return;
        setCustom(false);
        onChange(term.date);
    };
    const setDate = (date) => {
        if (!date)
            return onChange(null);
        const next = fromDateInputs(date, value ? toTimeInput(value) : "");
        if (next)
            onChange(next);
    };
    const setTime = (time) => {
        const next = fromDateInputs(toDateInput(value ?? new Date()), time);
        if (next)
            onChange(next);
    };
    return (_jsxs("div", { "data-invalid": invalid ? "" : undefined, className: cx("fui-quick-date", className), children: [_jsx(ChipGroup, { "aria-label": props["aria-label"], options: [...terms.map((x) => ({ value: x.id, label: x.label })), { value: CUSTOM, label: t.pickDate }], value: picked, onValueChange: choose, disabled: disabled }), open && (_jsxs("div", { className: "fui-quick-date__inputs", children: [_jsx(DateInput, { size: "sm", "aria-label": t.date, value: value ? toDateInput(value) : "", invalid: invalid, disabled: disabled, onChange: setDate }), withTime && (_jsx(TimeInput, { size: "sm", required: true, "aria-label": t.time, value: value ? toTimeInput(value) : "", disabled: disabled, onChange: setTime }))] })), _jsx("button", { type: "button", className: "fui-quick-date__resolved", "data-empty": value ? undefined : "", disabled: disabled, onClick: () => choose(CUSTOM), children: _jsx("span", { "aria-live": "polite", children: value ? formatQuickDate(value, lang, withTime) : t.dateNotSet }) })] }));
}
