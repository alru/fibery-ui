// App-level wrapper: Fibery's icon proportions for every Lucide icon, the language of the kit's texts, and the toast
// layer for useToast.
import type {ReactNode} from "react";
import {LucideProvider} from "lucide-react";
import type {KitLang} from "../i18n";
import {KitLangContext} from "./KitLang";
import {ToastProvider} from "./Toast";

/**
 * Sets Lucide defaults to 16px / stroke 1.75 — close to Fibery's own 16px icons — sets the language of the kit's own
 * texts (`lang`, Russian by default; explicit text props still win) and renders toasts.
 * Kit components size their icons via CSS and work without it; `useToast` needs it (or a ToastProvider).
 */
export function FiberyUIProvider({children, lang = "ru"}: {children: ReactNode; lang?: KitLang}) {
  return (
    <LucideProvider size={16} strokeWidth={1.75}>
      <KitLangContext.Provider value={lang}>
        <ToastProvider>{children}</ToastProvider>
      </KitLangContext.Provider>
    </LucideProvider>
  );
}
