import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// Access diagnostics for the test phase: shows how Fibery answers the current user about each database the app
// needs, so the real access check (no-access stub, read-only mode) is built on observed answers, not guesses.
// Runs only on click and sequentially (Fibery's rate limits); calls the same-origin API with the viewer's session.
import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { Button } from "./Button";
import { Table } from "./Table";
const MAX_TEXT = 400;
const short = (text, max = MAX_TEXT) => (text.length > max ? `${text.slice(0, max)}…` : text);
/** One /api/commands call; any failure comes back as text instead of throwing, since failures are the point. */
const runCommand = async (command, args) => {
    try {
        const res = await fetch(`/api/commands?reason=custom-app-access-diagnostics&_=${encodeURIComponent(command)}`, {
            method: "POST",
            credentials: "same-origin",
            headers: { "content-type": "application/json" },
            body: JSON.stringify([{ command, args }]),
        });
        const body = await res.text();
        if (!res.ok)
            return { label: command, ok: false, text: `HTTP ${res.status}: ${short(body)}` };
        const [envelope] = JSON.parse(body);
        if (!envelope?.success)
            return { label: command, ok: false, text: short(JSON.stringify(envelope?.result ?? body)) };
        return { label: command, ok: true, text: "", result: envelope.result };
    }
    catch (error) {
        return { label: command, ok: false, text: error instanceof Error ? error.message : String(error) };
    }
};
const run = async (databases) => {
    const me = await runCommand("fibery.entity/query", {
        query: {
            "q/from": "fibery/user",
            "q/select": ["fibery/id", "fibery/public-id", "fibery/role"],
            "q/where": ["=", ["fibery/id"], "$my-id"],
            "q/limit": 1,
        },
    });
    const meRow = me.ok ? me.result[0] : undefined;
    const myId = meRow?.["fibery/id"];
    const user = {
        label: "Пользователь",
        ok: me.ok && meRow != null,
        text: meRow ? `роль ${meRow["fibery/role"]}, public-id ${meRow["fibery/public-id"]}` : me.text || "не найден",
    };
    let schemaTypes = null;
    let schemaError = "";
    try {
        const res = await fetch("/api/schema?with-description=false&with-soft-deleted=false", { credentials: "same-origin" });
        if (res.ok) {
            // The schema may come bare or in a {success, result} envelope; anything else is reported by its top-level keys.
            const json = (await res.json());
            const root = (json.result ?? json);
            const types = root["schema/types"];
            if (Array.isArray(types))
                schemaTypes = types;
            else
                schemaError = `нет schema/types; ключи ответа: ${short(Object.keys(root).join(", "))}`;
        }
        else
            schemaError = `HTTP ${res.status}: ${short(await res.text())}`;
    }
    catch (error) {
        schemaError = error instanceof Error ? error.message : String(error);
    }
    const results = [];
    for (const name of databases) {
        const probes = [];
        const type = schemaTypes?.find((t) => t["fibery/name"] === name);
        const fields = type?.["fibery/fields"]?.length;
        // Access-related keys of the type's meta, if Fibery puts any there for the viewer.
        const meta = (type?.["fibery/meta"] ?? {});
        const accessMeta = Object.entries(meta).filter(([key]) => /access|capab|permission|secur/i.test(key));
        probes.push({
            label: "Схема",
            ok: type != null,
            text: schemaTypes
                ? type
                    ? `есть, полей: ${fields ?? "?"}${accessMeta.length ? `; meta: ${short(JSON.stringify(Object.fromEntries(accessMeta)))}` : ""}`
                    : "базы нет в схеме"
                : schemaError,
        });
        const count = await runCommand("fibery.entity/query", { query: { "q/from": name, "q/select": ["q/count", "fibery/id"] } });
        probes.push({ label: "Чтение (count)", ok: count.ok, text: count.ok ? `записей видно: ${JSON.stringify(count.result)}` : count.text });
        // Rows themselves, not an aggregate: tells whether the count above is filtered by the viewer's access.
        const rows = await runCommand("fibery.entity/query", {
            query: { "q/from": name, "q/select": ["fibery/id"], "q/limit": "q/no-limit" },
        });
        probes.push({
            label: "Чтение (строки)",
            ok: rows.ok,
            text: rows.ok ? `строк получено: ${rows.result.length}` : rows.text,
        });
        const caps = await runCommand("fibery.type/query-capability-sources", { type: name });
        let capsText = caps.text;
        if (caps.ok) {
            // The answer maps user ids to their access; only the viewer's own part is shown (others' is not ours to print).
            const result = (caps.result ?? {});
            const total = Array.isArray(result) ? result.length : Object.keys(result).length;
            const mine = myId
                ? Array.isArray(result)
                    ? result.find((entry) => JSON.stringify(entry).includes(myId))
                    : result[myId]
                : undefined;
            capsText = mine ? `моя запись: ${short(JSON.stringify(mine), 1500)}` : `пользователей в ответе: ${total}, меня среди них нет`;
        }
        probes.push({ label: "Права (capability-sources)", ok: caps.ok, text: capsText });
        results.push({ name, probes });
    }
    return { user, databases: results };
};
/**
 * Test-phase panel: a «Проверка доступа» button that asks Fibery, as the current user, about each database (schema,
 * a count query, capability sources) and the user's role, and shows the raw answers for a screenshot.
 */
export function AccessDiagnostics({ databases, className }) {
    const [report, setReport] = useState(null);
    const [running, setRunning] = useState(false);
    const start = async () => {
        setRunning(true);
        try {
            setReport(await run(databases));
        }
        finally {
            setRunning(false);
        }
    };
    const cell = (p) => _jsxs("span", { className: p.ok ? undefined : "fui-access-diagnostics__fail", children: [p.ok ? "✓ " : "✗ ", p.text] });
    return (_jsxs("section", { className: className, children: [_jsxs("div", { className: "fui-access-diagnostics__bar", children: [_jsx(Button, { variant: "outline", size: "sm", icon: _jsx(ShieldCheck, {}), loading: running, onClick: start, children: report ? "Проверить доступ ещё раз" : "Проверка доступа" }), _jsx("span", { className: "fui-access-diagnostics__note", children: "\u0422\u0435\u0441\u0442\u043E\u0432\u044B\u0439 \u0440\u0435\u0436\u0438\u043C: \u0447\u0442\u043E Fibery \u043E\u0442\u0432\u0435\u0447\u0430\u0435\u0442 \u0442\u0435\u043A\u0443\u0449\u0435\u043C\u0443 \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044E" })] }), report && (_jsx("div", { className: "fui-access-diagnostics__result", children: _jsxs(Table, { className: "fui-access-diagnostics__table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "\u0411\u0430\u0437\u0430" }), _jsx("th", { children: "\u041F\u0440\u043E\u0431\u0430" }), _jsx("th", { children: "\u041E\u0442\u0432\u0435\u0442" })] }) }), _jsxs("tbody", { children: [_jsxs("tr", { children: [_jsx("td", { children: "\u2014" }), _jsx("td", { children: report.user.label }), _jsx("td", { children: cell(report.user) })] }), report.databases.flatMap((db) => db.probes.map((p, n) => (_jsxs("tr", { children: [_jsx("td", { children: n === 0 ? db.name : "" }), _jsx("td", { children: p.label }), _jsx("td", { children: cell(p) })] }, `${db.name}-${p.label}`))))] })] }) }))] }));
}
