import type { ReactNode } from "react";
import type { KitLang } from "../i18n";
/**
 * Sets Lucide defaults to 16px / stroke 1.75 — close to Fibery's own 16px icons — sets the language of the kit's own
 * texts (`lang`, Russian by default; explicit text props still win) and renders toasts.
 * Kit components size their icons via CSS and work without it; `useToast` needs it (or a ToastProvider).
 */
export declare function FiberyUIProvider({ children, lang }: {
    children: ReactNode;
    lang?: KitLang;
}): import("react").JSX.Element;
