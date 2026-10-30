import { jsx as _jsx } from "react/jsx-runtime";
// Last-resort "hard refresh": reloads the whole app page when it is stuck (a refetch would not help — e.g. a broken
// render or a hung request), so users don't have to know how to reload a Fibery app frame themselves.
import { RefreshCw } from "lucide-react";
import { IconButton } from "./Button";
import { Tooltip } from "./Overlay";
/**
 * Icon button «Перезагрузить приложение» that reloads the app page (`window.location.reload()`), not just its data.
 * State kept with `usePersistentState` (remembered tab, filters) survives the reload; unsaved edits are lost.
 */
export function ReloadAppButton({ className }) {
    return (_jsx(Tooltip, { content: "\u041F\u0435\u0440\u0435\u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044C \u043F\u0440\u0438\u043B\u043E\u0436\u0435\u043D\u0438\u0435", children: _jsx(IconButton, { icon: _jsx(RefreshCw, {}), "aria-label": "\u041F\u0435\u0440\u0435\u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044C \u043F\u0440\u0438\u043B\u043E\u0436\u0435\u043D\u0438\u0435", className: className, onClick: () => window.location.reload() }) }));
}
