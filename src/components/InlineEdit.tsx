// Editing in place. InlineEdit (text), InlineDate and InlineTextarea: a value with a pencil that shows on hover (of
// itself or of its table row); the pencil turns the value into a field. Enter (Ctrl+Enter in a textarea) or leaving
// the field saves, Escape or the × next to the field cancels. InlineSelect: the value itself opens the option list,
// a pick saves at once. All of them keep a failed save's error under the value and work inside clickable rows.
import {useRef, useState, type ReactNode} from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import {ChevronDown, Pencil, X} from "lucide-react";
import {cx} from "../cx";
import {formatQuickDate, fromDateInputs} from "../dates";
import {IconButton} from "./Button";
import {Input, Textarea} from "./Form";
import {SelectContent, SelectItem, SelectSeparator} from "./Select";
import {Spinner} from "./States";
import {friendlyErrorMessage} from "../errors";
import {useKitLang, useKitTexts} from "./KitLang";

// Save state shared by the inline editors: one save at a time, the error in plain words plus the raw text.
function useInlineSave() {
  const lang = useKitLang();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Enter disables the field while saving, which blurs it; the guard keeps that blur from saving twice.
  const busy = useRef(false);
  const run = async (save: () => unknown): Promise<boolean> => {
    if (busy.current) return false;
    busy.current = true;
    setSaving(true);
    try {
      await save();
      return true;
    } catch (e) {
      const raw = e instanceof Error ? e.message : String(e);
      const friendly = friendlyErrorMessage(e, lang);
      // Raw text stays as the diagnostic, cut short: a gateway error may carry a whole HTML page.
      setError(friendly ? `${friendly} (${raw.slice(0, 200)})` : raw.slice(0, 300));
      return false;
    } finally {
      busy.current = false;
      setSaving(false);
    }
  };
  return {saving, error, setError, run, isBusy: () => busy.current};
}

const stop = (e: {stopPropagation: () => void}) => e.stopPropagation();

// Pencil after a value, shown on hover; opens the editor.
function EditButton({label, onEdit}: {label: string; onEdit: () => void}) {
  return (
    <IconButton
      icon={<Pencil />}
      size="sm"
      aria-label={label}
      className="fui-inline-edit__button"
      onClick={(e) => {
        e.stopPropagation();
        onEdit();
      }}
      onKeyDown={stop}
    />
  );
}

// × next to an open editor; keeps focus in the field, whose blur would save before the click could cancel.
function CancelButton({disabled, onCancel}: {disabled: boolean; onCancel: () => void}) {
  const t = useKitTexts();
  return (
    <IconButton
      icon={<X />}
      size="sm"
      aria-label={t.cancelEdit}
      title={t.cancelEdit}
      className="fui-inline-edit__button"
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onCancel}
    />
  );
}

export type InlineEditProps = {
  value: string;
  /** Shown instead of the plain value while not editing, e.g. a Highlight. */
  children?: ReactNode;
  /** Called with the trimmed new value when it changed; a rejected promise keeps the field open with the error. */
  onSave: (value: string) => unknown;
  /** Accessible name of the pencil button and the field, e.g. "Rename group". */
  label: string;
  /** Muted note under the field while editing, e.g. what else the change affects. */
  hint?: ReactNode;
  className?: string;
};

/** Click and Enter inside never reach the parent, so it works inside clickable rows. */
export function InlineEdit({value, children, onSave, label, hint, className}: InlineEditProps) {
  const [draft, setDraft] = useState<string | null>(null);
  const {saving, error, setError, run, isBusy} = useInlineSave();

  const close = () => {
    setDraft(null);
    setError(null);
  };
  const commit = async () => {
    if (isBusy() || draft == null) return;
    const next = draft.trim();
    if (!next || next === value) return close();
    if (await run(() => onSave(next))) close();
  };

  if (draft != null) {
    return (
      <span data-editing="" className={cx("fui-inline-edit", className)} onClick={stop} onKeyDown={stop}>
        <span className="fui-inline-edit__row">
          <Input
            size="sm"
            autoFocus
            aria-label={label}
            value={draft}
            disabled={saving}
            invalid={error != null}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commit();
              } else if (e.key === "Escape") {
                e.preventDefault();
                close();
              }
            }}
          />
          <CancelButton disabled={saving} onCancel={close} />
        </span>
        {(error ?? hint) && <span className={error ? "fui-field__error" : "fui-field__hint"}>{error ?? hint}</span>}
      </span>
    );
  }
  return (
    <span className={cx("fui-inline-edit", className)}>
      <span className="fui-inline-edit__value">{children ?? value}</span>
      <EditButton label={label} onEdit={() => setDraft(value)} />
    </span>
  );
}

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
export function InlineTextarea({
  value,
  children,
  onSave,
  label,
  placeholder,
  disabled,
  startEditing,
  required,
  hint,
  rows = 4,
  className,
}: InlineTextareaProps) {
  const t = useKitTexts();
  const [draft, setDraft] = useState<string | null>(startEditing && !disabled ? value : null);
  const {saving, error, setError, run, isBusy} = useInlineSave();
  const close = () => {
    setDraft(null);
    setError(null);
  };
  const commit = async () => {
    if (isBusy() || draft == null) return;
    const next = draft.replace(/\s+$/, "");
    if (next === value || (required && !next.trim())) return close();
    if (await run(() => onSave(next))) close();
  };
  const shown = children ?? (value ? value : <span className="fui-inline-edit__placeholder">{placeholder ?? "—"}</span>);

  if (draft != null) {
    return (
      <span data-editing="" data-multiline="" className={cx("fui-inline-edit", className)} onClick={stop} onKeyDown={stop}>
        <span className="fui-inline-edit__row">
          <Textarea
            autoFocus
            rows={rows}
            aria-label={label}
            value={draft}
            disabled={saving}
            invalid={error != null}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                commit();
              } else if (e.key === "Escape") {
                e.preventDefault();
                close();
              }
            }}
          />
          <CancelButton disabled={saving} onCancel={close} />
        </span>
        <span className={error ? "fui-field__error" : "fui-field__hint"}>{error ?? hint ?? t.textareaHint}</span>
      </span>
    );
  }
  return (
    <span data-multiline="" className={cx("fui-inline-edit", className)}>
      <span className="fui-inline-edit__value">{shown}</span>
      {!disabled && <EditButton label={label} onEdit={() => setDraft(value)} />}
    </span>
  );
}

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

/** Date edited in place with the browser's date input: Enter or leaving the field saves, Escape cancels. */
export function InlineDate({
  value,
  children,
  onSave,
  label,
  placeholder,
  disabled,
  startEditing,
  required,
  hint,
  className,
}: InlineDateProps) {
  const lang = useKitLang();
  const [draft, setDraft] = useState<string | null>(startEditing && !disabled ? (value ?? "") : null);
  const {saving, error, setError, run, isBusy} = useInlineSave();
  const close = () => {
    setDraft(null);
    setError(null);
  };
  const commit = async () => {
    if (isBusy() || draft == null) return;
    if (draft === (value ?? "") || (required && !draft)) return close();
    if (await run(() => onSave(draft || null))) close();
  };
  const date = value ? fromDateInputs(value) : null;
  const shown =
    children ??
    (date ? formatQuickDate(date, lang, false) : <span className="fui-inline-edit__placeholder">{placeholder ?? value ?? "—"}</span>);

  if (draft != null) {
    return (
      <span data-editing="" className={cx("fui-inline-edit", className)} onClick={stop} onKeyDown={stop}>
        <span className="fui-inline-edit__row">
          <Input
            type="date"
            size="sm"
            autoFocus
            aria-label={label}
            value={draft}
            disabled={saving}
            invalid={error != null}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commit();
              } else if (e.key === "Escape") {
                e.preventDefault();
                close();
              }
            }}
          />
          <CancelButton disabled={saving} onCancel={close} />
        </span>
        {(error ?? hint) && <span className={error ? "fui-field__error" : "fui-field__hint"}>{error ?? hint}</span>}
      </span>
    );
  }
  return (
    <span className={cx("fui-inline-edit", className)}>
      <span className="fui-inline-edit__value">{shown}</span>
      {!disabled && <EditButton label={label} onEdit={() => setDraft(value ?? "")} />}
    </span>
  );
}

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

// Radix Select doesn't allow an empty item value, so clearing goes through this one.
const CLEAR = "fui:clear";

/**
 * A select field shown as its value: a click (or Enter) on the value opens the options, a pick saves at once with
 * a spinner after the value. The chevron shows on hover.
 */
export function InlineSelect({
  value,
  options,
  children,
  onSave,
  label,
  placeholder,
  disabled,
  startEditing,
  clearable,
  className,
}: InlineSelectProps) {
  const t = useKitTexts();
  const {saving, error, setError, run} = useInlineSave();
  const current = options.find((o) => o.value === value);
  const shown = children ?? current?.label ?? <span className="fui-inline-edit__placeholder">{placeholder ?? "—"}</span>;
  if (disabled) {
    return (
      <span className={cx("fui-inline-edit", className)}>
        <span className="fui-inline-edit__value">{shown}</span>
      </span>
    );
  }
  const pick = (next: string) => {
    const picked = next === CLEAR ? null : next;
    if (picked === value) return;
    setError(null);
    void run(() => onSave(picked));
  };
  return (
    <span className={cx("fui-inline-edit fui-inline-select", className)} onClick={stop} onKeyDown={stop}>
      <SelectPrimitive.Root value={value ?? ""} onValueChange={pick} defaultOpen={startEditing} disabled={saving}>
        <SelectPrimitive.Trigger aria-label={label} aria-invalid={error != null || undefined} className="fui-inline-select__trigger">
          <span className="fui-inline-edit__value">{shown}</span>
          {saving ? <Spinner size="sm" /> : <ChevronDown className="fui-inline-select__chevron" aria-hidden />}
        </SelectPrimitive.Trigger>
        <SelectContent align="start">
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value} description={o.description}>
              {o.label}
            </SelectItem>
          ))}
          {clearable && value != null && (
            <>
              <SelectSeparator />
              <SelectItem value={CLEAR}>{t.clearValue}</SelectItem>
            </>
          )}
        </SelectContent>
      </SelectPrimitive.Root>
      {error && <span className="fui-field__error">{error}</span>}
    </span>
  );
}
