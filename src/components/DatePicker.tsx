// Date and time fields that replace the browser's <input type="date"> / <input type="time">, which look different in
// every browser, ignore the theme and spell dates in the browser's locale. Both are a typed text field (the fastest
// way for a known date) with a popover to pick from: a month calendar for DateInput, a list of times for TimeInput.
// Values stay what the native inputs pass around ("YYYY-MM-DD", "HH:MM", "" when empty), so swapping one in changes
// one line of the caller.
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  type Ref,
} from "react";
import {CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, Clock} from "lucide-react";
import {cx} from "../cx";
import {
  addDays,
  addMonths,
  calendarDays,
  clampDay,
  formatDateText,
  fromDateInputs,
  parseDateText,
  parseTimeText,
  slotIndexOf,
  timeSlots,
  toDateInput,
  toTimeInput,
  weekEdge,
} from "../dates";
import type {KitLang} from "../i18n";
import {Button, IconButton} from "./Button";
import {useKitLang, useKitTexts} from "./KitLang";
import {Popover, PopoverAnchor, PopoverContent} from "./Overlay";

type FieldCommonProps = {
  /** Called when the field is left with the value it got: a pick, Enter, Today / Clear or leaving the typed text. */
  onChange: (value: string) => void;
  /** Hides «Очистить» / "Clear", and an emptied field gets its value back instead of clearing it. */
  required?: boolean;
  placeholder?: string;
  size?: "sm" | "md";
  /** Red ring; also sets `aria-invalid`. */
  invalid?: boolean;
  disabled?: boolean;
  /** Goes on the text field, so a Field's `htmlFor` focuses it. */
  id?: string;
  "aria-label"?: string;
  "aria-describedby"?: string;
  autoFocus?: boolean;
  /** Focus left the field and its popover (moving between them doesn't count). */
  onBlur?: () => void;
  /** Keys of the text field the picker didn't use itself (Escape that closed the popover is used). */
  onKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void;
  className?: string;
};

const localeOf = (lang: KitLang) => (lang === "en" ? "en-GB" : "ru-RU");
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const noon = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d, 12);
};
const monthName = (lang: KitLang, month: number) =>
  capitalize(new Intl.DateTimeFormat(localeOf(lang), {month: "long"}).format(new Date(2026, month, 1, 12)));
// 2 November 2026 is a Monday, so the week header starts there.
const weekdayName = (lang: KitLang, index: number, width: "short" | "long") =>
  new Intl.DateTimeFormat(localeOf(lang), {weekday: width}).format(new Date(2026, 10, 2 + index, 12)).replace(/\.$/, "");
const dayLabel = (lang: KitLang, iso: string) =>
  new Intl.DateTimeFormat(localeOf(lang), {weekday: "long", day: "numeric", month: "long", year: "numeric"}).format(noon(iso));

// Focus moved somewhere outside both the field and its (portalled) popover: that is leaving the control.
const leavesControl = (e: FocusEvent<HTMLElement>, ...parts: (HTMLElement | null)[]) => {
  const to = e.relatedTarget as Node | null;
  return !parts.some((part) => part && to && part.contains(to));
};

// The field's frame: a text input, an optional muted note and the button that opens the popover.
type FrameProps = {
  rootRef: Ref<HTMLSpanElement>;
  size: "sm" | "md";
  invalid?: boolean;
  disabled?: boolean;
  open: boolean;
  note?: ReactNode;
  icon: ReactNode;
  buttonLabel: string;
  onButton: () => void;
  onBlur: (e: FocusEvent<HTMLElement>) => void;
  className?: string;
  children: ReactNode;
};

function FieldFrame({rootRef, size, invalid, disabled, open, note, icon, buttonLabel, onButton, onBlur, className, children}: FrameProps) {
  return (
    <PopoverAnchor asChild>
      <span
        ref={rootRef}
        data-size={size}
        data-state={open ? "open" : "closed"}
        data-invalid={invalid ? "" : undefined}
        data-disabled={disabled ? "" : undefined}
        className={cx("fui-date-field", className)}
        onBlur={onBlur}
      >
        {children}
        {note}
        <button
          type="button"
          // One tab stop per field: the keyboard opens the popover with ↓ from the text.
          tabIndex={-1}
          aria-label={buttonLabel}
          disabled={disabled}
          className="fui-date-field__button"
          // Keep the caret in the text field.
          onMouseDown={(e) => e.preventDefault()}
          onClick={onButton}
        >
          {icon}
        </button>
      </span>
    </PopoverAnchor>
  );
}

// ─── DateInput ───────────────────────────────────────────────────────────────

type View = "days" | "months" | "years";
const YEARS_PAGE = 20;
const yearsPageStart = (year: number) => Math.floor(year / YEARS_PAGE) * YEARS_PAGE;

export type DateInputProps = FieldCommonProps & {
  /** "YYYY-MM-DD", as Fibery stores a date field and the native date input passes it; "" or `null` — empty. */
  value: string | null | undefined;
  /** Earliest and latest allowed days, "YYYY-MM-DD"; other days can't be picked and typing them is refused. */
  min?: string;
  max?: string;
  /** Opens the calendar on mount, e.g. right after the user asked to edit the date. */
  defaultOpen?: boolean;
  /**
   * The short weekday after the date; on by default (deadlines, meetings). `false` leaves it out where it is noise,
   * e.g. a birth date or a range filter.
   */
  weekday?: boolean;
};

/**
 * Date field: type «24.11.2026» (also 24/11/26, 2411, 2026-11-24…) or pick from a calendar that opens on a click or
 * ↓. The short weekday next to the text follows what is typed (`weekday={false}` leaves it out). Calendar: weeks from Monday, today ringed, the picked
 * day in the accent; the caption drills up to months and years for dates far away. Keys in the calendar: arrows,
 * PageUp / PageDown (a month; with Shift a year), Home / End, Enter, Escape. Text that isn't a date (or is outside
 * `min` / `max`) is dropped on leaving and the old value stays.
 */
export function DateInput({
  value: rawValue,
  onChange,
  min,
  max,
  required,
  placeholder,
  size = "md",
  invalid,
  disabled,
  id,
  autoFocus,
  defaultOpen,
  weekday: showWeekday = true,
  onBlur,
  onKeyDown,
  className,
  ...aria
}: DateInputProps) {
  const lang = useKitLang();
  const t = useKitTexts();
  const value = rawValue ?? "";
  const [text, setText] = useState(() => formatDateText(value));
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>("days");
  // The calendar's cursor: the day (and through it the month and year) that keys move and Enter picks.
  const [cursor, setCursor] = useState(() => toDateInput(new Date()));
  const rootRef = useRef<HTMLSpanElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  // True while the keyboard works in the calendar, so the focused cell follows the cursor.
  const inCalendar = useRef(false);
  const popupId = useId();
  const captionId = useId();

  useEffect(() => setText(formatDateText(value)), [value]);

  const allowed = (iso: string) => (!min || iso >= min) && (!max || iso <= max);
  const typed = text.trim() ? parseDateText(text) : null;
  const draft = typed && allowed(typed) ? typed : null;
  const shown = draft ?? (value || null);
  const today = toDateInput(new Date());

  const startCursor = () => clampDay(shown ?? today, min, max);
  const openCalendar = (withKeyboard: boolean) => {
    if (disabled) return;
    setCursor(startCursor());
    setView("days");
    inCalendar.current = withKeyboard;
    setOpen(true);
  };
  const focusCursor = () => contentRef.current?.querySelector<HTMLElement>("[data-cursor]")?.focus();
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
    if (!open || !inCalendar.current) return;
    const focused = document.activeElement;
    if (focused && contentRef.current?.contains(focused) && !bodyRef.current?.contains(focused)) return;
    focusCursor();
  }, [open, view, cursor]);

  // Opening on mount (an inline editor) waits for the anchor to be laid out.
  useEffect(() => {
    if (defaultOpen) openCalendar(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const commit = (next: string) => {
    setText(formatDateText(next));
    if (next !== value) onChange(next);
  };
  const commitText = () => {
    if (!text.trim()) {
      if (required) setText(formatDateText(value));
      else commit("");
      return;
    }
    if (draft) commit(draft);
    else setText(formatDateText(value));
  };
  const pick = (iso: string) => {
    if (!allowed(iso)) return;
    commit(iso);
    closeToField();
  };

  const onInputKey = (e: KeyboardEvent<HTMLInputElement>) => {
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
      } else openCalendar(true);
      return;
    }
    if (e.key === "Enter") {
      commitText();
      close();
    }
    onKeyDown?.(e);
  };

  const onTextChange = (next: string) => {
    setText(next);
    const iso = next.trim() ? parseDateText(next) : null;
    if (iso && allowed(iso)) {
      setCursor(iso);
      setView("days");
    }
  };

  const leave = (e: FocusEvent<HTMLElement>) => {
    if (!leavesControl(e, rootRef.current, contentRef.current)) return;
    commitText();
    close();
    onBlur?.();
  };

  // ─ Calendar keys: one handler for the three views; they differ in step sizes only.
  const cursorYear = Number(cursor.slice(0, 4));
  const cursorMonth = Number(cursor.slice(5, 7)) - 1;
  const onCalendarKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const k = e.key;
    let next: string | null = null;
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
    } else if (view === "months") {
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
    } else {
      const years = (n: number) => addMonths(cursor, 12 * n);
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
  const onPopupKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Tab" || !contentRef.current) return;
    const stops = [...contentRef.current.querySelectorAll<HTMLElement>("button:not([disabled]):not([tabindex='-1'])")];
    const edge = e.shiftKey ? stops[0] : stops[stops.length - 1];
    if (e.target === edge) {
      e.preventDefault();
      closeToField();
    }
  };

  const up = () => view !== "years" && setView(view === "days" ? "months" : "years");
  const step = (dir: -1 | 1) => {
    setCursor(view === "days" ? addMonths(cursor, dir) : view === "months" ? addMonths(cursor, 12 * dir) : addMonths(cursor, 12 * YEARS_PAGE * dir));
  };
  const navLabels =
    view === "days" ? [t.prevMonth, t.nextMonth] : view === "months" ? [t.prevYear, t.nextYear] : [t.prevYears, t.nextYears];
  const pageStart = yearsPageStart(cursorYear);
  const caption =
    view === "days" ? `${monthName(lang, cursorMonth)} ${cursorYear}`
    : view === "months" ? String(cursorYear)
    : `${pageStart}–${pageStart + YEARS_PAGE - 1}`;

  const weekday = showWeekday && shown ? weekdayName(lang, (noon(shown).getDay() + 6) % 7, "short") : "";
  const monthAllowed = (y: number, m: number) => {
    const first = `${y}-${String(m + 1).padStart(2, "0")}-01`;
    const last = addDays(addMonths(first, 1), -1);
    return (!min || last >= min) && (!max || first <= max);
  };
  const yearAllowed = (y: number) => (!min || `${y}-12-31` >= min) && (!max || `${y}-01-01` <= max);

  return (
    <Popover open={open} onOpenChange={(next) => (next ? openCalendar(false) : close())}>
      <FieldFrame
        rootRef={rootRef}
        size={size}
        invalid={invalid}
        disabled={disabled}
        open={open}
        icon={<CalendarDays />}
        buttonLabel={t.openCalendar}
        onButton={() => (open ? close() : openCalendar(false))}
        onBlur={leave}
        className={className}
        note={
          showWeekday && (
            <span className="fui-date-field__note" aria-hidden>
              {weekday}
            </span>
          )
        }
      >
        <input
          ref={inputRef}
          id={id}
          type="text"
          autoComplete="off"
          spellCheck={false}
          role="combobox"
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls={open ? popupId : undefined}
          aria-invalid={invalid || undefined}
          aria-label={aria["aria-label"]}
          aria-describedby={aria["aria-describedby"]}
          aria-required={required || undefined}
          autoFocus={autoFocus}
          disabled={disabled}
          placeholder={placeholder ?? t.datePlaceholder}
          className="fui-date-field__input"
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          onFocus={() => (inCalendar.current = false)}
          onClick={() => !open && openCalendar(false)}
          onKeyDown={onInputKey}
        />
      </FieldFrame>
      <PopoverContent
        ref={contentRef}
        id={popupId}
        role="dialog"
        aria-label={t.chooseDate}
        align="start"
        className="fui-calendar"
        // The caret stays in the text field until the keyboard moves into the calendar.
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          if (inCalendar.current) focusCursor();
        }}
        onCloseAutoFocus={(e) => e.preventDefault()}
        onEscapeKeyDown={() => inCalendar.current && inputRef.current?.focus()}
        // Clicks pick without taking focus from the text field (and leave it where the keyboard put it).
        onMouseDown={(e: ReactMouseEvent) => e.preventDefault()}
        // A press on the field itself moves the caret; it must not close and reopen the calendar.
        onInteractOutside={(e) => {
          if (rootRef.current?.contains(e.target as Node)) e.preventDefault();
        }}
        onKeyDown={onPopupKey}
        // The popover is portalled: its blur doesn't reach the field's frame.
        onBlur={leave}
      >
        <div className="fui-calendar__header">
          {/* Stays a button in the years view too (just inert), so keyboard focus on it survives the view change. */}
          <button
            type="button"
            className="fui-calendar__caption"
            aria-label={view === "years" ? caption : `${caption}. ${view === "days" ? t.chooseMonth : t.chooseYear}`}
            aria-disabled={view === "years" || undefined}
            onClick={up}
          >
            <span id={captionId} aria-live="polite">
              {caption}
            </span>
            {view !== "years" && <ChevronDown />}
          </button>
          <IconButton icon={<ChevronLeft />} size="sm" aria-label={navLabels[0]} onClick={() => step(-1)} />
          <IconButton icon={<ChevronRight />} size="sm" aria-label={navLabels[1]} onClick={() => step(1)} />
        </div>

        <div
          ref={bodyRef}
          className="fui-calendar__body"
          onKeyDown={onCalendarKey}
          onFocus={() => (inCalendar.current = true)}
        >
          {view === "days" && (
            <div role="grid" aria-labelledby={captionId} className="fui-calendar__days">
              <div role="row" className="fui-calendar__row">
                {Array.from({length: 7}, (_, i) => (
                  <span key={i} role="columnheader" aria-label={weekdayName(lang, i, "long")} className="fui-calendar__weekday">
                    {weekdayName(lang, i, "short")}
                  </span>
                ))}
              </div>
              {chunk(calendarDays(cursorYear, cursorMonth), 7).map((week) => (
                <div key={week[0]} role="row" className="fui-calendar__row">
                  {week.map((iso) => {
                    const selected = iso === shown;
                    return (
                      <span key={iso} role="gridcell" aria-selected={selected} aria-disabled={!allowed(iso) || undefined}>
                        <button
                          type="button"
                          tabIndex={iso === cursor ? 0 : -1}
                          aria-label={dayLabel(lang, iso)}
                          aria-current={iso === today ? "date" : undefined}
                          data-cursor={iso === cursor ? "" : undefined}
                          data-selected={selected ? "" : undefined}
                          data-today={iso === today ? "" : undefined}
                          data-outside={Number(iso.slice(5, 7)) - 1 !== cursorMonth ? "" : undefined}
                          aria-disabled={!allowed(iso) || undefined}
                          className="fui-calendar__cell"
                          onClick={() => pick(iso)}
                        >
                          {Number(iso.slice(8))}
                        </button>
                      </span>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
          {view === "months" && (
            <div role="grid" aria-labelledby={captionId} className="fui-calendar__months">
              {chunk([...Array(12).keys()], 3).map((row) => (
                <div key={row[0]} role="row" className="fui-calendar__row">
                  {row.map((m) => {
                    const selected = shown != null && shown.slice(0, 7) === `${cursorYear}-${String(m + 1).padStart(2, "0")}`;
                    return (
                      <span key={m} role="gridcell" aria-selected={selected}>
                        <button
                          type="button"
                          tabIndex={m === cursorMonth ? 0 : -1}
                          data-cursor={m === cursorMonth ? "" : undefined}
                          data-selected={selected ? "" : undefined}
                          data-today={today.slice(0, 7) === `${cursorYear}-${String(m + 1).padStart(2, "0")}` ? "" : undefined}
                          aria-disabled={!monthAllowed(cursorYear, m) || undefined}
                          className="fui-calendar__cell"
                          onClick={() => {
                            if (!monthAllowed(cursorYear, m)) return;
                            setCursor(addMonths(cursor, m - cursorMonth));
                            setView("days");
                          }}
                        >
                          {monthName(lang, m)}
                        </button>
                      </span>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
          {view === "years" && (
            <div role="grid" aria-labelledby={captionId} className="fui-calendar__years">
              {chunk(
                Array.from({length: YEARS_PAGE}, (_, i) => pageStart + i),
                4,
              ).map((row) => (
                <div key={row[0]} role="row" className="fui-calendar__row">
                  {row.map((y) => {
                    const selected = shown != null && Number(shown.slice(0, 4)) === y;
                    return (
                      <span key={y} role="gridcell" aria-selected={selected}>
                        <button
                          type="button"
                          tabIndex={y === cursorYear ? 0 : -1}
                          data-cursor={y === cursorYear ? "" : undefined}
                          data-selected={selected ? "" : undefined}
                          data-today={Number(today.slice(0, 4)) === y ? "" : undefined}
                          aria-disabled={!yearAllowed(y) || undefined}
                          className="fui-calendar__cell"
                          onClick={() => {
                            if (!yearAllowed(y)) return;
                            setCursor(addMonths(cursor, 12 * (y - cursorYear)));
                            setView("months");
                          }}
                        >
                          {y}
                        </button>
                      </span>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="fui-calendar__footer">
          <Button variant="ghost" size="sm" disabled={!allowed(today)} onClick={() => pick(today)}>
            {t.today}
          </Button>
          {!required && (
            <Button
              variant="ghost"
              size="sm"
              disabled={!value && !text}
              onClick={() => {
                commit("");
                closeToField();
              }}
            >
              {t.clearValue}
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function chunk<T>(items: T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += size) rows.push(items.slice(i, i + size));
  return rows;
}

// ─── TimeInput ───────────────────────────────────────────────────────────────

export type TimeInputProps = FieldCommonProps & {
  /** "HH:MM", 24-hour, as the native time input passes it; "" or `null` — empty. */
  value: string | null | undefined;
  /** Minutes between the listed times; 15 by default. Any minute can still be typed. */
  step?: number;
};

/**
 * Time field, 24-hour: type «15:30» (also 1530, 15.30, 9) or pick from a list of times every `step` minutes that
 * opens on a click or ↓, scrolled to the value (to the current time while empty). ↑ ↓ move through the list, Enter
 * takes the row moved to (or the typed text), Escape closes. Text that isn't a time is dropped on leaving and the old
 * value stays.
 */
export function TimeInput({
  value: rawValue,
  onChange,
  step = 15,
  required,
  placeholder,
  size = "md",
  invalid,
  disabled,
  id,
  autoFocus,
  onBlur,
  onKeyDown,
  className,
  ...aria
}: TimeInputProps) {
  const t = useKitTexts();
  const value = rawValue ?? "";
  const slots = useMemo(() => timeSlots(step), [step]);
  const [text, setText] = useState(value);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  // Enter takes the active row only after the arrows moved to it; otherwise it takes the typed text.
  const [navigated, setNavigated] = useState(false);
  const rootRef = useRef<HTMLSpanElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const optionId = (i: number) => `${listId}-${i}`;

  useEffect(() => setText(value), [value]);

  const typed = text.trim() ? parseTimeText(text) : null;
  const anchorIndex = () => slotIndexOf(slots, typed ?? (value || toTimeInput(new Date())));

  const openList = () => {
    if (disabled) return;
    setActive(anchorIndex());
    setNavigated(false);
    setOpen(true);
  };
  const close = () => setOpen(false);

  // Centre the active row when the list mounts; later moves only scroll as far as needed.
  const listRef = (el: HTMLDivElement | null) => {
    const row = el?.querySelector<HTMLElement>("[data-highlighted]");
    if (el && row && !el.dataset.scrolled) {
      el.scrollTop = row.offsetTop - el.clientHeight / 2 + row.offsetHeight / 2;
      el.dataset.scrolled = "";
    }
  };
  const moveTo = (index: number) => {
    const next = Math.max(0, Math.min(slots.length - 1, index));
    setActive(next);
    document.getElementById(optionId(next))?.scrollIntoView({block: "nearest"});
  };

  const commit = (next: string) => {
    setText(next);
    if (next !== value) onChange(next);
  };
  const commitText = () => {
    if (!text.trim()) {
      if (required) setText(value);
      else commit("");
    } else if (typed) commit(typed);
    else setText(value);
  };

  const onInputKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape" && (open || e.nativeEvent.defaultPrevented)) {
      e.preventDefault();
      close();
      return;
    }
    const move = {ArrowDown: 1, ArrowUp: -1, PageDown: 4, PageUp: -4}[e.key];
    if (move) {
      e.preventDefault();
      if (!open) openList();
      else {
        setNavigated(true);
        moveTo(active + move);
      }
      return;
    }
    if (e.key === "Enter") {
      if (open && navigated) commit(slots[active]);
      else commitText();
      close();
    }
    onKeyDown?.(e);
  };

  const onTextChange = (next: string) => {
    setText(next);
    setNavigated(false);
    const time = next.trim() ? parseTimeText(next) : null;
    if (time && open) moveTo(slotIndexOf(slots, time));
  };

  const leave = (e: FocusEvent<HTMLElement>) => {
    if (!leavesControl(e, rootRef.current, contentRef.current)) return;
    commitText();
    close();
    onBlur?.();
  };

  return (
    <Popover open={open} onOpenChange={(next) => (next ? openList() : close())}>
      <FieldFrame
        rootRef={rootRef}
        size={size}
        invalid={invalid}
        disabled={disabled}
        open={open}
        icon={<Clock />}
        buttonLabel={t.showTimes}
        onButton={() => (open ? close() : openList())}
        onBlur={leave}
        className={cx("fui-date-field--time", className)}
      >
        <input
          id={id}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          spellCheck={false}
          role="combobox"
          aria-autocomplete="none"
          aria-expanded={open}
          aria-controls={open ? listId : undefined}
          aria-activedescendant={open ? optionId(active) : undefined}
          aria-invalid={invalid || undefined}
          aria-label={aria["aria-label"]}
          aria-describedby={aria["aria-describedby"]}
          aria-required={required || undefined}
          autoFocus={autoFocus}
          disabled={disabled}
          placeholder={placeholder ?? t.timePlaceholder}
          className="fui-date-field__input"
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          onClick={() => !open && openList()}
          onKeyDown={onInputKey}
        />
      </FieldFrame>
      <PopoverContent
        ref={contentRef}
        align="start"
        className="fui-time-list"
        // Focus stays in the text field; the list is driven by aria-activedescendant.
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
        onMouseDown={(e: ReactMouseEvent) => e.preventDefault()}
        onInteractOutside={(e) => {
          if (rootRef.current?.contains(e.target as Node)) e.preventDefault();
        }}
        onBlur={leave}
      >
        <div ref={listRef} id={listId} role="listbox" aria-label={aria["aria-label"] ?? t.time} className="fui-time-list__scroll">
          {slots.map((slot, i) => {
            const selected = slot === value;
            return (
              <div
                key={slot}
                id={optionId(i)}
                role="option"
                aria-selected={selected}
                data-highlighted={i === active ? "" : undefined}
                data-selected={selected ? "" : undefined}
                className="fui-time-list__option"
                onMouseMove={() => i !== active && setActive(i)}
                onClick={() => {
                  commit(slot);
                  close();
                }}
              >
                {slot}
                {selected && <Check />}
              </div>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ─── DateTimeInput ───────────────────────────────────────────────────────────

export type DateTimeInputProps = {
  /** A moment in the browser's time zone; `null` — not set. */
  value: Date | null;
  onChange: (value: Date | null) => void;
  /** Hides «Очистить» / "Clear" in the date; an emptied time always comes back (a date with a time keeps one). */
  required?: boolean;
  size?: "sm" | "md";
  invalid?: boolean;
  disabled?: boolean;
  /** Goes on the date's text field, so a Field's `htmlFor` focuses it. */
  id?: string;
  /** Names the pair for screen readers when no Field label points at it. */
  "aria-label"?: string;
  className?: string;
};

/**
 * A date and a time as one value: DateInput with TimeInput beside it, the date taking the spare width. Picking a date
 * keeps the time; a time without a date goes on today.
 */
export function DateTimeInput({value, onChange, required, size = "md", invalid, disabled, id, className, ...props}: DateTimeInputProps) {
  const t = useKitTexts();
  const setDate = (date: string) => {
    if (!date) return onChange(null);
    const next = fromDateInputs(date, value ? toTimeInput(value) : "");
    if (next) onChange(next);
  };
  const setTime = (time: string) => {
    const next = fromDateInputs(toDateInput(value ?? new Date()), time);
    if (next) onChange(next);
  };
  return (
    <div role="group" aria-label={props["aria-label"]} className={cx("fui-date-time", className)}>
      <DateInput
        id={id}
        size={size}
        aria-label={t.date}
        value={value ? toDateInput(value) : ""}
        required={required}
        invalid={invalid}
        disabled={disabled}
        onChange={setDate}
      />
      <TimeInput
        size={size}
        required
        aria-label={t.time}
        value={value ? toTimeInput(value) : ""}
        invalid={invalid}
        disabled={disabled}
        onChange={setTime}
      />
    </div>
  );
}
