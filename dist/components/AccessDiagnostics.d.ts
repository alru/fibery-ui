export type AccessDiagnosticsProps = {
    /** Databases the app reads or edits, as "Space/Database". */
    databases: string[];
    className?: string;
};
/**
 * Test-phase panel: a «Проверка доступа» button that asks Fibery, as the current user, about each database (schema,
 * a count query, capability sources) and the user's role, and shows the raw answers for a screenshot.
 */
export declare function AccessDiagnostics({ databases, className }: AccessDiagnosticsProps): import("react").JSX.Element;
