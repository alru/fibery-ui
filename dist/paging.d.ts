/**
 * All rows of a paged query: asks for `pageSize` rows at growing offsets until a page comes back short. The query
 * must be ordered stably (e.g. by `fibery/id`), or pages may overlap or skip rows.
 *
 * @example
 * fetchAllPages((offset, limit) => queryEntities({type, fields, orderBy: {field: "fibery/id"}, offset, limit}));
 */
export declare function fetchAllPages<T>(fetchPage: (offset: number, limit: number) => Promise<T[]>, pageSize?: number): Promise<T[]>;
