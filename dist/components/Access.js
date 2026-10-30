import { jsx as _jsx } from "react/jsx-runtime";
// Access check: whether the viewer may use the app at all, and whether to offer editing. Fibery returns the records of
// a database the viewer has no access to, with only the secured fields emptied (relations, selects and lookups are
// never secured), so neither a successful query nor a row count proves access; a filled secured field does.
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { Lock } from "lucide-react";
import { isPermissionError } from "../errors";
import { Button } from "./Button";
import { EmptyState, ErrorState, LoadingState } from "./States";
/** One /api/commands call in the viewer's session; failures carry "failed: <status>" for isPermissionError. */
const command = async (name, args) => {
    const res = await fetch(`/api/commands?reason=custom-app-access&_=${encodeURIComponent(name)}`, {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify([{ command: name, args }]),
    });
    const body = await res.text();
    if (!res.ok) {
        throw new Error(`Fibery command "${name}" failed: ${res.status} ${body}`);
    }
    const [envelope] = JSON.parse(body);
    if (!envelope?.success) {
        throw new Error(`Fibery command "${name}" failed: ${JSON.stringify(envelope?.result)}`);
    }
    return envelope.result;
};
const schemaTypes = async () => {
    const res = await fetch("/api/schema?with-description=false&with-soft-deleted=false", { credentials: "same-origin" });
    if (!res.ok)
        throw new Error(`Fibery schema request failed: ${res.status} ${await res.text()}`);
    const json = (await res.json());
    return (json.result ?? json)["fibery/types"];
};
/**
 * The field to check a database by: a secured, required own field (Email (ID) on a profile), else the secured title
 * (a formula on databases with no own fields, filled whenever the record is readable).
 */
const checkField = (type) => {
    const meta = (f) => (f["fibery/meta"] ?? {});
    const secured = (type["fibery/fields"] ?? []).filter((f) => meta(f)["fibery/secured?"] === true && !String(f["fibery/name"]).startsWith("fibery/"));
    const field = secured.find((f) => meta(f)["fibery/required?"] === true && !meta(f)["formula/formula?"]) ??
        secured.find((f) => meta(f)["ui/title?"] === true);
    return field?.["fibery/name"];
};
// Up to this many records are looked at; one filled field among them is enough (sharing can open single records).
const SAMPLE = 1000;
const readable = async (database, field) => {
    try {
        const rows = await command("fibery.entity/query", {
            query: { "q/from": database, "q/select": ["fibery/id", field], "q/limit": SAMPLE },
        });
        // An empty database proves nothing either way; the app shows its own empty state.
        return rows.length === 0 || rows.some((r) => r[field] != null && r[field] !== "");
    }
    catch (error) {
        if (isPermissionError(error))
            return false;
        throw error;
    }
};
const runCheck = async (requirements) => {
    const types = await schemaTypes();
    const denied = [];
    for (const requirement of requirements) {
        const database = typeof requirement === "string" ? requirement : requirement.database;
        const type = types.find((t) => t["fibery/name"] === database);
        if (!type) {
            denied.push(database);
            continue;
        }
        const field = typeof requirement === "string" ? checkField(type) : requirement.field;
        if (!field)
            throw new Error(`No secured field to check access to ${database} by: pass {database, field}`);
        if (!(await readable(database, field)))
            denied.push(database);
    }
    if (denied.length)
        return { status: "denied", databases: denied };
    // Observers and guests can't edit; for members Fibery has no answer short of a refused save.
    let role = "";
    try {
        const [me] = await command("fibery.entity/query", {
            query: { "q/from": "fibery/user", "q/select": ["fibery/role"], "q/where": ["=", ["fibery/id"], "$my-id"], "q/limit": 1 },
        });
        role = String(me?.["fibery/role"] ?? "");
    }
    catch {
        // Unknown role: editing stays on, a refused save still switches it off.
    }
    return { status: "granted", editableByRole: role !== "role/observer" && role !== "role/guest" };
};
const AccessContext = createContext({ canEdit: true, markReadOnly: () => { } });
/** Access of the viewer inside `AccessGate`; outside one, everything is allowed. */
export const useAccess = () => useContext(AccessContext);
/**
 * Renders the app only for viewers who can read every listed database; others get a «Недостаточно доступа» screen
 * with the number of missing databases, not their names (the names say nothing to a user and outline the schema).
 * Checks once on mount: the schema, one small query per database and one for the role.
 */
export function AccessGate({ databases, children }) {
    const [check, setCheck] = useState({ status: "checking" });
    const [readOnly, setReadOnly] = useState(false);
    const key = JSON.stringify(databases);
    const run = useCallback(() => {
        setCheck({ status: "checking" });
        runCheck(JSON.parse(key)).then(setCheck, (error) => setCheck({ status: "error", error }));
    }, [key]);
    useEffect(run, [run]);
    const markReadOnly = useCallback(() => setReadOnly(true), []);
    if (check.status === "checking")
        return _jsx(LoadingState, { className: "fui-access-gate", children: "\u041F\u0440\u043E\u0432\u0435\u0440\u043A\u0430 \u0434\u043E\u0441\u0442\u0443\u043F\u0430\u2026" });
    if (check.status === "error")
        return _jsx(ErrorState, { className: "fui-access-gate", error: check.error, onRetry: run });
    if (check.status === "denied") {
        return (_jsx("div", { className: "fui-access-gate", children: _jsx(EmptyState, { icon: _jsx(Lock, {}), title: "\u041D\u0435\u0434\u043E\u0441\u0442\u0430\u0442\u043E\u0447\u043D\u043E \u0434\u043E\u0441\u0442\u0443\u043F\u0430", description: `Нет прав на чтение части данных приложения (баз без доступа: ${check.databases.length}). Обратитесь к администратору Fibery.`, action: _jsx(Button, { variant: "outline", size: "sm", onClick: run, children: "\u041F\u0440\u043E\u0432\u0435\u0440\u0438\u0442\u044C \u0441\u043D\u043E\u0432\u0430" }) }) }));
    }
    return (_jsx(AccessContext.Provider, { value: { canEdit: check.editableByRole && !readOnly, markReadOnly }, children: children }));
}
