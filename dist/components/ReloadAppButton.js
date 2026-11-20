import { jsx as _jsx } from "react/jsx-runtime";
// Last-resort "hard refresh": reloads the whole app page when it is stuck (a refetch would not help — e.g. a broken
// render or a hung request), so users don't have to know how to reload a Fibery app frame themselves.
import { RefreshCw } from "lucide-react";
import { IconButton } from "./Button";
import { useKitTexts } from "./KitLang";
import { Tooltip } from "./Overlay";
/**
 * Icon button «Перезагрузить приложение» / "Reload app" that reloads the app page (`window.location.reload()`), not just its data.
 * State kept with `usePersistentState` (remembered tab, filters) survives the reload; unsaved edits are lost.
 */
export function ReloadAppButton({ className }) {
    const t = useKitTexts();
    return (_jsx(Tooltip, { content: t.reloadApp, children: _jsx(IconButton, { icon: _jsx(RefreshCw, {}), "aria-label": t.reloadApp, className: className, onClick: () => window.location.reload() }) }));
}
