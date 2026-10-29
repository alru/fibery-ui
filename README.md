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

In `src/main.tsx`:

```tsx
import "@alru/fibery-ui/style.css";
import {FiberyUIProvider} from "@alru/fibery-ui";

// Optional: gives every Lucide icon in the app Fibery's 16px / 1.75 stroke proportions.
<FiberyUIProvider><App /></FiberyUIProvider>
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
<EnumBadge name={state["enum/name"]} color={state["enum/color"]} />            // dot + name
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
    <TableGroupRow label="Characters" colSpan={2} level={2} />       // subgroup
    <tr><td data-indent="2">Handpaint</td><td data-align="right">2</td></tr>
  </tbody>
</Table>

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
<div className="flex items-start gap-4">
  <List className="flex-1">…</List>
  {item && (
    <SidePanel className="sticky top-6 flex-1" title={item.name} onClose={close}
      actions={<Button variant="outline" size="sm" icon={<ExternalLink />}>Open in Fibery</Button>}>
      <PropertyList>…</PropertyList>
    </SidePanel>
  )}
</div>
```

**Forms**

```tsx
<Field label="Name" htmlFor="name" hint="As in the contract" error={err}>
  <Input id="name" invalid={!!err} />
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

// Search field with suggestions under it while typing; pick one to apply an exact filter.
<Autocomplete size="sm" value={query} onValueChange={setQuery} options={skillOptions}
  onSelect={(id) => { setSkill(id); setQuery(""); }} />
<Badge onRemove={() => setSkill(null)}>3D › Handpaint</Badge>          // removable filter chip

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
{error && <ErrorState error={error} action={<Button size="sm" onClick={refetch}>Retry</Button>} />}
<EmptyState title="No contractors" description="…" action={…} />
<Skeleton style={{height: 20, width: 160}} />
<Spinner size="sm" />
```

All components accept `className`. Icons placed directly inside kit components are sized to 16px by CSS.

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
