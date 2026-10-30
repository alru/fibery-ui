import { type ReactNode } from "react";
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
export declare function InlineEdit({ value, children, onSave, label, hint, className }: InlineEditProps): import("react").JSX.Element;
