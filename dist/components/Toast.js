import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// Toasts: short notices in the bottom-right corner that close by themselves, with an optional action such as
// "Undo". A bar along the bottom shows the time left; hovering the toast pauses it.
import { createContext, useCallback, useContext, useState } from "react";
import { createPortal } from "react-dom";
const ToastContext = createContext(null);
let nextId = 0;
/** Renders toasts shown with `useToast`. Already included in FiberyUIProvider. */
export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const show = useCallback((options) => setToasts((list) => [...list, { ...options, id: ++nextId }]), []);
    const dismiss = (id) => setToasts((list) => list.filter((t) => t.id !== id));
    return (_jsxs(ToastContext.Provider, { value: show, children: [children, createPortal(_jsx("div", { className: "fui-toasts", role: "region", "aria-label": "\u0423\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u044F", children: toasts.map((t) => (_jsxs("div", { className: "fui-toast", role: "status", children: [_jsx("span", { className: "fui-toast__message", children: t.message }), t.actionLabel && (_jsx("button", { type: "button", className: "fui-toast__action", onClick: () => {
                                t.onAction?.();
                                dismiss(t.id);
                            }, children: t.actionLabel })), _jsx("span", { className: "fui-toast__progress", style: { ["--fui-toast-duration"]: `${t.duration ?? 6000}ms` }, onAnimationEnd: () => dismiss(t.id) })] }, t.id))) }), document.body)] }));
}
/**
 * Returns `toast(options)` to show a notice in the corner, e.g.
 * `toast({message: "Removed", actionLabel: "Undo", onAction: restore})`.
 */
export function useToast() {
    const show = useContext(ToastContext);
    if (!show)
        throw new Error("useToast() needs <FiberyUIProvider> (or <ToastProvider>) around the app");
    return show;
}
