import { type ReactElement } from "react";
export type ComboboxOption = {
    value: string;
    /** Shown in the list and searched; matches are highlighted. */
    text: string;
    /** Extra searchable text that is not shown, e.g. the group name. */
    keywords?: string;
    /** Options with the same group are listed under one caption, in order of first appearance. */
    group?: string;
};
export type ComboboxProps = {
    options: ComboboxOption[];
    onSelect: (value: string) => void;
    /** Trigger element (e.g. a Button); must accept a ref. */
    children: ReactElement;
    placeholder?: string;
    emptyText?: string;
    align?: "start" | "center" | "end";
    /** Classes for the popup, e.g. to change its 320px width. */
    className?: string;
};
/** Picker with search, groups and ↑ ↓ Enter navigation. Closes after a pick. */
export declare function Combobox({ options, onSelect, children, placeholder, emptyText, align, className, }: ComboboxProps): import("react").JSX.Element;
