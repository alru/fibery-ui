import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// Rename in place: a value with a pencil that shows on hover (of itself or of its table row); the pencil turns the
// value into a field. Enter or leaving the field saves, Escape or the × next to the field cancels.
import { useRef, useState } from "react";
import { Pencil, X } from "lucide-react";
import { cx } from "../cx";
import { IconButton } from "./Button";
import { Input } from "./Form";
/** Click and Enter inside never reach the parent, so it works inside clickable rows. */
export function InlineEdit({ value, children, onSave, label, hint, className }) {
    const [draft, setDraft] = useState(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    // Enter disables the field while saving, which blurs it; the guard keeps that blur from saving twice.
    const busy = useRef(false);
    const close = () => {
        setDraft(null);
        setError(null);
    };
    const commit = async () => {
        if (busy.current || draft == null)
            return;
        const next = draft.trim();
        if (!next || next === value)
            return close();
        busy.current = true;
        setSaving(true);
        try {
            await onSave(next);
            close();
        }
        catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        }
        finally {
            busy.current = false;
            setSaving(false);
        }
    };
    const stop = (e) => e.stopPropagation();
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
                            } }), _jsx(IconButton, { icon: _jsx(X, {}), size: "sm", "aria-label": "\u041E\u0442\u043C\u0435\u043D\u0438\u0442\u044C (Esc)", title: "\u041E\u0442\u043C\u0435\u043D\u0438\u0442\u044C (Esc)", className: "fui-inline-edit__button", disabled: saving, 
                            // Keeps focus in the field: its blur would save before the click could cancel.
                            onMouseDown: (e) => e.preventDefault(), onClick: close })] }), (error ?? hint) && _jsx("span", { className: error ? "fui-field__error" : "fui-field__hint", children: error ?? hint })] }));
    }
    return (_jsxs("span", { className: cx("fui-inline-edit", className), children: [_jsx("span", { className: "fui-inline-edit__value", children: children ?? value }), _jsx(IconButton, { icon: _jsx(Pencil, {}), size: "sm", "aria-label": label, className: "fui-inline-edit__button", onClick: (e) => {
                    e.stopPropagation();
                    setDraft(value);
                }, onKeyDown: stop })] }));
}
