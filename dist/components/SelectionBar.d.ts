import type { ReactNode } from "react";
export type SelectionBarProps = {
    /** Number of selected rows. */
    count: number;
    /** Buttons for the selected rows, e.g. "Change owner"; all disabled together while `busy` or `progress`. */
    actions: ReactNode;
    /** Clears the selection. */
    onClear: () => void;
    /** A bulk write is running: «Записано 40 из 131» / "Saving 40 of 131" and a bar in place of the actions. */
    progress?: {
        done: number;
        total: number;
    };
    /** Disables the actions and Clear, e.g. while an action's dialog is open. */
    busy?: boolean;
    className?: string;
};
/**
 * Sticky bar at the bottom of a list with selected rows: «Выбрано: N» / "N selected", the actions, «Снять выбор» /
 * "Clear". Render it while something is selected. The count and the progress have fixed widths with tabular digits,
 * so nothing moves while they change.
 */
export declare function SelectionBar({ count, actions, onClear, progress, busy, className }: SelectionBarProps): import("react").JSX.Element;
