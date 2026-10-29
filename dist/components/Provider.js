import { jsx as _jsx } from "react/jsx-runtime";
import { LucideProvider } from "lucide-react";
/**
 * Sets Lucide defaults to 16px / stroke 1.75 — close to Fibery's own 16px icons.
 * Kit components size their icons via CSS and work without it; wrap the app to match icons used elsewhere.
 */
export function FiberyUIProvider({ children }) {
    return (_jsx(LucideProvider, { size: 16, strokeWidth: 1.75, children: children }));
}
