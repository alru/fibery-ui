import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// Date and time fields that replace the browser's <input type="date"> / <input type="time">, which look different in
// every browser, ignore the theme and spell dates in the browser's locale. Both are a typed text field (the fastest
// way for a known date) with a popover to pick from: a month calendar for DateInput, a list of times for TimeInput.
// Values stay what the native inputs pass around ("YYYY-MM-DD", "HH:MM", "" when empty), so swapping one in changes
// one line of the caller.
import { useEffect, useId, useMemo, useRef, useState, } from "react";
import { CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { cx } from "../cx";
import { addDays, addMonths, calendarDays, clampDay, formatDateText, fromDateInputs, parseDateText, parseTimeText, slotIndexOf, timeSlots, toDateInput, toTimeInput, weekEdge, } from "../dates";
import { Button, IconButton } from "./Button";
import { useKitLang, useKitTexts } from "./KitLang";
import { Popover, PopoverAnchor, PopoverContent } from "./Overlay";
const localeOf = (lang) => (lang === "en" ? "en-GB" : "ru-RU");
const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const noon = (iso) => {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d, 12);
};
const monthName = (lang, month) => capitalize(new Intl.DateTimeFormat(localeOf(lang), { month: "long" }).format(new Date(2026, month, 1, 12)));
// 2 November 2026 is a Monday, so the week header starts there.
const weekdayName = (lang, index, width) => new Intl.DateTimeFormat(localeOf(lang), { weekday: width }).format(new Date(2026, 10, 2 + index, 12)).replace(/\.$/, "");
const dayLabel = (lang, iso) => new Intl.DateTimeFormat(localeOf(lang), { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(noon(iso));
// Focus moved somewhere outside both the field and its (portalled) popover: that is leaving the control.
const leavesControl = (e, ...parts) => {
    const to = e.relatedTarget;
    return !parts.some((part) => part && to && part.contains(to));
};
function FieldFrame({ rootRef, size, invalid, disabled, open, note, icon, buttonLabel, onButton, onBlur, className, children }) {
    return (_jsx(PopoverAnchor, { asChild: true, children: _jsxs("span", { ref: rootRef, "data-size": size, "data-state": open ? "open" : "closed", "data-invalid": invalid ? "" : undefined, "data-disabled": disabled ? "" : undefined, className: cx("fui-date-field", className), onBlur: onBlur, children: [children, note, _jsx("button", { type: "button", 
                    // One tab stop per field: the keyboard opens the popover with ↓ from the text.
                    tabIndex: -1, "aria-label": buttonLabel, disabled: disabled, className: "fui-date-field__button", 
                    // Keep the caret in the text field.
                    onMouseDown: (e) => e.preventDefault(), onClick: onButton, children: icon })] }) }));
}
const YEARS_PAGE = 20;
const yearsPageStart = (year) => Math.floor(year / YEARS_PAGE) * YEARS_PAGE;
/**
 * Date field: type «24.11.2026» (also 24/11/26, 2411, 2026-11-24…) or pick from a calendar that opens on a click or
 * ↓. The short weekday next to the text follows what is typed (`weekday={false}` leaves it out). Calendar: weeks from Monday, today ringed, the picked
 * day in the accent; the caption drills up to months and years for dates far away. Keys in the calendar: arrows,
 * PageUp / PageDown (a month; with Shift a year), Home / End, Enter, Escape. Text that isn't a date (or is outside
 * `min` / `max`) is dropped on leaving and the old value stays.
 */
export function DateInput({ value: rawValue, onChange, min, max, required, placeholder, size = "md", invalid, disabled, id, autoFocus, defaultOpen, weekday: showWeekday = true, onBlur, onKeyDown, className, ...aria }) {
    const lang = useKitLang();
    const t = useKitTexts();
    const value = rawValue ?? "";
    const [text, setText] = useState(() => formatDateText(value));
    const [open, setOpen] = useState(false);
    const [view, setView] = useState("days");
    // The calendar's cursor: the day (and through it the month and year) that keys move and Enter picks.
    const [cursor, setCursor] = useState(() => toDateInput(new Date()));
    const rootRef = useRef(null);
    const inputRef = useRef(null);
    const contentRef = useRef(null);
    const bodyRef = useRef(null);
    // True while the keyboard works in the calendar, so the focused cell follows the cursor.
    const inCalendar = useRef(false);
    const popupId = useId();
    const captionId = useId();
    useEffect(() => setText(formatDateText(value)), [value]);
    const allowed = (iso) => (!min || iso >= min) && (!max || iso <= max);
    const typed = text.trim() ? parseDateText(text) : null;
    const draft = typed && allowed(typed) ? typed : null;
    const shown = draft ?? (value || null);
    const today = toDateInput(new Date());
    const startCursor = () => clampDay(shown ?? today, min, max);
    const openCalendar = (withKeyboard) => {
        if (disabled)
            return;
        setCursor(startCursor());
        setView("days");
        inCalendar.current = withKeyboard;
        setOpen(true);
    };
    const focusCursor = () => contentRef.current?.querySelector("[data-cursor]")?.focus();
    const close = () => {
        inCalendar.current = false;
        setOpen(false);
    };
    // Back to the text field first: focus that sits in a closing popover would fall to the page.
    const closeToField = () => {
        inputRef.current?.focus();
        close();
    };
    // The focused cell follows the cursor while the keyboard is in the grid, and takes over when a view change removed
    // the focused cell; a focused header or footer button keeps its focus.
    useEffect(() => {
        if (!open || !inCalendar.current)
            return;
        const focused = document.activeElement;
        if (focused && contentRef.current?.contains(focused) && !bodyRef.current?.contains(focused))
            return;
        focusCursor();
    }, [open, view, cursor]);
    // Opening on mount (an inline editor) waits for the anchor to be laid out.
    useEffect(() => {
        if (defaultOpen)
            openCalendar(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    const commit = (next) => {
        setText(formatDateText(next));
        if (next !== value)
            onChange(next);
    };
    const commitText = () => {
        if (!text.trim()) {
            if (required)
                setText(formatDateText(value));
            else
                commit("");
            return;
        }
        if (draft)
            commit(draft);
        else
            setText(formatDateText(value));
    };
    const pick = (iso) => {
        if (!allowed(iso))
            return;
        commit(iso);
        closeToField();
    };
    const onInputKey = (e) => {
        // Radix closes the popover on Escape before this handler runs and marks the event as used.
        if (e.key === "Escape" && (open || e.nativeEvent.defaultPrevented)) {
            e.preventDefault();
            close();
            return;
        }
        if (e.key === "ArrowDown" || (e.key === "ArrowUp" && open)) {
            e.preventDefault();
            if (open) {
                inCalendar.current = true;
                setCursor(startCursor());
                focusCursor();
            }
            else
                openCalendar(true);
            return;
        }
        if (e.key === "Enter") {
            commitText();
            close();
        }
        onKeyDown?.(e);
    };
    const onTextChange = (next) => {
        setText(next);
        const iso = next.trim() ? parseDateText(next) : null;
        if (iso && allowed(iso)) {
            setCursor(iso);
            setView("days");
        }
    };
    const leave = (e) => {
        if (!leavesControl(e, rootRef.current, contentRef.current))
            return;
        commitText();
        close();
        onBlur?.();
    };
    // ─ Calendar keys: one handler for the three views; they differ in step sizes only.
    const cursorYear = Number(cursor.slice(0, 4));
    const cursorMonth = Number(cursor.slice(5, 7)) - 1;
    const onCalendarKey = (e) => {
        const k = e.key;
        let next = null;
        if (view === "days") {
            const page = e.shiftKey ? 12 : 1;
            next =
                k === "ArrowLeft" ? addDays(cursor, -1)
                    : k === "ArrowRight" ? addDays(cursor, 1)
                        : k === "ArrowUp" ? addDays(cursor, -7)
                            : k === "ArrowDown" ? addDays(cursor, 7)
                                : k === "Home" ? weekEdge(cursor, "start")
                                    : k === "End" ? weekEdge(cursor, "end")
                                        : k === "PageUp" ? addMonths(cursor, -page)
                                            : k === "PageDown" ? addMonths(cursor, page)
                                                : null;
        }
        else if (view === "months") {
            next =
                k === "ArrowLeft" ? addMonths(cursor, -1)
                    : k === "ArrowRight" ? addMonths(cursor, 1)
                        : k === "ArrowUp" ? addMonths(cursor, -3)
                            : k === "ArrowDown" ? addMonths(cursor, 3)
                                : k === "Home" ? addMonths(cursor, -cursorMonth)
                                    : k === "End" ? addMonths(cursor, 11 - cursorMonth)
                                        : k === "PageUp" ? addMonths(cursor, -12)
                                            : k === "PageDown" ? addMonths(cursor, 12)
                                                : null;
        }
        else {
            const years = (n) => addMonths(cursor, 12 * n);
            const offset = cursorYear - yearsPageStart(cursorYear);
            next =
                k === "ArrowLeft" ? years(-1)
                    : k === "ArrowRight" ? years(1)
                        : k === "ArrowUp" ? years(-4)
                            : k === "ArrowDown" ? years(4)
                                : k === "Home" ? years(-offset)
                                    : k === "End" ? years(YEARS_PAGE - 1 - offset)
                                        : k === "PageUp" ? years(-YEARS_PAGE)
                                            : k === "PageDown" ? years(YEARS_PAGE)
                                                : null;
        }
        if (next) {
            e.preventDefault();
            inCalendar.current = true;
            setCursor(next);
        }
    };
    // Tab past either end of the popover goes back to the text field: the popover lives at the end of the page, and the
    // browser would otherwise move on from there.
    const onPopupKey = (e) => {
        if (e.key !== "Tab" || !contentRef.current)
            return;
        const stops = [...contentRef.current.querySelectorAll("button:not([disabled]):not([tabindex='-1'])")];
        const edge = e.shiftKey ? stops[0] : stops[stops.length - 1];
        if (e.target === edge) {
            e.preventDefault();
            closeToField();
        }
    };
    const up = () => view !== "years" && setView(view === "days" ? "months" : "years");
    const step = (dir) => {
        setCursor(view === "days" ? addMonths(cursor, dir) : view === "months" ? addMonths(cursor, 12 * dir) : addMonths(cursor, 12 * YEARS_PAGE * dir));
    };
    const navLabels = view === "days" ? [t.prevMonth, t.nextMonth] : view === "months" ? [t.prevYear, t.nextYear] : [t.prevYears, t.nextYears];
    const pageStart = yearsPageStart(cursorYear);
    const caption = view === "days" ? `${monthName(lang, cursorMonth)} ${cursorYear}`
        : view === "months" ? String(cursorYear)
            : `${pageStart}–${pageStart + YEARS_PAGE - 1}`;
    const weekday = showWeekday && shown ? weekdayName(lang, (noon(shown).getDay() + 6) % 7, "short") : "";
    const monthAllowed = (y, m) => {
        const first = `${y}-${String(m + 1).padStart(2, "0")}-01`;
        const last = addDays(addMonths(first, 1), -1);
        return (!min || last >= min) && (!max || first <= max);
    };
    const yearAllowed = (y) => (!min || `${y}-12-31` >= min) && (!max || `${y}-01-01` <= max);
    return (_jsxs(Popover, { open: open, onOpenChange: (next) => (next ? openCalendar(false) : close()), children: [_jsx(FieldFrame, { rootRef: rootRef, size: size, invalid: invalid, disabled: disabled, open: open, icon: _jsx(CalendarDays, {}), buttonLabel: t.openCalendar, onButton: () => (open ? close() : openCalendar(false)), onBlur: leave, className: className, note: showWeekday && (_jsx("span", { className: "fui-date-field__note", "aria-hidden": true, children: weekday })), children: _jsx("input", { ref: inputRef, id: id, type: "text", autoComplete: "off", spellCheck: false, role: "combobox", "aria-haspopup": "dialog", "aria-expanded": open, "aria-controls": open ? popupId : undefined, "aria-invalid": invalid || undefined, "aria-label": aria["aria-label"], "aria-describedby": aria["aria-describedby"], "aria-required": required || undefined, autoFocus: autoFocus, disabled: disabled, placeholder: placeholder ?? t.datePlaceholder, className: "fui-date-field__input", value: text, onChange: (e) => onTextChange(e.target.value), onFocus: () => (inCalendar.current = false), onClick: () => !open && openCalendar(false), onKeyDown: onInputKey }) }), _jsxs(PopoverContent, { ref: contentRef, id: popupId, role: "dialog", "aria-label": t.chooseDate, align: "start", className: "fui-calendar", 
                // The caret stays in the text field until the keyboard moves into the calendar.
                onOpenAutoFocus: (e) => {
                    e.preventDefault();
                    if (inCalendar.current)
                        focusCursor();
                }, onCloseAutoFocus: (e) => e.preventDefault(), onEscapeKeyDown: () => inCalendar.current && inputRef.current?.focus(), 
                // Clicks pick without taking focus from the text field (and leave it where the keyboard put it).
                onMouseDown: (e) => e.preventDefault(), 
                // A press on the field itself moves the caret; it must not close and reopen the calendar.
                onInteractOutside: (e) => {
                    if (rootRef.current?.contains(e.target))
                        e.preventDefault();
                }, onKeyDown: onPopupKey, 
                // The popover is portalled: its blur doesn't reach the field's frame.
                onBlur: leave, children: [_jsxs("div", { className: "fui-calendar__header", children: [_jsxs("button", { type: "button", className: "fui-calendar__caption", "aria-label": view === "years" ? caption : `${caption}. ${view === "days" ? t.chooseMonth : t.chooseYear}`, "aria-disabled": view === "years" || undefined, onClick: up, children: [_jsx("span", { id: captionId, "aria-live": "polite", children: caption }), view !== "years" && _jsx(ChevronDown, {})] }), _jsx(IconButton, { icon: _jsx(ChevronLeft, {}), size: "sm", "aria-label": navLabels[0], onClick: () => step(-1) }), _jsx(IconButton, { icon: _jsx(ChevronRight, {}), size: "sm", "aria-label": navLabels[1], onClick: () => step(1) })] }), _jsxs("div", { ref: bodyRef, className: "fui-calendar__body", onKeyDown: onCalendarKey, onFocus: () => (inCalendar.current = true), children: [view === "days" && (_jsxs("div", { role: "grid", "aria-labelledby": captionId, className: "fui-calendar__days", children: [_jsx("div", { role: "row", className: "fui-calendar__row", children: Array.from({ length: 7 }, (_, i) => (_jsx("span", { role: "columnheader", "aria-label": weekdayName(lang, i, "long"), className: "fui-calendar__weekday", children: weekdayName(lang, i, "short") }, i))) }), chunk(calendarDays(cursorYear, cursorMonth), 7).map((week) => (_jsx("div", { role: "row", className: "fui-calendar__row", children: week.map((iso) => {
                                            const selected = iso === shown;
                                            return (_jsx("span", { role: "gridcell", "aria-selected": selected, "aria-disabled": !allowed(iso) || undefined, children: _jsx("button", { type: "button", tabIndex: iso === cursor ? 0 : -1, "aria-label": dayLabel(lang, iso), "aria-current": iso === today ? "date" : undefined, "data-cursor": iso === cursor ? "" : undefined, "data-selected": selected ? "" : undefined, "data-today": iso === today ? "" : undefined, "data-outside": Number(iso.slice(5, 7)) - 1 !== cursorMonth ? "" : undefined, "aria-disabled": !allowed(iso) || undefined, className: "fui-calendar__cell", onClick: () => pick(iso), children: Number(iso.slice(8)) }) }, iso));
                                        }) }, week[0])))] })), view === "months" && (_jsx("div", { role: "grid", "aria-labelledby": captionId, className: "fui-calendar__months", children: chunk([...Array(12).keys()], 3).map((row) => (_jsx("div", { role: "row", className: "fui-calendar__row", children: row.map((m) => {
                                        const selected = shown != null && shown.slice(0, 7) === `${cursorYear}-${String(m + 1).padStart(2, "0")}`;
                                        return (_jsx("span", { role: "gridcell", "aria-selected": selected, children: _jsx("button", { type: "button", tabIndex: m === cursorMonth ? 0 : -1, "data-cursor": m === cursorMonth ? "" : undefined, "data-selected": selected ? "" : undefined, "data-today": today.slice(0, 7) === `${cursorYear}-${String(m + 1).padStart(2, "0")}` ? "" : undefined, "aria-disabled": !monthAllowed(cursorYear, m) || undefined, className: "fui-calendar__cell", onClick: () => {
                                                    if (!monthAllowed(cursorYear, m))
                                                        return;
                                                    setCursor(addMonths(cursor, m - cursorMonth));
                                                    setView("days");
                                                }, children: monthName(lang, m) }) }, m));
                                    }) }, row[0]))) })), view === "years" && (_jsx("div", { role: "grid", "aria-labelledby": captionId, className: "fui-calendar__years", children: chunk(Array.from({ length: YEARS_PAGE }, (_, i) => pageStart + i), 4).map((row) => (_jsx("div", { role: "row", className: "fui-calendar__row", children: row.map((y) => {
                                        const selected = shown != null && Number(shown.slice(0, 4)) === y;
                                        return (_jsx("span", { role: "gridcell", "aria-selected": selected, children: _jsx("button", { type: "button", tabIndex: y === cursorYear ? 0 : -1, "data-cursor": y === cursorYear ? "" : undefined, "data-selected": selected ? "" : undefined, "data-today": Number(today.slice(0, 4)) === y ? "" : undefined, "aria-disabled": !yearAllowed(y) || undefined, className: "fui-calendar__cell", onClick: () => {
                                                    if (!yearAllowed(y))
                                                        return;
                                                    setCursor(addMonths(cursor, 12 * (y - cursorYear)));
                                                    setView("months");
                                                }, children: y }) }, y));
                                    }) }, row[0]))) }))] }), _jsxs("div", { className: "fui-calendar__footer", children: [_jsx(Button, { variant: "ghost", size: "sm", disabled: !allowed(today), onClick: () => pick(today), children: t.today }), !required && (_jsx(Button, { variant: "ghost", size: "sm", disabled: !value && !text, onClick: () => {
                                    commit("");
                                    closeToField();
                                }, children: t.clearValue }))] })] })] }));
}
function chunk(items, size) {
    const rows = [];
    for (let i = 0; i < items.length; i += size)
        rows.push(items.slice(i, i + size));
    return rows;
}
/**
 * Time field, 24-hour: type «15:30» (also 1530, 15.30, 9) or pick from a list of times every `step` minutes that
 * opens on a click or ↓, scrolled to the value (to the current time while empty). ↑ ↓ move through the list, Enter
 * takes the row moved to (or the typed text), Escape closes. Text that isn't a time is dropped on leaving and the old
 * value stays.
 */
export function TimeInput({ value: rawValue, onChange, step = 15, required, placeholder, size = "md", invalid, disabled, id, autoFocus, onBlur, onKeyDown, className, ...aria }) {
    const t = useKitTexts();
    const value = rawValue ?? "";
    const slots = useMemo(() => timeSlots(step), [step]);
    const [text, setText] = useState(value);
    const [open, setOpen] = useState(false);
    const [active, setActive] = useState(0);
    // Enter takes the active row only after the arrows moved to it; otherwise it takes the typed text.
    const [navigated, setNavigated] = useState(false);
    const rootRef = useRef(null);
    const contentRef = useRef(null);
    const listId = useId();
    const optionId = (i) => `${listId}-${i}`;
    useEffect(() => setText(value), [value]);
    const typed = text.trim() ? parseTimeText(text) : null;
    const anchorIndex = () => slotIndexOf(slots, typed ?? (value || toTimeInput(new Date())));
    const openList = () => {
        if (disabled)
            return;
        setActive(anchorIndex());
        setNavigated(false);
        setOpen(true);
    };
    const close = () => setOpen(false);
    // Centre the active row when the list mounts; later moves only scroll as far as needed.
    const listRef = (el) => {
        const row = el?.querySelector("[data-highlighted]");
        if (el && row && !el.dataset.scrolled) {
            el.scrollTop = row.offsetTop - el.clientHeight / 2 + row.offsetHeight / 2;
            el.dataset.scrolled = "";
        }
    };
    const moveTo = (index) => {
        const next = Math.max(0, Math.min(slots.length - 1, index));
        setActive(next);
        document.getElementById(optionId(next))?.scrollIntoView({ block: "nearest" });
    };
    const commit = (next) => {
        setText(next);
        if (next !== value)
            onChange(next);
    };
    const commitText = () => {
        if (!text.trim()) {
            if (required)
                setText(value);
            else
                commit("");
        }
        else if (typed)
            commit(typed);
        else
            setText(value);
    };
    const onInputKey = (e) => {
        if (e.key === "Escape" && (open || e.nativeEvent.defaultPrevented)) {
            e.preventDefault();
            close();
            return;
        }
        const move = { ArrowDown: 1, ArrowUp: -1, PageDown: 4, PageUp: -4 }[e.key];
        if (move) {
            e.preventDefault();
            if (!open)
                openList();
            else {
                setNavigated(true);
                moveTo(active + move);
            }
            return;
        }
        if (e.key === "Enter") {
            if (open && navigated)
                commit(slots[active]);
            else
                commitText();
            close();
        }
        onKeyDown?.(e);
    };
    const onTextChange = (next) => {
        setText(next);
        setNavigated(false);
        const time = next.trim() ? parseTimeText(next) : null;
        if (time && open)
            moveTo(slotIndexOf(slots, time));
    };
    const leave = (e) => {
        if (!leavesControl(e, rootRef.current, contentRef.current))
            return;
        commitText();
        close();
        onBlur?.();
    };
    return (_jsxs(Popover, { open: open, onOpenChange: (next) => (next ? openList() : close()), children: [_jsx(FieldFrame, { rootRef: rootRef, size: size, invalid: invalid, disabled: disabled, open: open, icon: _jsx(Clock, {}), buttonLabel: t.showTimes, onButton: () => (open ? close() : openList()), onBlur: leave, className: cx("fui-date-field--time", className), children: _jsx("input", { id: id, type: "text", inputMode: "numeric", autoComplete: "off", spellCheck: false, role: "combobox", "aria-autocomplete": "none", "aria-expanded": open, "aria-controls": open ? listId : undefined, "aria-activedescendant": open ? optionId(active) : undefined, "aria-invalid": invalid || undefined, "aria-label": aria["aria-label"], "aria-describedby": aria["aria-describedby"], "aria-required": required || undefined, autoFocus: autoFocus, disabled: disabled, placeholder: placeholder ?? t.timePlaceholder, className: "fui-date-field__input", value: text, onChange: (e) => onTextChange(e.target.value), onClick: () => !open && openList(), onKeyDown: onInputKey }) }), _jsx(PopoverContent, { ref: contentRef, align: "start", className: "fui-time-list", 
                // Focus stays in the text field; the list is driven by aria-activedescendant.
                onOpenAutoFocus: (e) => e.preventDefault(), onCloseAutoFocus: (e) => e.preventDefault(), onMouseDown: (e) => e.preventDefault(), onInteractOutside: (e) => {
                    if (rootRef.current?.contains(e.target))
                        e.preventDefault();
                }, onBlur: leave, children: _jsx("div", { ref: listRef, id: listId, role: "listbox", "aria-label": aria["aria-label"] ?? t.time, className: "fui-time-list__scroll", children: slots.map((slot, i) => {
                        const selected = slot === value;
                        return (_jsxs("div", { id: optionId(i), role: "option", "aria-selected": selected, "data-highlighted": i === active ? "" : undefined, "data-selected": selected ? "" : undefined, className: "fui-time-list__option", onMouseMove: () => i !== active && setActive(i), onClick: () => {
                                commit(slot);
                                close();
                            }, children: [slot, selected && _jsx(Check, {})] }, slot));
                    }) }) })] }));
}
/**
 * A date and a time as one value: DateInput with TimeInput beside it, the date taking the spare width. Picking a date
 * keeps the time; a time without a date goes on today.
 */
export function DateTimeInput({ value, onChange, required, size = "md", invalid, disabled, id, className, ...props }) {
    const t = useKitTexts();
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
    return (_jsxs("div", { role: "group", "aria-label": props["aria-label"], className: cx("fui-date-time", className), children: [_jsx(DateInput, { id: id, size: size, "aria-label": t.date, value: value ? toDateInput(value) : "", required: required, invalid: invalid, disabled: disabled, onChange: setDate }), _jsx(TimeInput, { size: size, required: true, "aria-label": t.time, value: value ? toTimeInput(value) : "", invalid: invalid, disabled: disabled, onChange: setTime })] }));
}
