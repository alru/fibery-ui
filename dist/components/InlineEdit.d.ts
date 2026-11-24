import { type ReactNode } from "react";
type InlineCommonProps = {
    /** Accessible name of the pencil (or the value button) and the field, e.g. "Edit Expected Close". */
    label: string;
    /** Shown instead of the empty value, muted; «—» by default. */
    placeholder?: ReactNode;
    /** Read-only: the value as plain text, no editing. */
    disabled?: boolean;
    /** Opens the editor on mount, e.g. right after PropertyAdd revealed an empty field. */
    startEditing?: boolean;
    className?: string;
};
export type InlineEditProps = InlineCommonProps & {
    value: string;
    /** Shown instead of the plain value while not editing, e.g. a Highlight. */
    children?: ReactNode;
    /** Called with the trimmed new value when it changed; a rejected promise keeps the field open with the error. */
    onSave: (value: string) => unknown;
    /** Muted note under the field while editing, e.g. what else the change affects. */
    hint?: ReactNode;
    /** An emptied field saves "" (clears the value). By default it cancels, as for a name that must stay. */
    clearable?: boolean;
};
/** Click and Enter inside never reach the parent, so it works inside clickable rows. */
export declare function InlineEdit({ value, children, onSave, label, hint, clearable, placeholder, disabled, startEditing, className, }: InlineEditProps): import("react").JSX.Element;
export type InlineTextareaProps = InlineCommonProps & {
    value: string;
    /** Shown instead of the plain value while not editing. */
    children?: ReactNode;
    /** Called with the new value (trailing whitespace cut) when it changed; a rejected promise keeps the field open. */
    onSave: (value: string) => unknown;
    /** An empty value cancels instead of saving "". */
    required?: boolean;
    /** Muted note under the field; «Ctrl+Enter — сохранить, Esc — отменить» / "Ctrl+Enter to save, Esc to cancel". */
    hint?: ReactNode;
    rows?: number;
};
/** Multi-line text edited in place: line breaks kept, Ctrl+Enter or leaving the field saves, Escape cancels. */
export declare function InlineTextarea({ value, children, onSave, label, placeholder, disabled, startEditing, required, hint, rows, className, }: InlineTextareaProps): import("react").JSX.Element;
export type InlineDateProps = InlineCommonProps & {
    /** Date as Fibery stores a date field: "2026-11-24"; `null` — empty. */
    value: string | null;
    /** Shown instead of the default «пн 24 ноября» / "Mon 24 November" while not editing. */
    children?: ReactNode;
    /** Called with the new date ("YYYY-MM-DD") or `null` when cleared; a rejected promise keeps the field open. */
    onSave: (value: string | null) => unknown;
    /** Clearing the field cancels instead of saving `null`. */
    required?: boolean;
    hint?: ReactNode;
};
/**
 * Date edited in place with the kit's DateInput, its calendar open at once: a picked day saves; typed text saves on
 * Enter or on leaving the field; Escape (after closing the calendar) cancels.
 */
export declare function InlineDate({ value, children, onSave, label, placeholder, disabled, startEditing, required, hint, className, }: InlineDateProps): import("react").JSX.Element;
export type InlineSelectOption = {
    value: string;
    /** Row content and, unless `children` is given, the shown value: text, an OptionBadge, a Badge with a StageGlyph. */
    label: ReactNode;
    /** Muted second line in the list, e.g. what the option means. */
    description?: ReactNode;
};
export type InlineSelectProps = InlineCommonProps & {
    value: string | null;
    options: InlineSelectOption[];
    /** Shown instead of the picked option's label. */
    children?: ReactNode;
    /** Called with the picked value, or `null` from «Очистить» / "Clear"; a rejected promise shows the error. */
    onSave: (value: string | null) => unknown;
    /** Adds «Очистить» / "Clear" under the options while a value is set. */
    clearable?: boolean;
};
/**
 * A select field shown as its value: a click (or Enter) on the value opens the options, a pick saves at once with
 * a spinner after the value. The chevron shows on hover.
 */
export declare function InlineSelect({ value, options, children, onSave, label, placeholder, disabled, startEditing, clearable, className, }: InlineSelectProps): import("react").JSX.Element;
export {};
