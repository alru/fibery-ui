# @alru/fibery-ui

React components for [Fibery Custom Apps](https://fibery.io), made to look native inside Fibery.

## Why this exists

Every Fibery Custom App starts from the same bare template: Tailwind, theme variables, and no components.
Each new app used to rebuild buttons, inputs, menus and loading states from scratch, and each rebuild drifted
a little further from Fibery's own look and from the previous app.

This kit solves that once:

- **Native look.** Sizes, radii, typography and shadows are measured from Fibery's own UI (compact 24–32px
  controls, 6–8px radii, Inter at weight 410, ring-style borders), so apps blend into the workspace.
- **Theme for free.** Colors come only from the variables Fibery injects into every app (`--primary`,
  `--border`, `--highlight-*`), so components follow light/dark mode and the workspace palette with no setup.
- **One place to fix things.** A bug fix or design tweak lands in every app by bumping the pinned release
  commit instead of being patched app by app.
- **No Tailwind dependency.** Plain CSS in `@layer components`: works next to the template's Tailwind, and
  Tailwind utilities can still override any kit style via `className`.

## The rule: kit first

**If an app needs a new component, variant or behavior, add it to the kit first, then use it from the app.**
Do not build one-off copies inside apps. A "special" button style, a slightly different list row or a custom
empty state is almost always something the next app will want too; in the kit it gets the Fibery look, the
theme rules and the fixes for free, and every app stays consistent.

One-offs are allowed only for genuinely app-specific UI that cannot be generalized — for example, a
visualization of one particular domain model. Before writing a one-off, ask: "could another app use this
with different data?" If yes, it belongs in the kit.

## Install

The kit is not published to npm. Apps install it straight from GitHub: the `release` branch carries the
compiled `dist/`, so nothing is built during install. Fibery's server build fetches it like any other dependency.

In the app's `package.json`, pin the **release commit** (not a tag or branch — tags can be moved, a commit
hash cannot):

```json
"@alru/fibery-ui": "github:alru/fibery-ui#<release commit sha>"
```

Each release is tagged `vX.Y.Z` on the `release` branch; find the commit with
`git rev-parse vX.Y.Z` or on the [tags page](https://github.com/alru/fibery-ui/tags).
The release script prints the ready-to-paste line.

React, Radix and lucide-react are peer dependencies; the Fibery app template already includes all of them.

In `Root` of `src/routes.tsx` (Fibery's platform 3 owns `src/main.tsx` and drops edits to it). Import the app's
`index.css` there first, so the kit styles load after the app theme:

```tsx
import "./index.css";
import "@alru/fibery-ui/style.css";
import {FiberyUIProvider} from "@alru/fibery-ui";

// Optional: gives every Lucide icon in the app Fibery's 16px / 1.75 stroke proportions.
<FiberyUIProvider><Outlet /></FiberyUIProvider>
```

## Components

**Actions**

```tsx
<Button>Save</Button>                                   // primary | secondary | outline | ghost | destructive
<Button variant="ghost" size="sm" icon={<Plus />}>Add</Button>   // sm 24px | md 28px | lg 32px
<Button loading>Saving</Button>
<Button asChild variant="outline"><a href="…">Open</a></Button>
<IconButton icon={<MoreHorizontal />} aria-label="More" />
```

**Display**

```tsx
<Badge>Draft</Badge>  <Badge hue="green">Done</Badge>  <Badge variant="outline" hue="red">Blocked</Badge>
<Badge caps>Contractor</Badge>                          // Fibery's uppercase type label
<EnumBadge name={state["enum/name"]} color={state["enum/color"]} />            // dot + name; a long name ends with "…" at its container's width
<EnumBadge name="A" color="#4FAF54" variant="circle" />                         // letter in a ring
<Avatar name="Jane Doe" src={url} size="sm" />

<Card interactive onClick={…}>
  <CardHeader title="Skills" description="4 linked" actions={<IconButton … />} />
  <CardContent>…</CardContent>
</Card>

<List>                                                  // Fibery relation rows
  <ListItem leading={<EnumBadge … />} trailing="B" onClick={() => openEntity(…)}>3D › Handpaint</ListItem>
  <ListItem multiline>…nested content that wraps…</ListItem>
</List>

<Table>                                                 // native thead/tbody/tr/th/td inside
  <thead><tr><th>Skill</th><th data-align="right">People</th></tr></thead>
  <tbody>
    <TableGroupRow label="3D" colSpan={2} />
    <TableGroupRow label="Characters" level={2}>                      // subgroup with its own totals
      <td data-align="right">3</td>
    </TableGroupRow>
    <tr><td data-indent="1">Handpaint</td><td data-align="right">2</td></tr>
  </tbody>
</Table>
<Table editing>…<tr data-interactive tabIndex={0} onClick={edit}>…</tr>…</Table>  // explicit edit mode, clickable rows
<tr data-interactive data-selected={open ? "" : undefined} onClick={select}>…</tr>   // row shown in a SidePanel

// Rename in place: pencil on hover (also of the table row), Enter / blur saves, Escape cancels.
<InlineEdit value={group.name} label="Rename group" hint="Renames it in 12 skills" onSave={(name) => rename(name)}>
  <Highlight text={group.name} query={tokens} />
</InlineEdit>

// Heatmap cell: background strength by value within the table's [min, max]; 0 renders as a muted dash.
<HeatValue value={count} min={tableMin} max={tableMax} />            // hue="blue" by default

<PropertyList>                                          // entity field grid
  <Property icon={<Mail />} label="Email">a@b.c</Property>
</PropertyList>
```

**Layout**

```tsx
<PageHeader eyebrow={<Badge caps>Contractor</Badge>} title="Jane Doe" actions={…} />
<SectionHeader icon={<Layers />} title="Skills" count={4} actions={…} />
<Separator />

// Master–detail: list on the left, details on the right. Mark the open row with <ListItem selected>.
// Editable details: read-only by default, `editing` highlights the panel while an explicit edit mode is on.
// PanelLayout: side by side from 1024px; narrower, the panel floats over the list, which stays behind a veil
// (a click on the veil calls onDismiss). The panel's own classes (width, sticky) apply only side by side.
<PanelLayout
  onDismiss={close}
  panel={item && (
    <SidePanel className="sticky top-6 max-h-[calc(100vh-3rem)] flex-1" title={item.name} onClose={close}
      actions={<Button variant="outline" size="sm" icon={<ExternalLink />}>Open in Fibery</Button>}>
      <PropertyList>…</PropertyList>
    </SidePanel>
  )}
>
  <List>…</List>
</PanelLayout>
```

**Forms**

```tsx
<Field label="Name" htmlFor="name" hint="As in the contract" error={err}>
  <Input id="name" invalid={!!err} />
</Field>
// Edit form with an explicit Save: `changed` puts an accent dot after the label, `warning` is a non-blocking
// note in the warning color (error > warning > hint, one line shows).
<Field label="Phone" htmlFor="phone" changed={phone !== saved.phone} warning="Same number as Jane Doe">
  <Input id="phone" />
</Field>
<Field label="Email" htmlFor="email" required>   // red asterisk after the label
  <Input id="email" />
</Field>
<SearchInput placeholder="Search…" size="sm" />
<Textarea rows={4} />
<Checkbox label="Only experts" checked={v} onCheckedChange={setV} />
<Switch label="Show archived" />

<Select value={v} onValueChange={setV}>
  <SelectTrigger><SelectValue placeholder="Level" /></SelectTrigger>
  <SelectContent>
    <SelectItem value="a"><EnumBadge name="A" color="#4FAF54" /></SelectItem>
  </SelectContent>
</Select>

// Filter by several values: trigger "Status: Active +1", menu stays open while toggling; [] = no filter.
<MultiSelect size="sm" label="Status" value={statuses} onValueChange={setStatuses}
  options={states.map((s) => ({value: s.id, label: <EnumBadge name={s.name} color={s.color} />}))} />
```

**Overlays**

```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild><IconButton icon={<MoreHorizontal />} aria-label="Actions" /></DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem icon={<Pencil />} shortcut="E">Edit</DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem icon={<Trash2 />} destructive>Delete</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>

<Popover>
  <PopoverTrigger asChild><Button variant="outline">Filters</Button></PopoverTrigger>
  <PopoverContent>…</PopoverContent>
</Popover>

<Tooltip content="Open in Fibery"><IconButton … /></Tooltip>

// Searchable picker for long catalogs: groups, highlight, ↑ ↓ Enter.
<Combobox
  placeholder="Find a skill"
  options={skills.map((s) => ({value: s.id, text: s.name, group: s.group, keywords: s.group}))}
  onSelect={addSkill}
>
  <Button variant="ghost" size="sm" icon={<Plus />}>Add</Button>
</Combobox>

// As a form field: PickerButton shows the value; onCreate adds a "Создать «…»" row for text that matches nothing.
<Field label="Group">
  <Combobox options={groups} onSelect={setGroup} onCreate={createGroup}>
    <PickerButton placeholder="Choose…">{groupName}</PickerButton>
  </Combobox>
</Field>

// Search field with suggestions under it while typing; pick one to apply an exact filter.
<Autocomplete size="sm" value={query} onValueChange={setQuery} options={skillOptions}
  onSelect={(id) => { setSkill(id); setQuery(""); }} />
<Badge onRemove={() => setSkill(null)}>3D › Handpaint</Badge>          // removable filter chip

// Form input with suggested values (instead of a native <datalist>): all show on focus, any text is accepted.
<Autocomplete variant="input" id="unit" value={unit} onValueChange={setUnit}
  options={["apt.", "room"].map((v) => ({value: v, text: v}))} onSelect={setUnit} />

<Dialog>
  <DialogTrigger asChild><Button>New</Button></DialogTrigger>
  <DialogContent title="New contractor" description="…" size="sm">
    …
    <DialogFooter><DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose><Button>Create</Button></DialogFooter>
  </DialogContent>
</Dialog>
```

**Tabs**

```tsx
<Tabs defaultValue="list">
  <TabsList>                                            // segmented (default) | line
    <TabsTrigger value="list">List</TabsTrigger>
    <TabsTrigger value="matrix">Matrix</TabsTrigger>
  </TabsList>
  <TabsContent value="list" keepMounted>…</TabsContent>    // keepMounted: state survives tab switches
</Tabs>

// Same look for picking a value (filters): a radio group, arrow keys move the selection.
<SegmentedControl
  aria-label="Minimum level"
  value={level}
  onValueChange={setLevel}
  options={[{value: "any", label: "Any"}, {value: "A", label: "A"}, {value: "B", label: "B+"}]}
/>

// `scale`: ordered options, everything up to the selection is filled — a level meter.
<SegmentedControl scale aria-label="Minimum level" value={min} onValueChange={setMin}
  options={["D", "C", "B", "A"].map((l) => ({value: l, label: l}))} />

// `label`: muted caption inside an input-styled frame, like MultiSelect's "Status: All" — use it in a filter row
// next to MultiSelects so all filters share one look and height (28px).
<SegmentedControl label="Level" scale aria-label="Minimum level" value={min} onValueChange={setMin} options={…} />
```

**Search**

```tsx
const tokens = searchTokens(query);                     // lowercased, "ё" → "е", split by spaces
const hit = tokens.every((t) => normalizeSearchText(name).includes(t));
<Highlight text={name} query={tokens} />                // marks every match in the highlight palette
<Highlight text="3D > Handpaint" separator=" > " />    // path text: separators small and muted (also on Combobox/Autocomplete)
```

**Feedback**

```tsx
{isPending && <LoadingState />}
{error && <ErrorState error={error} onRetry={refetch} retrying={isFetching} />}   // «Повторить» button; `action` adds more
<RefreshWarning error={error} onRetry={refetch} retrying={isFetching} />   // data on screen, refetch failed
<EmptyState title="No contractors" description="…" action={…} />
<Callout>Empty groups are removed automatically.</Callout>   // always-visible note: info | warning | neutral
<Skeleton style={{height: 20, width: 160}} />
<Spinner size="sm" />

// Notice in the bottom-right corner with a time bar; closes by itself (hover pauses it). Needs FiberyUIProvider.
const toast = useToast();
toast({message: "Skill removed: Jane Doe", actionLabel: "Undo", onAction: restore, duration: 6000});
```

`ErrorState` explains transient failures in plain words (see below) and keeps the raw message under that text,
small and muted: it is what a bug report needs.

**Errors**

Helpers for the errors the platform's `@/lib/fibery` throws (`Fibery command "…" failed: 503 <body>` and the like).
The platform client has no retries of its own.

```tsx
httpStatusOf(error);          // 503 — from a numeric `status` property or "failed: <3 digits>" in the message
isTransientError(error);      // true for 429, 502, 503, 504 and network failures ("Failed to fetch")
friendlyErrorMessage(error);  // "Fibery временно недоступен. Попробуйте ещё раз через минуту." | undefined

// React Query retry policy without the kit depending on React Query: retry only transient errors,
// with 1 s, 2 s, 4 s … (max 8 s) between attempts.
useMutation({mutationFn: updateLevel, retry: transientRetry(2), retryDelay});
queryClient.setDefaultOptions({queries: {retry: transientRetry(3), retryDelay}});
```

Retry only idempotent mutations (updates, deletes). A create that failed with 503 may still have been done by the
server, and repeating it makes a duplicate.

**Remembered state**

```tsx
// useState that survives reloads: localStorage, JSON, namespaced per app (all Fibery apps share one origin).
// Read once on mount, written on change; storage errors fall back to in-memory state.
const [tab, setTab] = usePersistentState("tab", "list", (v): v is "list" | "matrix" => v === "list" || v === "matrix");
const [owner, setOwner] = usePersistentState<string | null>("filters.owner", null);  // no validate: any saved JSON
```

A saved value that fails `validate` (or is not valid JSON) is replaced by the initial one — use it to drop values
from older app versions. Ids that may have been deleted since (options, entities) still need a check against the
loaded data before they are applied, so a stale id never becomes an invisible filter.

All components accept `className`. Icons placed directly inside kit components are sized to 16px by CSS.

**Live updates**

Fibery can't push changes into a Custom App. `useLiveUpdates` says which databases changed, so the app refetches
with the viewer's own permissions. It has two optional sources, both delivered through the same batched `onChange`:

- **Relay** (`url` + `clientKey`): a relay server turns Fibery webhooks into Server-Sent Events. Instant, but webhook
  payloads carry field values, so use it only for databases whose data may leave Fibery. If the relay is down, the
  app works as without it.
- **Change detector** (`detector`): every `intervalMs` (default 15 s) the app asks Fibery for a cheap fingerprint
  of each subscribed database and reports the ones whose fingerprint changed (no ids). Works for any database,
  private ones included, and nothing leaves Fibery: the queries run in the app with the viewer's permissions.

```tsx
useLiveUpdates({
  url: "https://relay.example.com",   // optional: without url + clientKey no relay connection opens
  clientKey: "…",
  types: ["Space/Task"],
  onChange: () => queryClient.invalidateQueries({queryKey: ["tasks"]}),   // batched; also fires after a reconnect
  detector: {fingerprint: fetchFingerprint, intervalMs: 15_000},           // optional
});
```

The kit doesn't talk to Fibery itself, so the app supplies `fingerprint(type) => Promise<string>`. A good one is
entity count + latest modification date: deletions change the count, creates and edits change the date. With the
platform's `queryEntities` (from `@/lib/fibery`):

```ts
const fetchFingerprint = async (type: string) => {
  // q/select ["q/count", "fibery/id"] makes the query return a number instead of rows.
  const count = (await queryEntities({type, fields: ["q/count", "fibery/id"]})) as unknown as number;
  // q/max is rejected for queries run with user permissions, so: newest row first, one row.
  const [latest] = await queryEntities<{"fibery/modification-date": string}>({
    type,
    fields: ["fibery/modification-date"],
    orderBy: {field: "fibery/modification-date", direction: "desc"},
    limit: 1,
  });
  return `${count}|${latest?.["fibery/modification-date"] ?? ""}`;
};
```

How the detector behaves:

- The first fingerprint after mount, and after the page becomes visible again, is a baseline, not a change. It pauses
  while the page is hidden (React Query refetches on focus anyway).
- A failed fingerprint (network, HTTP 429) reports nothing for that database that round and keeps the old baseline
  (logged with `console.warn`). A round is skipped while the previous one is still running; types are probed one
  after another.
- Cost: with the fingerprint above, 2 tiny requests per database per interval, in every open app instance. Fibery
  allows 7 API requests/s for the whole workspace, shared by all of them, so keep `intervalMs` at 10 s or more.
- It doesn't catch changes that move no fingerprint, e.g. renamed select options (an option is not an entity of the
  database and has no modification date there). Announce those with `notifyChange` (below).

When the app is stuck and a refetch won't help, `ReloadAppButton` reloads the whole app page:

```tsx
<ReloadAppButton />   // icon button «Перезагрузить приложение»; usePersistentState values survive, unsaved edits don't
```

Some changes never reach webhooks (e.g. renaming a select option: the option is not an entity of the hooked
database). After such a change succeeds, the app announces it, and the relay sends it to every open app as an ordinary
change event (the relay's `POST /notify`):

```tsx
const rename = useMutation({
  mutationFn: renameOption,
  // Fire and forget: returns at once, never throws; a lost notice is only logged with console.warn.
  onSuccess: () => notifyChange({url: "https://relay.example.com", clientKey: "…", type: "Space/Task", ids: []}),
});
```

`ids` is optional (default `[]`, meaning "refetch the whole database").

## Theme rules (from Fibery's Custom Apps guide)

- Color only through theme variables or Tailwind tokens; no hard-coded hex in components.
- No `dark:` overrides or theme toggles: Fibery's sidecar owns the theme.
- User-defined colors (enum, space, entity) are data: render them as-is, don't derive shades or text colors
  from them. `EnumBadge` follows this — the color paints a dot or a ring, never a text background.
- Don't reference Fibery's internal UI variables (`--bg-button-*` and the like): they are not passed into apps.

## Develop

```sh
npm install
npm run build    # tsc -> dist/, src/styles/*.css -> dist/style.css
```

Styles live in `src/styles/`, one file per component group; `scripts/build-css.mjs` lists the concatenation
order (`base.css` first: it declares the layer order and helper tokens).

## Release

Branches:

- `master` — sources only; `dist/` is git-ignored.
- `release` — `master` merged in plus the compiled `dist/`; every release commit is tagged `vX.Y.Z`.

From a clean `master`:

```sh
npm run release -- 0.1.3
```

The script (`scripts/release.mjs`) bumps the version and commits it on `master`, builds, merges `master` into
`release` in a temporary worktree, commits `dist/`, tags `v0.1.3`, pushes `master`, `release` and the tag, and
prints the dependency line for apps. Then update the commit hash in each app's `package.json` and re-upload the
app.

`package.json` is marked `private`, so an accidental `npm publish` is refused.
