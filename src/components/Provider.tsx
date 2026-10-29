// Optional app-level wrapper: gives every Lucide icon in the app Fibery's icon proportions.
import type {ReactNode} from "react";
import {LucideProvider} from "lucide-react";

/**
 * Sets Lucide defaults to 16px / stroke 1.75 — close to Fibery's own 16px icons.
 * Kit components size their icons via CSS and work without it; wrap the app to match icons used elsewhere.
 */
export function FiberyUIProvider({children}: {children: ReactNode}) {
  return (
    <LucideProvider size={16} strokeWidth={1.75}>
      {children}
    </LucideProvider>
  );
}
