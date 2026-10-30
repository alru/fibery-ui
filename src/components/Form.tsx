// Form controls: inputs with Fibery's ring-style borders, labels, field wrapper, checkbox and switch (Radix).
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
  type InputHTMLAttributes,
  type LabelHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
} from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import {Check, Minus, Search} from "lucide-react";
import {cx} from "../cx";

export type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & {
  size?: "sm" | "md";
  /** Lucide icon inside the input on the left. */
  icon?: ReactNode;
  /** Red ring; also sets `aria-invalid`. */
  invalid?: boolean;
};

/** Text input, 28 / 32px. */
export const Input = forwardRef<HTMLInputElement, InputProps>(({size = "md", icon, invalid, className, ...props}, ref) => {
  const input = (
    <input
      ref={ref}
      data-size={size}
      aria-invalid={invalid || undefined}
      className={cx("fui-input", !icon && className)}
      {...props}
    />
  );
  return icon ? (
    <span data-size={size} className={cx("fui-input-wrap", className)}>
      {icon}
      {input}
    </span>
  ) : (
    input
  );
});
Input.displayName = "Input";

/** Input with a search icon and `type="search"`. */
export const SearchInput = forwardRef<HTMLInputElement, Omit<InputProps, "icon" | "type">>((props, ref) => (
  <Input ref={ref} type="search" icon={<Search />} {...props} />
));
SearchInput.displayName = "SearchInput";

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {invalid?: boolean};

/** Multi-line input, vertically resizable. */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({invalid, className, ...props}, ref) => (
  <textarea ref={ref} aria-invalid={invalid || undefined} className={cx("fui-input fui-textarea", className)} {...props} />
));
Textarea.displayName = "Textarea";

/** Form label, 12px / 500. */
export const Label = forwardRef<HTMLLabelElement, LabelHTMLAttributes<HTMLLabelElement>>(({className, ...props}, ref) => (
  <label ref={ref} className={cx("fui-label", className)} {...props} />
));
Label.displayName = "Label";

export type FieldProps = {
  label?: ReactNode;
  /** `id` of the control, so clicking the label focuses it. */
  htmlFor?: string;
  hint?: ReactNode;
  /** Error text; replaces the hint and the warning. Mark the control `invalid` yourself. */
  error?: ReactNode;
  /** Non-blocking problem, in the warning color; replaces the hint, gives way to `error`. */
  warning?: ReactNode;
  /** Marks the label with an accent dot: the value differs from the saved one (edit forms with explicit Save). */
  changed?: boolean;
  /** Marks the label with a red asterisk: the field must be filled. */
  required?: boolean;
  children: ReactNode;
  className?: string;
};

/** Label + control + hint/warning/error stacked vertically. */
export function Field({label, htmlFor, hint, error, warning, changed, required, children, className}: FieldProps) {
  const note = error ? (
    <p className="fui-field__error">{error}</p>
  ) : warning ? (
    <p className="fui-field__warning">{warning}</p>
  ) : (
    hint && <p className="fui-field__hint">{hint}</p>
  );
  return (
    <div className={cx("fui-field", className)}>
      {label && (
        <Label htmlFor={htmlFor}>
          {label}
          {required && (
            <span className="fui-label__required" aria-label="обязательное поле">
              *
            </span>
          )}
          {changed && <span className="fui-label__changed" aria-label="изменено" />}
        </Label>
      )}
      {children}
      {note}
    </div>
  );
}

type ChoiceLabel = {
  /** Text to the right of the control; wraps both in a clickable `<label>`. */
  label?: ReactNode;
};

const withLabel = (control: ReactNode, label: ReactNode, className?: string) =>
  label ? (
    <label className={cx("fui-choice", className)}>
      {control}
      <span>{label}</span>
    </label>
  ) : (
    control
  );

export type CheckboxProps = ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> & ChoiceLabel;

/** 16px checkbox; supports `checked="indeterminate"`. */
export const Checkbox = forwardRef<ElementRef<typeof CheckboxPrimitive.Root>, CheckboxProps>(
  ({label, className, ...props}, ref) =>
    withLabel(
      <CheckboxPrimitive.Root ref={ref} className={cx("fui-checkbox", !label && className)} {...props}>
        <CheckboxPrimitive.Indicator className="fui-checkbox__indicator">
          {props.checked === "indeterminate" ? <Minus /> : <Check />}
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>,
      label,
      className,
    ),
);
Checkbox.displayName = "Checkbox";

export type SwitchProps = ComponentPropsWithoutRef<typeof SwitchPrimitive.Root> & ChoiceLabel;

/** 34×20px toggle, as in Fibery settings popups. */
export const Switch = forwardRef<ElementRef<typeof SwitchPrimitive.Root>, SwitchProps>(({label, className, ...props}, ref) =>
  withLabel(
    <SwitchPrimitive.Root ref={ref} className={cx("fui-switch", !label && className)} {...props}>
      <SwitchPrimitive.Thumb className="fui-switch__thumb" />
    </SwitchPrimitive.Root>,
    label,
    className,
  ),
);
Switch.displayName = "Switch";
