import { type ReactNode } from "react";
/** A database the app can't work without, or one with the secured, always-filled field to check it by. */
export type AccessRequirement = string | {
    database: string;
    field: string;
};
export type AccessValue = {
    /** False for observers and guests, and after `markReadOnly`: hide editing tools. */
    canEdit: boolean;
    /** Call when Fibery refuses a write for lack of rights: editing stays off until the app reloads. */
    markReadOnly: () => void;
};
/** Access of the viewer inside `AccessGate`; outside one, everything is allowed. */
export declare const useAccess: () => AccessValue;
export type AccessGateProps = {
    /** Databases the app can't work without: "Space/Database", or `{database, field}` to name the field to check by. */
    databases: AccessRequirement[];
    children: ReactNode;
};
/**
 * Renders the app only for viewers who can read every listed database; others get a «Нет доступа» screen naming
 * the missing ones. Checks once on mount: the schema, one small query per database and one for the role.
 */
export declare function AccessGate({ databases, children }: AccessGateProps): import("react").JSX.Element;
