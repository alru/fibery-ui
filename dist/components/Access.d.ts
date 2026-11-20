import { type ReactNode } from "react";
/** A database the app can't work without, or one with the secured, always-filled field to check it by. */
export type AccessRequirement = string | {
    database: string;
    field: string;
};
export type AccessValue = {
    /** False for observers and guests, and after `markReadOnly`: hide editing tools. */
    canEdit: boolean;
    /** Call when Fibery refuses a write for lack of rights to the app's data as a whole: editing stays off everywhere
     *  until the app reloads. */
    markReadOnly: () => void;
    /** Whether Fibery refused a write to this record (see `markRecordReadOnly`). */
    isRecordReadOnly: (id: string) => boolean;
    /** A refused write on one record, where rights differ per record: only this record stops being editable, until the
     *  app reloads; the rest of the app stays editable. */
    markRecordReadOnly: (id: string) => void;
};
/** Access of the viewer inside `AccessGate`; outside one, everything is allowed. */
export declare const useAccess: () => AccessValue;
export type AccessGateProps = {
    /** Databases the app can't work without: "Space/Database", or `{database, field}` to name the field to check by. */
    databases: AccessRequirement[];
    children: ReactNode;
};
/**
 * Renders the app only for viewers who can read every listed database; others get a «Недостаточно доступа» /
 * "Not enough access" screen with the number of missing databases, not their names (the names say nothing to a user
 * and outline the schema). Checks once on mount: the schema, one or two small queries per database and one for the
 * role. Keeps the read-only state for `useAccess`.
 */
export declare function AccessGate({ databases, children }: AccessGateProps): import("react").JSX.Element;
