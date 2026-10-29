import { type ComponentPropsWithoutRef, type InputHTMLAttributes, type LabelHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import * as SwitchPrimitive from "@radix-ui/react-switch";
export type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & {
    size?: "sm" | "md";
    /** Lucide icon inside the input on the left. */
    icon?: ReactNode;
    /** Red ring; also sets `aria-invalid`. */
    invalid?: boolean;
};
/** Text input, 28 / 32px. */
export declare const Input: import("react").ForwardRefExoticComponent<Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & {
    size?: "sm" | "md";
    /** Lucide icon inside the input on the left. */
    icon?: ReactNode;
    /** Red ring; also sets `aria-invalid`. */
    invalid?: boolean;
} & import("react").RefAttributes<HTMLInputElement>>;
/** Input with a search icon and `type="search"`. */
export declare const SearchInput: import("react").ForwardRefExoticComponent<Omit<InputProps, "icon" | "type"> & import("react").RefAttributes<HTMLInputElement>>;
export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
    invalid?: boolean;
};
/** Multi-line input, vertically resizable. */
export declare const Textarea: import("react").ForwardRefExoticComponent<TextareaHTMLAttributes<HTMLTextAreaElement> & {
    invalid?: boolean;
} & import("react").RefAttributes<HTMLTextAreaElement>>;
/** Form label, 12px / 500. */
export declare const Label: import("react").ForwardRefExoticComponent<LabelHTMLAttributes<HTMLLabelElement> & import("react").RefAttributes<HTMLLabelElement>>;
export type FieldProps = {
    label?: ReactNode;
    /** `id` of the control, so clicking the label focuses it. */
    htmlFor?: string;
    hint?: ReactNode;
    /** Error text; replaces the hint. Mark the control `invalid` yourself. */
    error?: ReactNode;
    children: ReactNode;
    className?: string;
};
/** Label + control + hint/error stacked vertically. */
export declare function Field({ label, htmlFor, hint, error, children, className }: FieldProps): import("react").JSX.Element;
type ChoiceLabel = {
    /** Text to the right of the control; wraps both in a clickable `<label>`. */
    label?: ReactNode;
};
export type CheckboxProps = ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> & ChoiceLabel;
/** 16px checkbox; supports `checked="indeterminate"`. */
export declare const Checkbox: import("react").ForwardRefExoticComponent<Omit<CheckboxPrimitive.CheckboxProps & import("react").RefAttributes<HTMLButtonElement>, "ref"> & ChoiceLabel & import("react").RefAttributes<HTMLButtonElement>>;
export type SwitchProps = ComponentPropsWithoutRef<typeof SwitchPrimitive.Root> & ChoiceLabel;
/** 34×20px toggle, as in Fibery settings popups. */
export declare const Switch: import("react").ForwardRefExoticComponent<Omit<SwitchPrimitive.SwitchProps & import("react").RefAttributes<HTMLButtonElement>, "ref"> & ChoiceLabel & import("react").RefAttributes<HTMLButtonElement>>;
export {};
