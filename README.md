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

## Language

The kit's own texts (loading and error states, «Повторить», close buttons, search and empty texts of pickers, the
access screen, the import dialog, error messages of field types, screen-reader labels…) exist in Russian and English.
**Russian is the default**, so apps that never set a language look exactly as before. An app picks the language on
the provider; every kit component under it follows:

```tsx
const [lang, setLang] = usePersistentState<KitLang>("lang", "en", (v): v is KitLang => v === "en" || v === "ru");
<FiberyUIProvider lang={lang}>…</FiberyUIProvider>     // "ru" (default) | "en"

const lang = useKitLang();                             // inside the provider, e.g. for the pure functions below
```

- An explicit text prop still wins: `<LoadingState>Loading people…</LoadingState>`, `<Combobox placeholder="Find…">`.
- Pure functions take the language as their last argument, Russian by default: `friendlyErrorMessage(error, lang)`,
  `parseCell(type, cell, lang)`, the field type factories (`textType(options, lang)`, `emailType(lang)`,
  `phoneType(lang)`, `dateType(lang)`, `optionType(options, lang)`), `planImport(input, lang)`,
  `settleImport(…, lang)`, `readXlsx(bytes, lang)`. `ImportDialog` passes the provider's language itself.
- Data (option names, field names) and the app's own texts are the app's business; the kit translates only itself.

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
<Badge shape="pill" hue="violet">Proposed</Badge>        // pill: round ends, medium weight — a state in lists and tables
<Badge shape="pill" variant="outline"><Emoji char="✉️" />Email</Badge>   // neutral outline pill: an attribute chip
<Badge shape="pill" wrap>Inbound: Referral from partner</Badge>          // wraps inside once wider than its container, never "…"
<Emoji char={fiberyEmoji(channel.icon)} />               // 12px in a 14px box; nothing where the browser can't draw it
<EnumBadge name={state["enum/name"]} color={state["enum/color"]} />            // dot + name; a long name ends with "…" at its container's width
<EnumBadge wrap name={state["enum/name"]} color={state["enum/color"]} />       // …or wraps, the dot at the first line
<EnumBadge name="A" color="#4FAF54" variant="circle" />                         // letter in a ring
<Avatar name="Jane Doe" src={url} size="sm" />
<Avatar name="Jane Doe" size="sm" hue={hueFor(user.id)} />                      // initials on a stable person hue
```

**Fibery option colors** — the owner's option colors and emoji, drawn with the theme's hues (see Theme rules):

```tsx
fiberyHue("#FBA32F");        // "yellow" — Fibery's 17 standard colors by a fixed table, other hex → nearest; null → null
fiberyEmoji(":rocket:");     // "🚀" — enum/icon shortcode → emoji; unknown → null (never the code as text)
hueFor(user.id);             // "blue" | "turquoise" | "aquamarine" | "purple" | "pink", stable per id (avatars)
emojiRenders("✉️");          // false where the browser draws an empty box: drawn on a canvas, compared with a missing
                             // glyph; cached per character; true without a DOM. Emoji and OptionBadge use it.

// Read options from the enum type itself (all options, also unused ones), cache, refetch on window focus:
// {"q/from": "<field's typeObject.name>", "q/select": {"id": "fibery/id", "name": "enum/name",
//  "color": "enum/color", "icon": "enum/icon"}, "q/order-by": [[["fibery/rank"], "q/asc"]]}
<OptionBadge name={o.name} color={o.color} icon={o.icon} />                    // soft: the record's own state
<OptionBadge variant="outline" name="Lost" color="#D40915" />                  // outline: the record dropped out
<OptionBadge variant="dot" name="Inbound: Website Form" color="#FBA32F" />     // dot + text: an attribute
<OptionBadge shape="pill" name="Potential Client" color="#199EE3" />           // pill; its name wraps by default (wrap={false} to cut)
<OptionBadge variant="dot" wrap name="High (60-80%)" color="#4FAF54" />        // dot + text that wraps instead of "…"
<OptionBadge name="Qualified" color={null} fallbackHue="aqua"                   // the app's own code while Fibery has none
  glyph={<StageGlyph type="started" step={3} steps={6} />} />

<Dot hue="green" />  <Dot variant="ring" size="md" />                          // 8px mark; hollow ring for "planned"
<StageGlyph type="started" step={2} steps={6} />                               // 12px ring: notStarted | started (sector) | finished | paused | failed
<Badge hue="violet"><StageGlyph type="started" step={4} steps={6} />Proposed</Badge>   // currentColor; muted in a neutral badge
```

```tsx
<Card interactive onClick={…}>
  <CardHeader title="Skills" description="4 linked" actions={<IconButton … />} />
  <CardContent>…</CardContent>
</Card>
// Flat sheet for a grey page (bg-muted): the 1px ring without the shadow; interactive → hover tints, ring stays.
<Card variant="flat">
  <CardHeader title="Due now" count={12} />           // count: muted monospace digits after the title
  …
</Card>

<List>                                                  // Fibery relation rows
  <ListItem leading={<EnumBadge … />} trailing="B" onClick={() => openEntity(…)}>3D › Handpaint</ListItem>
  <ListItem multiline>…nested content that wraps…</ListItem>
</List>

// Worklist: rows edge to edge with hairlines (13px text), an actions column of 28px slots. The first action is the
// main verb and always shows; the rest appear on hover, focus inside, selection and touch screens, keeping their place.
// Clicks and keys in the actions never reach the row; `busy` puts a spinner in the first slot and disables the rest.
<List variant="divided" className="@container">
  <ListItem multiline onClick={open} selected={isOpen} busy={saving} actionSlots={4} actions={[
    <RowAction icon={<Check />} label="Done" onClick={done} />,
    <RowAction icon={<Redo2 />} label="Reschedule" onClick={reschedule} />,
    <DropdownMenu><DropdownMenuTrigger asChild><RowAction icon={<MoreHorizontal />} label="More" /></DropdownMenuTrigger>…</DropdownMenu>,
  ]}>…</ListItem>
  <Separator as="li" tone="alert" label="now 11:42" />  // red "now" line between rows (see nowLineIndex)
</List>
// A multi-line card row with its verbs at the right of the last line (not a column along the whole row):
// ListItemActions shows and hides the same way (also while a menu of it is open).
<ListItem multiline onClick={open}>
  …first lines…
  <span className="flex items-end gap-2"><span className="flex-1">…meta…</span>
    <ListItemActions busy={saving} actions={[<RowAction … />, <RowAction … />]} /></span>
</ListItem>
<ShowMore shown={15} total={37} onShowAll={() => setAll(true)} />   // «Показано 15 из 37» + «Показать все»

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

// Working table on a grey page: flat ring, header on --muted that sticks under the app's 48px bar, rows aligned to
// their first line, 10px rows and 16px outer edges. A sticky header means no sideways scroll: fit the columns.
// `responsive`: the table answers to its own width — below 720px `data-narrow-hide` cells drop out and
// `data-narrow-only` wrappers show (gather the hidden values under the row's anchor); other widths: container-query
// classes on cells. SortHeader renders the <th> with aria-sort and a button across the cell; the arrow shows only on
// the active column (its place is kept on the others).
<Table flat header="tinted" stickyHeader={48} valign="top" density="comfortable" responsive>
  <thead><tr>
    <SortHeader active={sort.key === "name"} dir={sort.dir} onSort={() => sortBy("name")}>Company</SortHeader>
    <SortHeader active={sort.key === "stage"} dir={sort.dir} onSort={() => sortBy("stage")} data-narrow-hide="">Stage</SortHeader>
    <SortHeader active={sort.key === "last"} dir={sort.dir} onSort={() => sortBy("last")} className="w-[12ch]">Last touch</SortHeader>
  </tr></thead>
  <tbody>
    <tr>
      <td>Acme Games<div data-narrow-only=""><Badge shape="pill" hue="violet">Proposed</Badge></div></td>
      <td data-narrow-hide=""><Badge shape="pill" hue="violet">Proposed</Badge></td>
      <td className="font-mono">{formatShortDay("2026-11-20")}</td>
    </tr>
  </tbody>
</Table>

// Rename in place: pencil on hover (also of the table row), Enter / blur saves, Escape cancels.
<InlineEdit value={group.name} label="Rename group" hint="Renames it in 12 skills" onSave={(name) => rename(name)}>
  <Highlight text={group.name} query={tokens} />
</InlineEdit>
// More fields in place; a rejected onSave keeps the error under the value. `disabled` = read-only text,
// `startEditing` opens the editor at once (after PropertyAdd), `placeholder` replaces the muted "—" (all editors).
// InlineEdit: an emptied field cancels (a name must stay); `clearable` saves "" instead.
<InlineEdit clearable label="Edit Source Ref" value={ref} onSave={saveRef} startEditing={revealed.has("ref")} />
<InlineSelect label="Win probability" value={winId} onSave={saveWin} clearable
  options={wins.map((o) => ({value: o.id, label: <OptionBadge variant="dot" name={o.name} color={o.color} />}))} />
<InlineDate label="Expected close" value="2026-12-15" onSave={saveClose} />          // "YYYY-MM-DD" | null; opens a
                                                     // DateInput with its calendar shown, a picked day saves at once
<InlineTextarea label="Key note" value={note} onSave={saveNote} />                   // Ctrl+Enter / blur saves

// Card fields: only the filled ones, «+ Поле» adds an empty one.
<PropertyGroup icon={<Briefcase />} title="Deal" actions={<PropertyAdd fields={emptyFields} onAdd={reveal} />}>
  <PropertyList hideEmpty>
    <Property label="Expected close" empty={!deal.close && !revealed.has("close")}>
      <InlineDate label="Expected close" value={deal.close} onSave={…} startEditing={revealed.has("close")} />
    </Property>
  </PropertyList>
</PropertyGroup>

// History: spine with markers, 80px time column, title (+ second line), meta on the right, the red "now" line,
// «Ещё N» after `limit` (10) rows. Markers: Dot or a 12px Lucide icon in a circle of the card color. `start` adds
// the row where the record began (a filled dot ends the spine), so a latest-first history has a clear top and bottom.
<Timeline
  nowIndex={nowLineIndex(items.map((i) => i.at), Date.now(), "desc")}
  nowLabel="now 11:42"
  start={{time: "16 Jun", label: "Opened"}}
  empty={<span>No activities yet</span>}
  items={items.map((i) => ({id: i.id, marker: <ArrowDownLeft className="text-green" />, time: "20 Nov",
    title: "Sent the estimate", meta: "✉️ Email · Jane Doe", struck: i.cancelled, onClick: () => edit(i)}))}
/>

// A quiet control that shows only with its row (Timeline item, ListItem, table row, board card): on hover, focus
// inside, a selected row, while its menu is open; always on touch screens. Hidden, it keeps its place.
<DropdownMenuTrigger asChild><button className="fui-reveal-on-hover" aria-label="Status">…<ChevronDown /></button></DropdownMenuTrigger>

// Copy icon (20px) after a value: shows on hover of its parent or table row; copies, then a short toast.
// Clicks and keys don't reach a clickable row around it. Needs FiberyUIProvider (toasts).
<span className="flex items-center gap-1"><span className="truncate">{email}</span><CopyButton value={email} message="Email скопирован" /></span>

// Heatmap cell: background strength by value within the table's [min, max]; 0 renders as a muted dash.
<HeatValue value={count} min={tableMin} max={tableMax} />            // hue="blue" by default
```

**Charts** — counts for stats pages. Every number is printed (no hover needed); a clickable number has a dotted
underline and turns to the accent on hover; zero values are a muted dash and never clickable.

```tsx
// Rows "label, bar, value[, share]". Fixed label column (--fui-bar-label, 13rem), so bars stay put when rows change.
<BarList total={40} max={40} items={[
  {key: "a", label: "Full-Time", value: 24, onClick: () => openList("a")},
  {key: "x", label: "Neverland", value: 12, placeholder: "заглушка"},   // hatched bar: a stand-in, not real data
  {key: "none", label: "не указан", value: 4, muted: true},
]} />
<BarList hue="red" items={…} />                          // neutral by default

// Parts of one whole: a 10px bar and a legend "swatch, label, value, share" (legend entries are the buttons).
<StackedBar segments={[
  {key: "err", label: "С ошибками", value: 8, hue: "red", onClick: …},
  {key: "ok", label: "Без проблем", value: 30, hue: "green"},
]} />

// Per-period flow: ins above the axis, outs below, numbers on every bar; `level` draws a line with its values.
<FlowChart upLabel="Пришли" downLabel="Ушли" levelLabel="В работе на конец месяца" periods={months.map((m) => ({
  key: m.id, label: "янв", name: "январь 2026", up: m.in, down: m.out, level: m.headcount, onUpClick: () => open(m),
}))} />
// Long ranges: the level's value only where it changes (and first / last); start scrolled to the latest periods.
<FlowChart levelValues="changes" scrollToEnd … />

// Metric card (a flat sheet): the number in 24px monospace, the label, a required definition line, and the previous
// period pinned to the bottom — «было 11 · ↑ +7» / "was 11 · ↑ +7", never colored (growth isn't always good).
// compare={null} keeps the line's room empty ("all time"), so cards don't change height with the period.
<MetricCard value={41} label="Deals in progress" definition="Open deals past the first contact" compare={{prev: 34, delta: 7}} />
<MetricCard value={12} label="Due today" definition="Today and overdue up to 30 days" onClick={openToday} />  // whole card is a button
<MetricCard value={0} label="…" definition="…" loading compare={null} />   // grey block in place of the number
<MetricCard value={7} label="On hold" definition="Paused with a return date" definitionAs="hint" />  // "?" after the label, definition on hover
formatDelta(-6);                                        // "−6" (true minus); "+7"; 0 → "0"
```

```tsx
<PropertyList>                                          // entity field grid
  <Property icon={<Mail />} label="Email">a@b.c</Property>
</PropertyList>

// Titled block of a details card: bold title with an icon, a hairline above every group but the first,
// 32px rows 4px apart with smaller muted labels and heavier values. Children: a PropertyList, form fields, anything.
// A badge as a property's value (option pill, chip) takes the value's 14px, so one column has one text size.
<PropertyGroup icon={<Briefcase />} title="Работа" actions={<IconButton … />}>
  <PropertyList>…</PropertyList>
</PropertyGroup>
// Collapsible: chevron at the right, the whole header toggles; controlled (open/onOpenChange) or defaultOpen.
<PropertyGroup collapsible open={open} onOpenChange={setOpen} icon={<ShieldAlert />} title="Checks">…</PropertyGroup>
```

**Layout**

```tsx
// Content column: centered up to 1440px, 24px sides (16px below 720px); a size container, so container-query
// classes inside answer to the column's width. The page background goes on the element around it.
<div className="min-h-screen bg-muted"><Page>…</Page></div>
<Page width="wide">…</Page>                              // full width, still padded

// Kanban board: columns 248px (--fui-board-column), as tall as the tallest; scrolls sideways inside itself.
// Native HTML5 drag and drop, no dependencies: a drop only calls onMove — the app moves the card (and puts it back
// if Fibery refuses). canDrag keeps a card in place; `collapsed` starts a column as a 56px strip (click or a card
// dragged over opens it, a button folds it back); after `limit` (50) cards «Ещё N», or onMore for a list view.
// Give keyboard users the same move in the card's menu.
<Board
  aria-label="Deals"
  columns={stages.map((s) => ({id: s.id, title: s.name, cards: s.deals, aside: s.hours && `Σ ${s.hours} h`,
    note: s.noStep > 0 && <Button variant="ghost" size="sm" onClick={() => onlyNoStep(s.id)}>no step {s.noStep}</Button>,
    collapsed: s.id === "draft",
    open: s.id === "draft" ? draftOpen : undefined, onOpenChange: setDraftOpen}))}   // optional: the app keeps the fold state
  cardId={(deal) => deal.id}
  renderCard={(deal) => <Card variant="flat" interactive onClick={() => open(deal)}>…</Card>}
  canDrag={(id) => canEdit(id)}
  onMove={(id, from, to) => moveDeal(id, to)}
  onMore={(columnId) => showList(columnId)} moreLabel={(n) => `${n} more in the list`}
/>

<PageHeader eyebrow={<Badge caps>Contractor</Badge>} title="Jane Doe" actions={…} />
<SectionHeader icon={<Layers />} title="Skills" count={4} actions={…} />
// Worklist section: 600-weight title, icon on a 20px plate of its hue, collapse chevron (controlled), anchor id.
<SectionHeader tone="strong" icon={<CalendarClock />} iconHue={overdue ? "red" : "grey"} title="Due" count={49}
  collapsible open={open} onOpenChange={setOpen} id="due" aria-controls="due-list" />

// Sticky anchors over a screen of several lists: icon (in the hue while the count is above 0), short name, count.
// Click → onSelect (open the section), then a scroll to the element with that id and a short flash.
// Below 700px of width only icons and counts stay (name in title / aria-label).
<CountNav onSelect={(id) => setOpen(id, true)} items={[
  {id: "due", label: "Due", icon: <CalendarClock />, count: 49, hue: "red"},
  {id: "replied", label: "Replied", icon: <MessageSquareReply />, count: 3, hue: "green"},
]} />
<CountNav surface="muted" className="top-12" … />          // on a grey desk, sticking under a 48px app header
<Separator />
<Separator label="На английском" />                       // captioned divider splitting one block into parts
<Inset><Field label="Email (ID)" hint="Links the record to …">…</Field></Inset>  // raised block (shadow) for a key field
<Inset footer={<>Profile <Badge hue="green">Linked</Badge></>}>…</Inset>  // marks under a hairline at the bottom

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
<Field label="Stage" hint={hintOf(stage)}>   // what the picked option means, under the field
  <Select value={stage} onValueChange={setStage}>
    <SelectTrigger><SelectValue placeholder="Stage" /></SelectTrigger>
    <SelectContent>
      // `description`: a muted second line in the list only; the trigger shows the option alone.
      <SelectItem value="draft" description="Not sent to the client yet">Draft</SelectItem>
    </SelectContent>
  </Select>
</Field>
// Edit form with an explicit Save: `changed` draws an accent bar in the left gutter (leave >= 8px there), `warning` is a non-blocking
// note in the warning color (error > warning > hint, one line shows).
<Field label="Phone" htmlFor="phone" changed={phone !== saved.phone} warning="Same number as Jane Doe">
  <Input id="phone" />
</Field>
<Field label="Email" htmlFor="email" required>   // red asterisk after the label
  <Input id="email" />
</Field>
// Label in a 112px column on the left while the field is >= 400px wide (a form in a 520px dialog); narrower, on top.
<Field layout="side" label="Channel" hint="…"><ChipGroup … /></Field>
// Separate 24px chips that wrap, one value, the picked one in the accent. `visible` moves the rest into «ещё ▾»;
// `deselectable` lets a click on the picked chip clear an optional value. Arrow keys move the choice.
<ChipGroup aria-label="Channel" deselectable visible={5} value={channel} onValueChange={setChannel}
  options={channels.map((c) => ({value: c.id, label: c.name, glyph: <span className="fui-emoji">{fiberyEmoji(c.icon)}</span>}))} />

// Date and time fields instead of <input type="date"> / <input type="time">: same values ("YYYY-MM-DD", "HH:MM",
// "" when empty), but onChange gets the value itself and fires once the field is left with it (a pick, Enter, leaving
// typed text) — not on every keystroke. Typed: «24.11.2026», 24/11/26, 2411, 2026-11-24; «15:30», 1530, 9.
// A click or ↓ opens the calendar (weeks from Monday; the caption drills up to months and years) or the time list.
// Text that isn't a date / time is dropped on leaving and the old value stays. Width: 100%, set it with className.
<Field label="Expected close" htmlFor="close">
  <DateInput id="close" className="w-48" value={close} onChange={setClose} />
</Field>
<DateInput required min="2026-01-01" max="2026-12-31" … />   // required: no «Очистить», emptying gives the value back
<DateInput weekday={false} … />                     // no «вт» after the date: birth dates, range filters
<TimeInput size="sm" aria-label="Time" value={time} onChange={setTime} step={30} />   // list every 30 min (15 by default)

// The one date format of lists and tables: dd.mm.yy, the same in both languages. A calendar day string stays that
// day; instants and Dates are shown in local time; empty or unreadable → "".
formatShortDay("2026-11-24");                            // "24.11.26"
formatShortDay(date, {weekday: true, lang: "en"});       // "Tue 24.11.26"
formatShortDayTime(date);                                // "24.11.26 14:30"

// Planning date: quick terms (the app computes their dates), «Дата…» opens a DateInput + TimeInput, and the resolved
// date under the chips («вт 24 ноября, 10:00» / "Tue 24 November, 10:00") — a click on it adjusts the time.
// A value keeps its chip while it stays on that chip's day.
<Field label="When" required>
  <QuickDate value={due} onChange={setDue} terms={[
    {id: "tomorrow", label: "Tomorrow", date: tomorrowAt10},
    {id: "week", label: "+1 week", date: inAWeekAt10},
  ]} />
</Field>
<QuickDate withTime={false} … />
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
    {/* A muted line under the label; the row grows to fit it. */}
    <DropdownMenuItem icon={<Archive />} description="Hidden from lists, kept in Fibery">Archive</DropdownMenuItem>
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

// `leading`: an Avatar, a Dot or an emoji before the option's text (not searched).
<Combobox options={users.map((u) => ({value: u.id, text: u.name, leading: <Avatar name={u.name} size="sm" />}))} onSelect={setOwner}>…</Combobox>

// As a form field: PickerButton shows the value; onCreate adds a "Создать «…»" row for text that matches nothing.
<Field label="Group">
  <Combobox options={groups} onSelect={setGroup} onCreate={createGroup}>
    <PickerButton placeholder="Choose…">{groupName}</PickerButton>
  </Combobox>
</Field>

// Search field with suggestions under it while typing; pick one to apply an exact filter.
<Autocomplete size="sm" value={query} onValueChange={setQuery} options={skillOptions}
  onSelect={(id) => { setSkill(id); setQuery(""); }} />
// suggestOnFocus: all options show as soon as the empty field is focused or clicked; Enter picks only a chosen row.
<Autocomplete suggestOnFocus size="sm" value={query} onValueChange={setQuery} options={skillOptions} onSelect={pick} />
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

// Ask before an action: Cancel (focused first; «Отмена» / "Cancel" by default) and a button named by the action.
// It never closes itself on confirm: close it in onConfirm, or after the action while `busy` shows a spinner and
// keeps it open.
<ConfirmDialog
  open={open}
  onOpenChange={setOpen}
  title="Delete Jane Doe?"
  description="Her 3 activities are deleted too."
  confirmLabel="Delete"
  destructive
  busy={deleting}
  onConfirm={() => remove().then(() => setOpen(false))}
/>
```

**Tabs**

```tsx
<Tabs defaultValue="list">
  <TabsList>                                            // segmented (default) | line
    <TabsTrigger value="list">List</TabsTrigger>
    <TabsTrigger value="matrix">Matrix</TabsTrigger>
  </TabsList>
  // `count`: round counter with room for "999"; 0 keeps its place invisibly; tone="alert" puts it on red.
  <TabsTrigger value="today" count={49} tone="alert" title="Today: 49, 37 of them overdue">Today</TabsTrigger>
  // zero="hide": no empty place at 0, for a counter that stays at 0 for long (the tabs shift when it appears).
  <TabsTrigger value="today" count={count} zero="hide">Today</TabsTrigger>
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
<SegmentedControl scale aria-label="Level" value={level} onValueChange={setLevel}
  options={["D", "C", "B", "A"].map((l) => ({value: l, label: l}))} />

// `scale="from"`: the selection and everything after it are filled — a threshold filter ("D and up" fills all four).
<SegmentedControl scale="from" aria-label="Minimum level" value={min} onValueChange={setMin} options={…} />

// `label`: muted caption inside an input-styled frame, like MultiSelect's "Status: All" — use it in a filter row
// next to MultiSelects so all filters share one look and height (28px).
<SegmentedControl label="Level" scale="from" aria-label="Minimum level" value={min} onValueChange={setMin} options={…} />

// `glyph`: a mark before an option's label — a Dot in the option's Fibery hue, an emoji, an arrow.
<SegmentedControl aria-label="Status" value={status} onValueChange={setStatus}
  options={states.map((s) => ({value: s.id, label: s.name, glyph: <Dot hue={fiberyHue(s.color) ?? "grey"} />}))} />

// Same look, but every option toggles on and off by itself (filled while on); value is an array. Any combination,
// including none, is allowed — the caller decides what "all off" means.
<SegmentedToggles label="Level" aria-label="Levels" value={levels} onValueChange={setLevels} options={…} />
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
<Callout>Empty groups are removed automatically.</Callout>   // always-visible note: info | warning | error | neutral | plain (no fill)
<Callout tone="error">Move the opportunities first or delete them together.</Callout>   // blocks the action, no field to point at
<Skeleton style={{height: 20, width: 160}} />
// Placeholder rows shaped like the real ones (same height, so nothing jumps); static under reduced motion.
<SkeletonRows rows={5} height={48} lead={40} lines={[[120, 180], [240]]} trail={[80, 96]} />
<Spinner size="sm" />

// Notice in the bottom-right corner with a time bar; closes by itself (hover pauses it). Needs FiberyUIProvider.
const toast = useToast();
toast({message: "Skill removed: Jane Doe", actionLabel: "Undo", onAction: restore, duration: 6000});
toast({message: "Moved to Proposed", actionLabel: "Undo", onAction: undo,
  moreActions: [{label: "Schedule", onAction: schedule}]});   // more buttons; each closes the toast
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
friendlyErrorMessage(error, "en");  // "Fibery is temporarily unavailable. Try again in a minute."

// React Query retry policy without the kit depending on React Query: retry only transient errors,
// with 1 s, 2 s, 4 s … (max 8 s) between attempts.
useMutation({mutationFn: updateLevel, retry: transientRetry(2), retryDelay});
queryClient.setDefaultOptions({queries: {retry: transientRetry(3), retryDelay}});
```

Retry only idempotent mutations (updates, deletes). A create that failed with 503 may still have been done by the
server, and repeating it makes a duplicate.

**Selection bar**

```tsx
// Bulk actions on selected rows: sticks to the bottom of the scrolling list. «Выбрано: 3» / "3 selected", the
// actions, «Снять выбор» / "Clear". Fixed-width count and progress with tabular digits, so nothing shifts.
// While it is open, toasts stand above it (its measured height, also when it wraps to two lines).
{selected.size > 0 && (
  <SelectionBar
    count={selected.size}
    onClear={() => setSelected(new Set())}
    actions={<Button variant="outline" size="sm" onClick={openOwnerDialog}>Change owner</Button>}
    progress={running ? {done, total} : undefined}   // «Записано 40 из 131» / "Saving 40 of 131" + a bar instead of the actions
    busy={dialogOpen}                                // disables the actions and Clear
  />
)}
```

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

**Wrapped toolbar item**

```tsx
// True while the item sits on a line below the row's first item (CSS can't select a wrapped flex item).
// The item must be a direct child of the flex-wrap row; re-measured whenever the row resizes.
const [countRef, countWrapped] = useWrapped<HTMLSpanElement>();
<div className="flex flex-wrap items-center gap-3">
  <Filters />
  <span ref={countRef} className={countWrapped ? "text-left" : "ml-auto text-right"}>Найдено 3 из 40</span>
</div>
```

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

**Access**

```tsx
// Root of routes.tsx: the app renders only for viewers who can read every listed database; others get «Недостаточно доступа» with the number of missing databases.
<AccessGate databases={["Space/Private", "Space/Public"]}>        // or {database, field} to name the field to check by
  <Outlet />
</AccessGate>

const {canEdit, markReadOnly} = useAccess();   // hide editing tools when !canEdit
onError: (e) => isPermissionError(e) && markReadOnly(),   // a refused save switches editing off until reload

// Rights per record (e.g. "edit own records"): a refusal on one record must not lock the rest of the app.
const {canEdit, isRecordReadOnly, markRecordReadOnly} = useAccess();
const editable = (record) => canEdit && record.ownerId === me.id && !isRecordReadOnly(record.id);
onError: (e) => isPermissionError(e) && markRecordReadOnly(record.id),   // only this record turns read-only until reload
```

Which one to call on a refused write: `markReadOnly` when rights are the same for every record of the app's data
(a refusal means the viewer can't edit here at all); `markRecordReadOnly` when rights differ
per record (owners, "edit own"), so one refusal says nothing about the others. Both last until the app reloads, and
`canEdit` stays false for observers and guests either way.

Fibery returns the records of a database the viewer can't access, with only the secured fields emptied (relations,
selects and lookups are never secured). So the gate reads a secured field (a required own one, else the title) and
counts the database as readable when any record has it filled, or when the database is empty. `canEdit` is false for
observers and guests; for members Fibery has no answer in advance, so a refused save is the signal.

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

**Field types, XLSX import and export**

Each field an app imports, exports or checks in a form gets a type: what its values look like, how a value goes into
a spreadsheet cell and back, and which rule a wrong value breaks. Nothing is guessed: a cell that doesn't fit is an
error.

```ts
const building = textType({pattern: /^[\p{L}\d/-]+$/u, rule: "Только буквы, цифры, / и -"});
building.check("12 корп. 3");                        // "Только буквы, цифры, / и -" — the form's format check
parseCell(building, {kind: "text", value: "12/3"});  // {value: "12/3"}
parseCell(building, {kind: "number", value: 12});    // {error: "В ячейке число, а нужен текст: …"}
// Also: emailType(), phoneType() (7–15 digits with the country code, nothing else: a leading "+" turns into a
// formula in Google Sheets), dateType() ("YYYY-MM-DD" / "DD.MM.YYYY" / a date cell),
// optionType(options) (stored as id, written and read by name, never created).
```

- A number, boolean or date cell in a text field is an error (a number may have lost leading zeros or a "+"), so are
  formulas and spreadsheet error values in any field.
- Files are XLSX only. `downloadXlsx` / `writeXlsx` write one sheet with every cell and column text-formatted, so
  Google Sheets and Excel keep `050000`, `+7999…`, `12/3` as typed, also in rows people add; the header row is bold
  and frozen. `readXlsx` returns the first sheet's cells with their kind. No dependencies: zip via the platform's
  CompressionStream / DecompressionStream, XML parsed in the kit.

```tsx
// Export: the header row alone is a valid file, so an empty database still gives an import template.
await downloadXlsx("tasks-2026-11-07.xlsx", "Tasks", [columns.map((c) => c.header), ...rows.map(toCells)]);

// Import: the app describes its columns, the key and the row → patch → command steps.
const spec: ImportSpec<Task, Context, Patch> = {
  columns: [{id: "Space/Email", header: "Email", aliases: ["Space/Email"]}, …],
  keys: [{column: "Space/Email", label: "Email", of: (t) => t.email}],   // at least one; several → the user picks one
  load: async () => ({existing: await fetchTasks(), context: {options: await fetchOptions()}}),   // fresh, not cached
  idOf: (t) => t.id,
  prepare: (rows, ctx) => rows.map(({source, existing}) => ({patch: …, issues: […], changes: […]})),   // parseCell(type, source.cells[id])
  toCommand: ({action, id, patch}) => action === "create"
    ? {command: "fibery.entity/create", args: {type: "Space/Task", entity: patch}}
    : {command: "fibery.entity/update", args: {type: "Space/Task", entity: {"fibery/id": id, ...patch}}},
  afterWrite: async (outcome) => [],   // optional: linked records; outcome rows carry their source cells
};
<ImportDialog open={open} onOpenChange={setOpen} spec={spec} onBusyChange={setBusy} onFinished={refetch} />
```

- Up to 5 MB / 5000 rows. The dialog shows what will happen (create / update / unchanged / errors, the changed
  fields of each update, every problem by row and column) before writing. A row with an error is not written;
  warnings don't stop it. Empty, repeated or ambiguous keys are errors.
- If loading the existing records fails, the dialog says it is Fibery, not the file, and offers «Повторить».
- Writes: `runCommands` sends 25 commands per request, one request at a time, at most 2 per second; 429 waits (at
  most 10 s) and repeats, a 400 for a whole chunk is split to find the bad command. Unanswered updates are repeated,
  unanswered creates never; what stays unanswered is reported as unknown. After the writes the dialog reloads the
  data (`settleImport`): «Создано» counts only records that are there. Importing the same file again settles the
  unknown rows by key without duplicates.
- `fetchAllPages((offset, limit) => query…)` reads a query page by page (Fibery returns at most 3001 rows per
  request); order the query by `fibery/id`.

## Theme rules (from Fibery's Custom Apps guide)

- Color only through theme variables or Tailwind tokens; no hard-coded hex in components.
- No `dark:` overrides or theme toggles: Fibery's sidecar owns the theme.
- A user-defined color (enum, space, entity) is drawn one of two ways, and neither derives a shade from it:
  - **as is**, only as a dot or a ring — `EnumBadge`: the hex paints the mark, never a text background;
  - **as a theme hue** — `fiberyHue` maps the hex to one of the 12 highlight hues by a fixed table of Fibery's
    standard palette (any other hex takes the nearest entry's hue: a choice of token, not a new color), and
    `OptionBadge`, `Dot`, `Badge` paint with that hue's `--highlight-<hue>-*` pair, so light and dark themes keep
    working. `null` stays neutral.
- Colors carry meaning in shape too: a fill for the record's own state, an outline for one that dropped out, a dot for
  an attribute. The accent (`--primary`) marks interaction only — buttons, focus, selection, picked chips — never a
  code.
- Hue classes and data attributes are full literals (`data-hue="green"`, `highlight-green`); never build them from
  fragments.
- Don't reference Fibery's internal UI variables (`--bg-button-*` and the like): they are not passed into apps.

## Develop

```sh
npm install
npm run build    # tsc -> dist/, src/styles/*.css -> dist/style.css
npm test         # node --test on test/*.test.ts (field types, XLSX, import planning, runCommands, languages, colors, emoji, dates, metrics); no extra dependencies
```

Pure modules import each other as `./x.ts` (`rewriteRelativeImportExtensions` turns that into `.js` on build), so Node
runs them in tests without a build. `test/fixtures/sheets-sample.xlsx`, a file saved from Google Sheets with made-up
data, checks reading real Sheets output; the test is skipped while the file is missing.

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
