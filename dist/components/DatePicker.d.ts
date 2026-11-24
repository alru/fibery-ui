import { type KeyboardEvent } from "react";
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
export declare function DateInput({ value: rawValue, onChange, min, max, required, placeholder, size, invalid, disabled, id, autoFocus, defaultOpen, weekday: showWeekday, onBlur, onKeyDown, className, ...aria }: DateInputProps): import("react").JSX.Element;
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
export declare function TimeInput({ value: rawValue, onChange, step, required, placeholder, size, invalid, disabled, id, autoFocus, onBlur, onKeyDown, className, ...aria }: TimeInputProps): import("react").JSX.Element;
export {};
