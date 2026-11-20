import { jsx as _jsx } from "react/jsx-runtime";
import { Copy } from "lucide-react";
import { cx } from "../cx";
import { IconButton } from "./Button";
import { useKitTexts } from "./KitLang";
import { useToast } from "./Toast";
/** Icon button that copies `value` and shows `message` in a toast; clicks don't reach a clickable row around it. */
export function CopyButton({ value, message, "aria-label": ariaLabel, className }) {
    const toast = useToast();
    const t = useKitTexts();
    const copy = (e) => {
        // Rows around it usually open a panel on click; copying must not.
        e.stopPropagation();
        navigator.clipboard.writeText(value).then(() => toast({ message: message ?? t.copied, duration: 2500 }), () => toast({ message: t.copyFailed }));
    };
    return (_jsx(IconButton, { icon: _jsx(Copy, {}), "aria-label": ariaLabel ?? t.copy, className: cx("fui-copy-button", className), onClick: copy, 
        // A row's Enter / Space handler would otherwise swallow the key and open the row instead.
        onKeyDown: (e) => e.stopPropagation() }));
}
