// Loading every row of a Fibery query: one request returns at most 3001 rows, so bigger databases are read page by
// page. Pure, so tests run it directly.

/**
 * All rows of a paged query: asks for `pageSize` rows at growing offsets until a page comes back short. The query
 * must be ordered stably (e.g. by `fibery/id`), or pages may overlap or skip rows.
 *
 * @example
 * fetchAllPages((offset, limit) => queryEntities({type, fields, orderBy: {field: "fibery/id"}, offset, limit}));
 */
export async function fetchAllPages<T>(fetchPage: (offset: number, limit: number) => Promise<T[]>, pageSize = 3000): Promise<T[]> {
  const all: T[] = [];
  for (let offset = 0; ; offset += pageSize) {
    const page = await fetchPage(offset, pageSize);
    all.push(...page);
    if (page.length < pageSize) return all;
  }
}
