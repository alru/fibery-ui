// App-level wrapper: Fibery's icon proportions for every Lucide icon, and the toast layer for useToast.
import type {ReactNode} from "react";
import {LucideProvider} from "lucide-react";
import {ToastProvider} from "./Toast";

/**
 * Sets Lucide defaults to 16px / stroke 1.75 — close to Fibery's own 16px icons — and renders toasts.
 * Kit components size their icons via CSS and work without it; `useToast` needs it (or a ToastProvider).
 */
export function FiberyUIProvider({children}: {children: ReactNode}) {
  return (
    <LucideProvider size={16} strokeWidth={1.75}>
      <ToastProvider>{children}</ToastProvider>
    </LucideProvider>
  );
}
