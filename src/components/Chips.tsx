// Choice chips: ChipGroup — separate small chips that wrap, one value at a time, the rest in a «ещё ▾» menu — and
// QuickDate: the kit's DateInput and TimeInput with quick terms ("Now", "Tomorrow", "+1 week") under them as chips,
// and the picked date spelled out under the chips.
import {type KeyboardEvent, type ReactNode} from "react";
import {ChevronDown} from "lucide-react";
import {cx} from "../cx";
import {formatQuickDate, fromDateInputs, matchQuickTerm, toDateInput, toTimeInput, type QuickTerm} from "../dates";
import {Button} from "./Button";
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

// Value of the "now" / "today" chip; term ids are the app's own and never start with "fui:".
const NOW = "fui:now";

export type QuickDateProps = {
  /** Quick choices with their dates, computed by the app (e.g. "Tomorrow" = tomorrow 10:00); none by default. */
  terms?: QuickTerm[];
  value: Date | null;
  onChange: (value: Date | null) => void;
  /** TimeInput next to the date and the time in the preview; on by default. */
  withTime?: boolean;
  /**
   * «Сейчас» / "Now" (with the time) or «Сегодня» / "Today" (without): sets the current moment. The only quick choice
   * stands right after the inputs; with `terms` it leads the chips under them.
   */
  now?: boolean;
  /** The picked date spelled out under everything — «пн 24 ноября, 10:00»; on by default. */
  preview?: boolean;
  size?: "sm" | "md";
  invalid?: boolean;
  disabled?: boolean;
  /** Goes on the date's text field, so a Field's `htmlFor` focuses it. */
  id?: string;
  /** Names the field for screen readers when no Field label points at it. */
  "aria-label"?: string;
  className?: string;
};

/**
 * Date (and time) field with quick choices (owner, 2026-11-27): the date and time inputs on top, the quick-term chips
 * under them, then the picked date spelled out (`preview`). A value keeps its chip picked while it stays on that
 * chip's day. The chips never change size, so nothing shifts.
 */
export function QuickDate({
  terms = [],
  value,
  onChange,
  withTime = true,
  now,
  preview = true,
  size = "md",
  invalid,
  disabled,
  id,
  className,
  ...props
}: QuickDateProps) {
  const lang = useKitLang();
  const t = useKitTexts();
  const nowLabel = withTime ? t.nowAction : t.today;
  const match = matchQuickTerm(terms, value);

  const choose = (choice: string | null) => {
    if (choice === NOW) return onChange(new Date());
    const term = terms.find((x) => x.id === choice);
    if (term) onChange(term.date);
  };
  const setDate = (date: string) => {
    if (!date) return onChange(null);
    const next = fromDateInputs(date, value && withTime ? toTimeInput(value) : "");
    if (next) onChange(next);
  };
  const setTime = (time: string) => {
    const next = fromDateInputs(toDateInput(value ?? new Date()), time);
    if (next) onChange(next);
  };
  const chips = [...(now ? [{value: NOW, label: nowLabel}] : []), ...terms.map((x) => ({value: x.id, label: x.label}))];

  return (
    <div role="group" aria-label={props["aria-label"]} data-invalid={invalid ? "" : undefined} className={cx("fui-quick-date", className)}>
      <div className="fui-date-time">
        <DateInput
          id={id}
          size={size}
          aria-label={t.date}
          value={value ? toDateInput(value) : ""}
          invalid={invalid}
          disabled={disabled}
          onChange={setDate}
        />
        {withTime && (
          // A date with a time always has one: emptying the field brings the time back instead of midnight.
          <TimeInput
            size={size}
            required
            aria-label={t.time}
            value={value ? toTimeInput(value) : ""}
            invalid={invalid}
            disabled={disabled}
            onChange={setTime}
          />
        )}
        {now && terms.length === 0 && (
          <Button variant="outline" size={size === "sm" ? "md" : "lg"} disabled={disabled} onClick={() => choose(NOW)}>
            {nowLabel}
          </Button>
        )}
      </div>
      {terms.length > 0 && <ChipGroup aria-label={t.quickDates} options={chips} value={match?.id ?? null} onValueChange={choose} disabled={disabled} />}
      {preview && (
        <span className="fui-quick-date__resolved" data-empty={value ? undefined : ""} aria-live="polite">
          {value ? formatQuickDate(value, lang, withTime) : t.dateNotSet}
        </span>
      )}
    </div>
  );
}
