import type { ReactNode } from "react";
export type CopyButtonProps = {
    /** Text put on the clipboard. */
    value: string;
    /** Toast after copying, e.g. "Номер скопирован". */
    message?: ReactNode;
    "aria-label"?: string;
    className?: string;
};
/** Icon button that copies `value` and shows `message` in a toast; clicks don't reach a clickable row around it. */
export declare function CopyButton({ value, message, "aria-label": ariaLabel, className }: CopyButtonProps): import("react").JSX.Element;
