// Access check: whether the viewer may use the app at all, and whether to offer editing. Fibery returns the records of
// a database the viewer has no access to, with only the secured fields emptied (relations, selects and lookups are
// never secured), so neither a successful query nor a row count proves access; a filled secured field does.
import {createContext, useCallback, useContext, useEffect, useState, type ReactNode} from "react";
import {Lock} from "lucide-react";
import {isPermissionError} from "../errors";
import {Button} from "./Button";
import {EmptyState, ErrorState, LoadingState} from "./States";

/** A database the app can't work without, or one with the secured, always-filled field to check it by. */
export type AccessRequirement = string | {database: string; field: string};

type Row = Record<string, unknown>;
type Check =
  | {status: "checking"}
  | {status: "granted"; editableByRole: boolean}
  | {status: "denied"; databases: string[]}
  | {status: "error"; error: unknown};

/** One /api/commands call in the viewer's session; failures carry "failed: <status>" for isPermissionError. */
const command = async <T,>(name: string, args: unknown): Promise<T> => {
  const res = await fetch(`/api/commands?reason=custom-app-access&_=${encodeURIComponent(name)}`, {
    method: "POST",
    credentials: "same-origin",
    headers: {"content-type": "application/json"},
    body: JSON.stringify([{command: name, args}]),
  });
  const body = await res.text();
  if (!res.ok) {
    throw new Error(`Fibery command "${name}" failed: ${res.status} ${body}`);
  }
  const [envelope] = JSON.parse(body) as {success: boolean; result: unknown}[];
  if (!envelope?.success) {
    throw new Error(`Fibery command "${name}" failed: ${JSON.stringify(envelope?.result)}`);
  }
  return envelope.result as T;
};

const schemaTypes = async (): Promise<Row[]> => {
  const res = await fetch("/api/schema?with-description=false&with-soft-deleted=false", {credentials: "same-origin"});
  if (!res.ok) throw new Error(`Fibery schema request failed: ${res.status} ${await res.text()}`);
  const json = (await res.json()) as Row;
  return ((json.result ?? json) as Row)["fibery/types"] as Row[];
};

/**
 * The field to check a database by: a secured, required own field (Email (ID) on a profile), else the secured title
 * (a formula on databases with no own fields, filled whenever the record is readable).
 */
const checkField = (type: Row): string | undefined => {
  const meta = (f: Row) => (f["fibery/meta"] ?? {}) as Row;
  const secured = ((type["fibery/fields"] ?? []) as Row[]).filter(
    (f) => meta(f)["fibery/secured?"] === true && !String(f["fibery/name"]).startsWith("fibery/"),
  );
  const field =
    secured.find((f) => meta(f)["fibery/required?"] === true && !meta(f)["formula/formula?"]) ??
    secured.find((f) => meta(f)["ui/title?"] === true);
  return field?.["fibery/name"] as string | undefined;
};

// Up to this many records are looked at; one filled field among them is enough (sharing can open single records).
const SAMPLE = 1000;

const readable = async (database: string, field: string): Promise<boolean> => {
  try {
    const rows = await command<Row[]>("fibery.entity/query", {
      query: {"q/from": database, "q/select": ["fibery/id", field], "q/limit": SAMPLE},
    });
    // An empty database proves nothing either way; the app shows its own empty state.
    return rows.length === 0 || rows.some((r) => r[field] != null && r[field] !== "");
  } catch (error) {
    if (isPermissionError(error)) return false;
    throw error;
  }
};

const runCheck = async (requirements: AccessRequirement[]): Promise<Check> => {
  const types = await schemaTypes();
  const denied: string[] = [];
  for (const requirement of requirements) {
    const database = typeof requirement === "string" ? requirement : requirement.database;
    const type = types.find((t) => t["fibery/name"] === database);
    if (!type) {
      denied.push(database);
      continue;
    }
    const field = typeof requirement === "string" ? checkField(type) : requirement.field;
    if (!field) throw new Error(`No secured field to check access to ${database} by: pass {database, field}`);
    if (!(await readable(database, field))) denied.push(database);
  }
  if (denied.length) return {status: "denied", databases: denied};
  // Observers and guests can't edit; for members Fibery has no answer short of a refused save.
  let role = "";
  try {
    const [me] = await command<Row[]>("fibery.entity/query", {
      query: {"q/from": "fibery/user", "q/select": ["fibery/role"], "q/where": ["=", ["fibery/id"], "$my-id"], "q/limit": 1},
    });
    role = String(me?.["fibery/role"] ?? "");
  } catch {
    // Unknown role: editing stays on, a refused save still switches it off.
  }
  return {status: "granted", editableByRole: role !== "role/observer" && role !== "role/guest"};
};

export type AccessValue = {
  /** False for observers and guests, and after `markReadOnly`: hide editing tools. */
  canEdit: boolean;
  /** Call when Fibery refuses a write for lack of rights: editing stays off until the app reloads. */
  markReadOnly: () => void;
};

const AccessContext = createContext<AccessValue>({canEdit: true, markReadOnly: () => {}});

/** Access of the viewer inside `AccessGate`; outside one, everything is allowed. */
export const useAccess = () => useContext(AccessContext);

export type AccessGateProps = {
  /** Databases the app can't work without: "Space/Database", or `{database, field}` to name the field to check by. */
  databases: AccessRequirement[];
  children: ReactNode;
};

/**
 * Renders the app only for viewers who can read every listed database; others get a «Нет доступа» screen naming
 * the missing ones. Checks once on mount: the schema, one small query per database and one for the role.
 */
export function AccessGate({databases, children}: AccessGateProps) {
  const [check, setCheck] = useState<Check>({status: "checking"});
  const [readOnly, setReadOnly] = useState(false);
  const key = JSON.stringify(databases);
  const run = useCallback(() => {
    setCheck({status: "checking"});
    runCheck(JSON.parse(key) as AccessRequirement[]).then(setCheck, (error: unknown) => setCheck({status: "error", error}));
  }, [key]);
  useEffect(run, [run]);
  const markReadOnly = useCallback(() => setReadOnly(true), []);

  if (check.status === "checking") return <LoadingState className="fui-access-gate">Проверка доступа…</LoadingState>;
  if (check.status === "error") return <ErrorState className="fui-access-gate" error={check.error} onRetry={run} />;
  if (check.status === "denied") {
    return (
      <div className="fui-access-gate">
        <EmptyState
          icon={<Lock />}
          title="Нет доступа"
          description={`Нет прав на чтение: ${check.databases.join(", ")}. Обратитесь к администратору Fibery.`}
          action={
            <Button variant="outline" size="sm" onClick={run}>
              Проверить снова
            </Button>
          }
        />
      </div>
    );
  }
  return (
    <AccessContext.Provider value={{canEdit: check.editableByRole && !readOnly, markReadOnly}}>{children}</AccessContext.Provider>
  );
}
