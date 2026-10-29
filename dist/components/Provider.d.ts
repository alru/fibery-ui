import type { ReactNode } from "react";
/**
 * Sets Lucide defaults to 16px / stroke 1.75 — close to Fibery's own 16px icons.
 * Kit components size their icons via CSS and work without it; wrap the app to match icons used elsewhere.
 */
export declare function FiberyUIProvider({ children }: {
    children: ReactNode;
}): import("react").JSX.Element;
