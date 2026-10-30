// Access diagnostics for the test phase: shows how Fibery answers the current user about each database the app
// needs, so the real access check (no-access stub, read-only mode) is built on observed answers, not guesses.
// Runs only on click and sequentially (Fibery's rate limits); calls the same-origin API with the viewer's session.
import {useState} from "react";
import {ShieldCheck} from "lucide-react";
import {Button} from "./Button";
import {Table} from "./Table";

type Probe = {label: string; ok: boolean; text: string};
type Report = {user: Probe; databases: {name: string; probes: Probe[]}[]};

const MAX_TEXT = 400;
const short = (text: string, max = MAX_TEXT) => (text.length > max ? `${text.slice(0, max)}…` : text);

/** One /api/commands call; any failure comes back as text instead of throwing, since failures are the point. */
const runCommand = async (command: string, args: unknown): Promise<Probe & {result?: unknown}> => {
  try {
    const res = await fetch(`/api/commands?reason=custom-app-access-diagnostics&_=${encodeURIComponent(command)}`, {
      method: "POST",
      credentials: "same-origin",
      headers: {"content-type": "application/json"},
      body: JSON.stringify([{command, args}]),
    });
    const body = await res.text();
    if (!res.ok) return {label: command, ok: false, text: `HTTP ${res.status}: ${short(body)}`};
    const [envelope] = JSON.parse(body) as {success: boolean; result: unknown}[];
    if (!envelope?.success) return {label: command, ok: false, text: short(JSON.stringify(envelope?.result ?? body))};
    return {label: command, ok: true, text: "", result: envelope.result};
  } catch (error) {
    return {label: command, ok: false, text: error instanceof Error ? error.message : String(error)};
  }
};

const run = async (databases: string[]): Promise<Report> => {
  const me = await runCommand("fibery.entity/query", {
    query: {
      "q/from": "fibery/user",
      "q/select": ["fibery/id", "fibery/public-id", "fibery/role"],
      "q/where": ["=", ["fibery/id"], "$my-id"],
      "q/limit": 1,
    },
  });
  const meRow = me.ok ? (me.result as Record<string, string>[])[0] : undefined;
  const myId = meRow?.["fibery/id"];
  const user: Probe = {
    label: "Пользователь",
    ok: me.ok && meRow != null,
    text: meRow ? `роль ${meRow["fibery/role"]}, public-id ${meRow["fibery/public-id"]}` : me.text || "не найден",
  };

  let schemaTypes: Record<string, unknown>[] | null = null;
  let schemaError = "";
  try {
    const res = await fetch("/api/schema?with-description=false&with-soft-deleted=false", {credentials: "same-origin"});
    if (res.ok) {
      // The schema may come bare or in a {success, result} envelope; anything else is reported by its top-level keys.
      const json = (await res.json()) as Record<string, unknown>;
      const root = (json.result ?? json) as Record<string, unknown>;
      const types = root["fibery/types"];
      if (Array.isArray(types)) schemaTypes = types as Record<string, unknown>[];
      else schemaError = `нет fibery/types; ключи ответа: ${short(Object.keys(root).join(", "))}`;
    } else schemaError = `HTTP ${res.status}: ${short(await res.text())}`;
  } catch (error) {
    schemaError = error instanceof Error ? error.message : String(error);
  }

  const results: Report["databases"] = [];
  for (const name of databases) {
    const probes: Probe[] = [];
    const type = schemaTypes?.find((t) => t["fibery/name"] === name);
    const fields = (type?.["fibery/fields"] as unknown[] | undefined)?.length;
    // Access-related keys of the type's meta, if Fibery puts any there for the viewer.
    const meta = (type?.["fibery/meta"] ?? {}) as Record<string, unknown>;
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

    const count = await runCommand("fibery.entity/query", {query: {"q/from": name, "q/select": ["q/count", "fibery/id"]}});
    probes.push({label: "Чтение (count)", ok: count.ok, text: count.ok ? `записей видно: ${JSON.stringify(count.result)}` : count.text});

    // Rows themselves, not an aggregate: tells whether the count above is filtered by the viewer's access.
    const rows = await runCommand("fibery.entity/query", {
      query: {"q/from": name, "q/select": ["fibery/id"], "q/limit": "q/no-limit"},
    });
    probes.push({
      label: "Чтение (строки)",
      ok: rows.ok,
      text: rows.ok ? `строк получено: ${(rows.result as unknown[]).length}` : rows.text,
    });

    const caps = await runCommand("fibery.type/query-capability-sources", {type: name});
    let capsText = caps.text;
    if (caps.ok) {
      // The answer maps user ids to their access; only the viewer's own part is shown (others' is not ours to print).
      const result = (caps.result ?? {}) as Record<string, unknown>;
      const total = Array.isArray(result) ? result.length : Object.keys(result).length;
      const mine = myId
        ? Array.isArray(result)
          ? result.find((entry) => JSON.stringify(entry).includes(myId))
          : result[myId]
        : undefined;
      capsText = mine ? `моя запись: ${short(JSON.stringify(mine), 1500)}` : `пользователей в ответе: ${total}, меня среди них нет`;
    }
    probes.push({label: "Права (capability-sources)", ok: caps.ok, text: capsText});
    results.push({name, probes});
  }
  return {user, databases: results};
};

export type AccessDiagnosticsProps = {
  /** Databases the app reads or edits, as "Space/Database". */
  databases: string[];
  className?: string;
};

/**
 * Test-phase panel: a «Проверка доступа» button that asks Fibery, as the current user, about each database (schema,
 * a count query, capability sources) and the user's role, and shows the raw answers for a screenshot.
 */
export function AccessDiagnostics({databases, className}: AccessDiagnosticsProps) {
  const [report, setReport] = useState<Report | null>(null);
  const [running, setRunning] = useState(false);
  const start = async () => {
    setRunning(true);
    try {
      setReport(await run(databases));
    } finally {
      setRunning(false);
    }
  };
  const cell = (p: Probe) => <span className={p.ok ? undefined : "fui-access-diagnostics__fail"}>{p.ok ? "✓ " : "✗ "}{p.text}</span>;
  return (
    <section className={className}>
      <div className="fui-access-diagnostics__bar">
        <Button variant="outline" size="sm" icon={<ShieldCheck />} loading={running} onClick={start}>
          {report ? "Проверить доступ ещё раз" : "Проверка доступа"}
        </Button>
        <span className="fui-access-diagnostics__note">Тестовый режим: что Fibery отвечает текущему пользователю</span>
      </div>
      {report && (
        <div className="fui-access-diagnostics__result">
          <Table className="fui-access-diagnostics__table">
            <thead>
              <tr>
                <th>База</th>
                <th>Проба</th>
                <th>Ответ</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>—</td>
                <td>{report.user.label}</td>
                <td>{cell(report.user)}</td>
              </tr>
              {report.databases.flatMap((db) =>
                db.probes.map((p, n) => (
                  <tr key={`${db.name}-${p.label}`}>
                    <td>{n === 0 ? db.name : ""}</td>
                    <td>{p.label}</td>
                    <td>{cell(p)}</td>
                  </tr>
                )),
              )}
            </tbody>
          </Table>
        </div>
      )}
    </section>
  );
}
