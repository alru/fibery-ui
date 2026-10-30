import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// Form controls: inputs with Fibery's ring-style borders, labels, field wrapper, checkbox and switch (Radix).
import { forwardRef, } from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { Check, Minus, Search } from "lucide-react";
import { cx } from "../cx";
/** Text input, 28 / 32px. */
export const Input = forwardRef(({ size = "md", icon, invalid, className, ...props }, ref) => {
    const input = (_jsx("input", { ref: ref, "data-size": size, "aria-invalid": invalid || undefined, className: cx("fui-input", !icon && className), ...props }));
    return icon ? (_jsxs("span", { "data-size": size, className: cx("fui-input-wrap", className), children: [icon, input] })) : (input);
});
Input.displayName = "Input";
/** Input with a search icon and `type="search"`. */
export const SearchInput = forwardRef((props, ref) => (_jsx(Input, { ref: ref, type: "search", icon: _jsx(Search, {}), ...props })));
SearchInput.displayName = "SearchInput";
/** Multi-line input, vertically resizable. */
export const Textarea = forwardRef(({ invalid, className, ...props }, ref) => (_jsx("textarea", { ref: ref, "aria-invalid": invalid || undefined, className: cx("fui-input fui-textarea", className), ...props })));
Textarea.displayName = "Textarea";
/** Form label, 12px / 500. */
export const Label = forwardRef(({ className, ...props }, ref) => (_jsx("label", { ref: ref, className: cx("fui-label", className), ...props })));
Label.displayName = "Label";
/** Label + control + hint/warning/error stacked vertically. */
export function Field({ label, htmlFor, hint, error, warning, changed, children, className }) {
    const note = error ? (_jsx("p", { className: "fui-field__error", children: error })) : warning ? (_jsx("p", { className: "fui-field__warning", children: warning })) : (hint && _jsx("p", { className: "fui-field__hint", children: hint }));
    return (_jsxs("div", { className: cx("fui-field", className), children: [label && (_jsxs(Label, { htmlFor: htmlFor, children: [label, changed && _jsx("span", { className: "fui-label__changed", "aria-label": "\u0438\u0437\u043C\u0435\u043D\u0435\u043D\u043E" })] })), children, note] }));
}
const withLabel = (control, label, className) => label ? (_jsxs("label", { className: cx("fui-choice", className), children: [control, _jsx("span", { children: label })] })) : (control);
/** 16px checkbox; supports `checked="indeterminate"`. */
export const Checkbox = forwardRef(({ label, className, ...props }, ref) => withLabel(_jsx(CheckboxPrimitive.Root, { ref: ref, className: cx("fui-checkbox", !label && className), ...props, children: _jsx(CheckboxPrimitive.Indicator, { className: "fui-checkbox__indicator", children: props.checked === "indeterminate" ? _jsx(Minus, {}) : _jsx(Check, {}) }) }), label, className));
Checkbox.displayName = "Checkbox";
/** 34×20px toggle, as in Fibery settings popups. */
export const Switch = forwardRef(({ label, className, ...props }, ref) => withLabel(_jsx(SwitchPrimitive.Root, { ref: ref, className: cx("fui-switch", !label && className), ...props, children: _jsx(SwitchPrimitive.Thumb, { className: "fui-switch__thumb" }) }), label, className));
Switch.displayName = "Switch";
