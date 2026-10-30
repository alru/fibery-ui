// Rename in place: a value with a pencil that shows on hover (of itself or of its table row); the pencil turns the
// value into a field. Enter or leaving the field saves, Escape or the × next to the field cancels.
import {useRef, useState, type ReactNode} from "react";
import {Pencil, X} from "lucide-react";
import {cx} from "../cx";
import {IconButton} from "./Button";
import {Input} from "./Form";
import {friendlyErrorMessage} from "../errors";

export type InlineEditProps = {
  value: string;
  /** Shown instead of the plain value while not editing, e.g. a Highlight. */
  children?: ReactNode;
  /** Called with the trimmed new value when it changed; a rejected promise keeps the field open with the error. */
  onSave: (value: string) => unknown;
  /** Accessible name of the pencil button and the field, e.g. "Переименовать направление". */
  label: string;
  /** Muted note under the field while editing, e.g. what else the change affects. */
  hint?: ReactNode;
  className?: string;
};

/** Click and Enter inside never reach the parent, so it works inside clickable rows. */
export function InlineEdit({value, children, onSave, label, hint, className}: InlineEditProps) {
  const [draft, setDraft] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Enter disables the field while saving, which blurs it; the guard keeps that blur from saving twice.
  const busy = useRef(false);

  const close = () => {
    setDraft(null);
    setError(null);
  };
  const commit = async () => {
    if (busy.current || draft == null) return;
    const next = draft.trim();
    if (!next || next === value) return close();
    busy.current = true;
    setSaving(true);
    try {
      await onSave(next);
      close();
    } catch (e) {
      const raw = e instanceof Error ? e.message : String(e);
      const friendly = friendlyErrorMessage(e);
      // Raw text stays as the diagnostic, cut short: a gateway error may carry a whole HTML page.
      setError(friendly ? `${friendly} (${raw.slice(0, 200)})` : raw.slice(0, 300));
    } finally {
      busy.current = false;
      setSaving(false);
    }
  };

  const stop = (e: {stopPropagation: () => void}) => e.stopPropagation();

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
          <IconButton
            icon={<X />}
            size="sm"
            aria-label="Отменить (Esc)"
            title="Отменить (Esc)"
            className="fui-inline-edit__button"
            disabled={saving}
            // Keeps focus in the field: its blur would save before the click could cancel.
            onMouseDown={(e) => e.preventDefault()}
            onClick={close}
          />
        </span>
        {(error ?? hint) && <span className={error ? "fui-field__error" : "fui-field__hint"}>{error ?? hint}</span>}
      </span>
    );
  }
  return (
    <span className={cx("fui-inline-edit", className)}>
      <span className="fui-inline-edit__value">{children ?? value}</span>
      <IconButton
        icon={<Pencil />}
        size="sm"
        aria-label={label}
        className="fui-inline-edit__button"
        onClick={(e) => {
          e.stopPropagation();
          setDraft(value);
        }}
        onKeyDown={stop}
      />
    </span>
  );
}
