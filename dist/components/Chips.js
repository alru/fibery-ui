import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ChevronDown } from "lucide-react";
import { cx } from "../cx";
import { formatQuickDate, fromDateInputs, matchQuickTerm, toDateInput, toTimeInput } from "../dates";
import { Button } from "./Button";
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
// Value of the "now" / "today" chip; term ids are the app's own and never start with "fui:".
const NOW = "fui:now";
/**
 * Date (and time) field with quick choices (owner, 2026-11-27): the date and time inputs on top, the quick-term chips
 * under them, then the picked date spelled out (`preview`). A value keeps its chip picked while it stays on that
 * chip's day. The chips never change size, so nothing shifts.
 */
export function QuickDate({ terms = [], value, onChange, withTime = true, now, preview = true, size = "md", invalid, disabled, id, className, ...props }) {
    const lang = useKitLang();
    const t = useKitTexts();
    const nowLabel = withTime ? t.nowAction : t.today;
    const match = matchQuickTerm(terms, value);
    const choose = (choice) => {
        if (choice === NOW)
            return onChange(new Date());
        const term = terms.find((x) => x.id === choice);
        if (term)
            onChange(term.date);
    };
    const setDate = (date) => {
        if (!date)
            return onChange(null);
        const next = fromDateInputs(date, value && withTime ? toTimeInput(value) : "");
        if (next)
            onChange(next);
    };
    const setTime = (time) => {
        const next = fromDateInputs(toDateInput(value ?? new Date()), time);
        if (next)
            onChange(next);
    };
    const chips = [...(now ? [{ value: NOW, label: nowLabel }] : []), ...terms.map((x) => ({ value: x.id, label: x.label }))];
    return (_jsxs("div", { role: "group", "aria-label": props["aria-label"], "data-invalid": invalid ? "" : undefined, className: cx("fui-quick-date", className), children: [_jsxs("div", { className: "fui-date-time", children: [_jsx(DateInput, { id: id, size: size, "aria-label": t.date, value: value ? toDateInput(value) : "", invalid: invalid, disabled: disabled, onChange: setDate }), withTime && (_jsx(TimeInput, { size: size, required: true, "aria-label": t.time, value: value ? toTimeInput(value) : "", invalid: invalid, disabled: disabled, onChange: setTime })), now && terms.length === 0 && (_jsx(Button, { variant: "outline", size: size === "sm" ? "md" : "lg", disabled: disabled, onClick: () => choose(NOW), children: nowLabel }))] }), terms.length > 0 && _jsx(ChipGroup, { "aria-label": t.quickDates, options: chips, value: match?.id ?? null, onValueChange: choose, disabled: disabled }), preview && (_jsx("span", { className: "fui-quick-date__resolved", "data-empty": value ? undefined : "", "aria-live": "polite", children: value ? formatQuickDate(value, lang, withTime) : t.dateNotSet }))] }));
}
