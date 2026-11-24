import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// Editing in place. InlineEdit (text), InlineDate and InlineTextarea: a value with a pencil that shows on hover (of
// itself or of its table row); the pencil turns the value into a field. Enter (Ctrl+Enter in a textarea) or leaving
// the field saves, Escape or the × next to the field cancels. InlineSelect: the value itself opens the option list,
// a pick saves at once. All of them keep a failed save's error under the value and work inside clickable rows.
import { useRef, useState } from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { ChevronDown, Pencil, X } from "lucide-react";
import { cx } from "../cx";
import { formatQuickDate, fromDateInputs } from "../dates";
import { IconButton } from "./Button";
import { DateInput } from "./DatePicker";
import { Input, Textarea } from "./Form";
import { SelectContent, SelectItem, SelectSeparator } from "./Select";
import { Spinner } from "./States";
import { friendlyErrorMessage } from "../errors";
import { useKitLang, useKitTexts } from "./KitLang";
// Save state shared by the inline editors: one save at a time, the error in plain words plus the raw text.
function useInlineSave() {
    const lang = useKitLang();
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    // Enter disables the field while saving, which blurs it; the guard keeps that blur from saving twice.
    const busy = useRef(false);
    const run = async (save) => {
        if (busy.current)
            return false;
        busy.current = true;
        setSaving(true);
        try {
            await save();
            return true;
        }
        catch (e) {
            const raw = e instanceof Error ? e.message : String(e);
            const friendly = friendlyErrorMessage(e, lang);
            // Raw text stays as the diagnostic, cut short: a gateway error may carry a whole HTML page.
            setError(friendly ? `${friendly} (${raw.slice(0, 200)})` : raw.slice(0, 300));
            return false;
        }
        finally {
            busy.current = false;
            setSaving(false);
        }
    };
    return { saving, error, setError, run, isBusy: () => busy.current };
}
const stop = (e) => e.stopPropagation();
// Pencil after a value, shown on hover; opens the editor.
function EditButton({ label, onEdit }) {
    return (_jsx(IconButton, { icon: _jsx(Pencil, {}), size: "sm", "aria-label": label, className: "fui-inline-edit__button", onClick: (e) => {
            e.stopPropagation();
            onEdit();
        }, onKeyDown: stop }));
}
// × next to an open editor; keeps focus in the field, whose blur would save before the click could cancel.
function CancelButton({ disabled, onCancel }) {
    const t = useKitTexts();
    return (_jsx(IconButton, { icon: _jsx(X, {}), size: "sm", "aria-label": t.cancelEdit, title: t.cancelEdit, className: "fui-inline-edit__button", disabled: disabled, onMouseDown: (e) => e.preventDefault(), onClick: onCancel }));
}
/** Click and Enter inside never reach the parent, so it works inside clickable rows. */
export function InlineEdit({ value, children, onSave, label, hint, clearable, placeholder, disabled, startEditing, className, }) {
    const [draft, setDraft] = useState(startEditing && !disabled ? value : null);
    const { saving, error, setError, run, isBusy } = useInlineSave();
    const close = () => {
        setDraft(null);
        setError(null);
    };
    const commit = async () => {
        if (isBusy() || draft == null)
            return;
        const next = draft.trim();
        if ((!next && !clearable) || next === value)
            return close();
        if (await run(() => onSave(next)))
            close();
    };
    // A placeholder only when the app passed nothing of its own to show.
    const shown = children ?? (value ? value : _jsx("span", { className: "fui-inline-edit__placeholder", children: placeholder ?? "—" }));
    if (draft != null) {
        return (_jsxs("span", { "data-editing": "", className: cx("fui-inline-edit", className), onClick: stop, onKeyDown: stop, children: [_jsxs("span", { className: "fui-inline-edit__row", children: [_jsx(Input, { size: "sm", autoFocus: true, "aria-label": label, value: draft, disabled: saving, invalid: error != null, onChange: (e) => setDraft(e.target.value), onBlur: commit, onKeyDown: (e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    commit();
                                }
                                else if (e.key === "Escape") {
                                    e.preventDefault();
                                    close();
                                }
                            } }), _jsx(CancelButton, { disabled: saving, onCancel: close })] }), (error ?? hint) && _jsx("span", { className: error ? "fui-field__error" : "fui-field__hint", children: error ?? hint })] }));
    }
    return (_jsxs("span", { className: cx("fui-inline-edit", className), children: [_jsx("span", { className: "fui-inline-edit__value", children: shown }), !disabled && _jsx(EditButton, { label: label, onEdit: () => setDraft(value) })] }));
}
/** Multi-line text edited in place: line breaks kept, Ctrl+Enter or leaving the field saves, Escape cancels. */
export function InlineTextarea({ value, children, onSave, label, placeholder, disabled, startEditing, required, hint, rows = 4, className, }) {
    const t = useKitTexts();
    const [draft, setDraft] = useState(startEditing && !disabled ? value : null);
    const { saving, error, setError, run, isBusy } = useInlineSave();
    const close = () => {
        setDraft(null);
        setError(null);
    };
    const commit = async () => {
        if (isBusy() || draft == null)
            return;
        const next = draft.replace(/\s+$/, "");
        if (next === value || (required && !next.trim()))
            return close();
        if (await run(() => onSave(next)))
            close();
    };
    const shown = children ?? (value ? value : _jsx("span", { className: "fui-inline-edit__placeholder", children: placeholder ?? "—" }));
    if (draft != null) {
        return (_jsxs("span", { "data-editing": "", "data-multiline": "", className: cx("fui-inline-edit", className), onClick: stop, onKeyDown: stop, children: [_jsxs("span", { className: "fui-inline-edit__row", children: [_jsx(Textarea, { autoFocus: true, rows: rows, "aria-label": label, value: draft, disabled: saving, invalid: error != null, onChange: (e) => setDraft(e.target.value), onBlur: commit, onKeyDown: (e) => {
                                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                                    e.preventDefault();
                                    commit();
                                }
                                else if (e.key === "Escape") {
                                    e.preventDefault();
                                    close();
                                }
                            } }), _jsx(CancelButton, { disabled: saving, onCancel: close })] }), _jsx("span", { className: error ? "fui-field__error" : "fui-field__hint", children: error ?? hint ?? t.textareaHint })] }));
    }
    return (_jsxs("span", { "data-multiline": "", className: cx("fui-inline-edit", className), children: [_jsx("span", { className: "fui-inline-edit__value", children: shown }), !disabled && _jsx(EditButton, { label: label, onEdit: () => setDraft(value) })] }));
}
/**
 * Date edited in place with the kit's DateInput, its calendar open at once: a picked day saves; typed text saves on
 * Enter or on leaving the field; Escape (after closing the calendar) cancels.
 */
export function InlineDate({ value, children, onSave, label, placeholder, disabled, startEditing, required, hint, className, }) {
    const lang = useKitLang();
    const [editing, setEditing] = useState(Boolean(startEditing && !disabled));
    const { saving, error, setError, run, isBusy } = useInlineSave();
    const close = () => {
        setEditing(false);
        setError(null);
    };
    // DateInput reports only real changes: a pick, Enter, Clear or leaving typed text.
    const commit = async (next) => {
        if (isBusy())
            return;
        if (next === (value ?? "") || (required && !next))
            return close();
        if (await run(() => onSave(next || null)))
            close();
    };
    const date = value ? fromDateInputs(value) : null;
    const shown = children ??
        (date ? formatQuickDate(date, lang, false) : _jsx("span", { className: "fui-inline-edit__placeholder", children: placeholder ?? value ?? "—" }));
    if (editing) {
        return (_jsxs("span", { "data-editing": "", className: cx("fui-inline-edit", className), onClick: stop, onKeyDown: stop, children: [_jsxs("span", { className: "fui-inline-edit__row", children: [_jsx(DateInput, { size: "sm", autoFocus: true, defaultOpen: true, "aria-label": label, value: value, required: required, disabled: saving, invalid: error != null, onChange: commit, 
                            // A save in flight decides itself whether the editor closes.
                            onBlur: () => !isBusy() && close(), onKeyDown: (e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    // DateInput has already saved a changed value; Enter on an unchanged one just closes.
                                    if (!isBusy())
                                        close();
                                }
                                else if (e.key === "Escape") {
                                    e.preventDefault();
                                    close();
                                }
                            } }), _jsx(CancelButton, { disabled: saving, onCancel: close })] }), (error ?? hint) && _jsx("span", { className: error ? "fui-field__error" : "fui-field__hint", children: error ?? hint })] }));
    }
    return (_jsxs("span", { className: cx("fui-inline-edit", className), children: [_jsx("span", { className: "fui-inline-edit__value", children: shown }), !disabled && _jsx(EditButton, { label: label, onEdit: () => setEditing(true) })] }));
}
// Radix Select doesn't allow an empty item value, so clearing goes through this one.
const CLEAR = "fui:clear";
/**
 * A select field shown as its value: a click (or Enter) on the value opens the options, a pick saves at once with
 * a spinner after the value. The chevron shows on hover.
 */
export function InlineSelect({ value, options, children, onSave, label, placeholder, disabled, startEditing, clearable, className, }) {
    const t = useKitTexts();
    const { saving, error, setError, run } = useInlineSave();
    const current = options.find((o) => o.value === value);
    const shown = children ?? current?.label ?? _jsx("span", { className: "fui-inline-edit__placeholder", children: placeholder ?? "—" });
    if (disabled) {
        return (_jsx("span", { className: cx("fui-inline-edit", className), children: _jsx("span", { className: "fui-inline-edit__value", children: shown }) }));
    }
    const pick = (next) => {
        const picked = next === CLEAR ? null : next;
        if (picked === value)
            return;
        setError(null);
        void run(() => onSave(picked));
    };
    return (_jsxs("span", { className: cx("fui-inline-edit fui-inline-select", className), onClick: stop, onKeyDown: stop, children: [_jsxs(SelectPrimitive.Root, { value: value ?? "", onValueChange: pick, defaultOpen: startEditing, disabled: saving, children: [_jsxs(SelectPrimitive.Trigger, { "aria-label": label, "aria-invalid": error != null || undefined, className: "fui-inline-select__trigger", children: [_jsx("span", { className: "fui-inline-edit__value", children: shown }), saving ? _jsx(Spinner, { size: "sm" }) : _jsx(ChevronDown, { className: "fui-inline-select__chevron", "aria-hidden": true })] }), _jsxs(SelectContent, { align: "start", children: [options.map((o) => (_jsx(SelectItem, { value: o.value, description: o.description, children: o.label }, o.value))), clearable && value != null && (_jsxs(_Fragment, { children: [_jsx(SelectSeparator, {}), _jsx(SelectItem, { value: CLEAR, children: t.clearValue })] }))] })] }), error && _jsx("span", { className: "fui-field__error", children: error })] }));
}
