// Choice chips: ChipGroup — separate small chips that wrap, one value at a time, the rest in a «ещё ▾» menu — and
// QuickDate on top of it: quick terms ("Tomorrow", "+1 week"), «Дата…» for any date and time (the kit's DateInput and
// TimeInput), and the resolved date spelled out under the chips.
import {useState, type KeyboardEvent, type ReactNode} from "react";
import {ChevronDown} from "lucide-react";
import {cx} from "../cx";
import {formatQuickDate, fromDateInputs, matchQuickTerm, toDateInput, toTimeInput, type QuickTerm} from "../dates";
import {DateInput, TimeInput} from "./DatePicker";
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger} from "./Overlay";
import {useKitLang, useKitTexts} from "./KitLang";

export type ChipOption<T extends string> = {
  value: T;
  label: ReactNode;
  /** Mark before the label, e.g. a channel's emoji or a Dot. */
  glyph?: ReactNode;
  /** Hover text, e.g. what the option means. */
  title?: string;
};

export type ChipGroupProps<T extends string> = {
  options: ChipOption<T>[];
  /** The picked option; `null` — none. */
  value: T | null;
  onValueChange: (value: T | null) => void;
  /** How many options show as chips; the rest are in a «ещё ▾» / "more ▾" menu. All by default. */
  visible?: number;
  /** A click on the picked chip clears the choice (`null`), for optional values. */
  deselectable?: boolean;
  disabled?: boolean;
  "aria-label"?: string;
  className?: string;
};

/**
 * Row of separate 24px chips with wrapping, one picked at a time (the picked one in the accent color: it is a choice,
 * not a code). A radio group: arrow keys move the choice. Unlike SegmentedControl (one joined strip that never
 * wraps), it fits many options, e.g. channels or date terms.
 */
export function ChipGroup<T extends string>({
  options,
  value,
  onValueChange,
  visible,
  deselectable,
  disabled,
  className,
  ...props
}: ChipGroupProps<T>) {
  const t = useKitTexts();
  const shown = visible != null && visible < options.length ? options.slice(0, visible) : options;
  const hidden = options.slice(shown.length);
  const hiddenPick = hidden.find((o) => o.value === value);
  const focusIndex = Math.max(0, shown.findIndex((o) => o.value === value));

  const pick = (option: T) => onValueChange(deselectable && option === value ? null : option);
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    const chip = e.target;
    if (!step || !(chip instanceof HTMLElement) || chip.getAttribute("role") !== "radio") return;
    e.preventDefault();
    const from = shown.findIndex((o) => o.value === chip.dataset.value);
    const next = shown[(from + step + shown.length) % shown.length];
    onValueChange(next.value);
    e.currentTarget.querySelector<HTMLElement>(`[data-value="${CSS.escape(next.value)}"]`)?.focus();
  };

  return (
    <div role="radiogroup" aria-label={props["aria-label"]} className={cx("fui-chips", className)} onKeyDown={onKeyDown}>
      {shown.map((option, i) => {
        const on = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={on}
            tabIndex={i === focusIndex ? 0 : -1}
            data-value={option.value}
            data-picked={on ? "" : undefined}
            title={option.title}
            disabled={disabled}
            className="fui-chip"
            onClick={() => pick(option.value)}
          >
            {option.glyph}
            {option.label}
          </button>
        );
      })}
      {hidden.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className="fui-chip" data-picked={hiddenPick ? "" : undefined} disabled={disabled}>
              {hiddenPick ? (
                <>
                  {hiddenPick.glyph}
                  {hiddenPick.label}
                </>
              ) : (
                t.more
              )}
              <ChevronDown />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {hidden.map((option) => (
              <DropdownMenuItem key={option.value} icon={option.glyph} title={option.title} onSelect={() => pick(option.value)}>
                {option.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

// Value of the «Дата…» chip; term ids are the app's own and never start with "fui:".
const CUSTOM = "fui:date";

export type QuickDateProps = {
  /** Quick choices with their dates, computed by the app (e.g. "Tomorrow" = tomorrow 10:00). */
  terms: QuickTerm[];
  value: Date | null;
  onChange: (value: Date | null) => void;
  /** TimeInput next to the date and the time in the resolved line; on by default. */
  withTime?: boolean;
  invalid?: boolean;
  disabled?: boolean;
  /** Names the field for screen readers when no Field label points at it. */
  "aria-label"?: string;
  className?: string;
};

/**
 * Date field for planning: quick-term chips, «Дата…» / "Date…" for a DateInput (and a TimeInput), and the resolved
 * date spelled out under the chips — «пн 24 ноября, 10:00» — which also opens the inputs to adjust the time. A value
 * keeps its chip picked while it stays on that chip's day. The chips never change size, so nothing shifts.
 */
export function QuickDate({terms, value, onChange, withTime = true, invalid, disabled, className, ...props}: QuickDateProps) {
  const lang = useKitLang();
  const t = useKitTexts();
  const [custom, setCustom] = useState(false);
  const match = matchQuickTerm(terms, value);
  const open = custom || (value != null && !match);
  const picked = open ? CUSTOM : (match?.id ?? null);

  const choose = (id: string | null) => {
    if (id === CUSTOM) {
      setCustom(true);
      return;
    }
    const term = terms.find((x) => x.id === id);
    if (!term) return;
    setCustom(false);
    onChange(term.date);
  };
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
    <div data-invalid={invalid ? "" : undefined} className={cx("fui-quick-date", className)}>
      <ChipGroup
        aria-label={props["aria-label"]}
        options={[...terms.map((x) => ({value: x.id, label: x.label})), {value: CUSTOM, label: t.pickDate}]}
        value={picked}
        onValueChange={choose}
        disabled={disabled}
      />
      {open && (
        <div className="fui-quick-date__inputs">
          <DateInput
            size="sm"
            aria-label={t.date}
            value={value ? toDateInput(value) : ""}
            invalid={invalid}
            disabled={disabled}
            onChange={setDate}
          />
          {withTime && (
            // A planned date always has a time: emptying the field brings the time back instead of midnight.
            <TimeInput
              size="sm"
              required
              aria-label={t.time}
              value={value ? toTimeInput(value) : ""}
              disabled={disabled}
              onChange={setTime}
            />
          )}
        </div>
      )}
      <button
        type="button"
        className="fui-quick-date__resolved"
        data-empty={value ? undefined : ""}
        disabled={disabled}
        onClick={() => choose(CUSTOM)}
      >
        <span aria-live="polite">{value ? formatQuickDate(value, lang, withTime) : t.dateNotSet}</span>
      </button>
    </div>
  );
}
