import { jsx as _jsx } from "react/jsx-runtime";
import { LucideProvider } from "lucide-react";
import { ToastProvider } from "./Toast";
/**
 * Sets Lucide defaults to 16px / stroke 1.75 — close to Fibery's own 16px icons — and renders toasts.
 * Kit components size their icons via CSS and work without it; `useToast` needs it (or a ToastProvider).
 */
export function FiberyUIProvider({ children }) {
    return (_jsx(LucideProvider, { size: 16, strokeWidth: 1.75, children: _jsx(ToastProvider, { children: children }) }));
}
