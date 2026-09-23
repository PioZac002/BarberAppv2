# Design — SZLIF

<!-- impeccable:design-system 1 -->

The world is the back bar of a barbershop. The room is glazed in Barbicide
blue at page scale; what you read sits on it as printed label stock. Light is
the shop under work light, dark is the same room after close — the same
place at a different hour, not a recoloured theme.

Direction contract, seed key and the reasoning behind these decisions live in
`.impeccable/surfaces/src-pages-home-tsx.md`. Product truth is in `PRODUCT.md`.

## Registers

Two, from one system.

- **Persuade** — public pages (`/`, `/services`, `/team`, `/reviews`,
  `/booking`, `/login`, `/register`, 404). The glaze is drenched at page
  scale; content sits on it as cream label plates.
- **Operate** — the three dashboards. The register inverts: work happens on
  label stock, and the glaze keeps the navigation rail, table heads, active
  states and primary actions. Dense type and long Polish labels get room.

## Colour

Tokens are HSL triples in `src/index.css`; Tailwind reads them through
`tailwind.config.ts`. Never hard-code a colour in a component.

### Materials

| Token | Light | Dark | Job |
|---|---|---|---|
| `--glaze` | `234 75% 45%` | `231 100% 62%` | the field; reflects by day, emits after close |
| `--tile` | `72 13% 92%` | `231 40% 11%` | the glazed wall surface |
| `--grout` | `77 10% 82%` | `231 35% 18%` | the line between tiles; also `--border` |
| `--label` | `51 33% 96%` | `231 44% 14%` | label stock; also `--card`, `--popover` |
| `--chrome` | `210 8% 71%` | `224 13% 50%` | shelf lip, cut line, metal edges, scrollbar |
| `--ink` | `225 17% 9%` | `77 15% 91%` | first ink; also `--foreground` |
| `--ink2` | `3 74% 47%` | `5 100% 64%` | second ink: stamps, alerts, the thing to do |

### Fixed roles

`--wall-ink` (`51 33% 96%` / `77 15% 94%`) and `--wall-deep`
(`234 78% 15%` / `231 60% 9%`) **do not invert with the theme**. The wall is
glazed in both hours, so type printed on it and paper hung on it keep fixed
values. Anything inside `.tile-wall` or `.plate--wall` uses `text-wall` /
`text-wall-deep`, never `text-foreground`.

### Chart inks

`--series-1..8`, redefined per theme, aliased to `--chart-1..8` for shadcn.
Read them through `src/lib/chart-ink.ts` (`SERIES`, `INK`, `seriesInk`) so a
chart drawn once is correct in both hours. The set is the glaze, the second
ink, chrome, their tints, and the two other bottles that are genuinely on a
barber's shelf: steel-cyan antiseptic and Pinaud lilac. Bars and legend
swatches are square; nothing in this world is a pill.

## Type

Two faces, and no third is ever added to solve a hierarchy problem.
Hierarchy comes from weight, width, case and rule weight.

- **Archivo** (variable, width + weight axes) — everything.
- **Spline Sans Mono** — every measured quantity: times, prices, durations,
  lot numbers, table figures, codes. `font-variant-numeric: tabular-nums` is
  set globally on `time`, `output`, `.tabular` and table cells.

| Class | Setting | Use |
|---|---|---|
| `.lockup` | width 125%, weight 900, caps, `-0.02em`, lh `0.86` + `0.1em` bottom pad | page-scale names; the padding clears Ą Ę Ż |
| `.label-caps` | width 78%, weight 800, caps, lh `1.12` | product names, headings, buttons, tabs, nav |
| `.directions` | mono, `text-micro`, caps, `0.08em` | the small print block; column heads; captions |
| `.net-line` | mono, tabular | any figure that was measured |

`.section-head` is `.label-caps` at 2xl/3xl.

## Materials in CSS

| Class | What it is |
|---|---|
| `.tile-wall` | running-bond tile grid as a real SVG pattern plus one glaze highlight; the grout is the layout grid, not a texture |
| `.plate` | label stock with a double-rule frame (1px outer, hairline `::before` inset 3px) and a real offset+blur shadow |
| `.plate--wall` | a plate hanging on the wall: keeps paper stock and `--wall-deep` ink in both hours |
| `.plate--flat` | frameless, for dense panel surfaces where the double rule fights table rules |
| `.plate .plate` | nested plates drop the double rule and the shadow — one frame per object |
| `.shelf` | 3px chrome lip with a cast shadow; objects stand on it |
| `.rule-double` | 3px rule with a hairline under it; closes a printed block |
| `.photo-frame` | fixed frame with a chrome edge for user-supplied images of any quality or ratio |
| `.jar` | the steriliser jar: chrome body, lid, one glass highlight; `.jar--wall` inverts it for the wall |
| `.brand-mark` / `.brand-lockup` | the supplied artwork as an alpha mask, inked from `currentColor` |
| `.cut` | the before/after frame: chrome cut line, grip, `--cut` position |

`<CutReveal>` leads the home page: the claim is demonstrated in the first
viewport rather than asserted. `<RoomWall>` hangs the shop's own photographs
below it as an authored arrangement of unequal frames, each with a plate
label; the barber pole sits at full weight because its red and blue are this
page's two inks. Supplied photographs vary in size — two are under 550px —
so frames are assigned to match, and nothing is upscaled.

Anything printed on `.tile-wall` takes wall ink automatically — `.directions`,
`.net-line` and `.photo-frame` are re-inked inside it, so small print and
frames never fall back to the app ground's colours on the glaze.

Corner radius is **2px** (`--radius`) everywhere. There are no pills except
radio inputs and scrollbar thumbs.

## State vocabulary

Every record state is a stamp, and **line style carries the meaning alongside
colour**, so state survives both themes and colour-blind reading without a
legend. Use `<Badge>`, which maps to these.

| Class | Border | Means |
|---|---|---|
| `.stamp--pending` | dashed | waiting |
| `.stamp--confirmed` | solid, glaze | booked |
| `.stamp--done` | double | completed |
| `.stamp--alert` | solid, second ink | standing warning, role, attention |
| `.stamp--void` | solid + strike | cancelled, revoked |
| `.stamp--absent` | dotted | a miss |

`--void` is the only struck stamp; never use it for a role or a warning.

## Motion

**One authored material: liquid rising to an exact line.** Everything that
moves is that gesture in another vessel.

- `useFilled` (`src/components/szlif/Bits.tsx`) holds a vessel at zero until
  it is in view, then lets it fill; immediate under `prefers-reduced-motion`.
- `Jar` fills vertically with a 1px meniscus; `Level` and `Progress` read the
  same fill on its side; `CutReveal` is the same gesture read horizontally
  across a before/after pair, with the chrome line as the edge.
- `.wall-reveal` fills a page name the way the jar fills, and is the only
  entrance animation in the product.
- `<CutReveal>` is the fill gesture read horizontally, and the only
  interactive image in the product. A scroll-scrubbed chair orbit shipped here
  briefly and was removed; the sprite-sheet technique it used is recorded in
  `design-assets/README.md` should it ever be wanted again.
- Easing is `out-liquid` (`cubic-bezier(.16, 1, .3, 1)`). No bounce, no
  elastic, no scattered hover effects.

Entrances live in CSS with `both` fill, never in script: the stylesheet that
hides an element is the one that reveals it, so a failed script can never
strand content at opacity zero.

## Brand

Artwork supplied by the project owner (`logo_barber.png`). The soft blue halo
it arrived with was removed by rebuilding the alpha from per-pixel whiteness —
a glow around a mark is the first thing that reads as generated. It ships as
an alpha mask so one file inks itself on any ground in either theme.

- `<Mark>` — the head alone. Nav, dashboard rail, PWA icons, image fallbacks.
- `<Lockup>` — head + wordmark + trade line + "Klasyczny styl. Nowa
  definicja." Footer, auth walls, the close of the home page.
- `<MarkWithName>` — the mark beside the name set in Archivo.

## The panel rail

The dashboard rail rides at `4.5rem` — mark and icons only — and opens to
`16rem` on hover **and on `focus-within`**, so it is reachable from the
keyboard, not only from a pointer. It is `fixed` and overlays, so the work
underneath never reflows. Labels are laid out to zero width rather than
clipped, and stay in the DOM so assistive tech reads a full menu; each control
also carries a `title` while collapsed. A pin control keeps it open and the
choice is remembered in `localStorage`. On touch the existing drawer is
unchanged — hover is never the only way in.

Never put `<Lockup>` beside a typographic "Szlif": one SZLIF lettering per
screen. The mark is an illustration, not an icon — it holds from about 32px,
which is why the favicon ships at 64 and small PWA sizes are padded.

## Content rules

- **PL/EN is first-class.** All interface copy goes through
  `LanguageContext`. Catalogue strings that live in the database (service
  names, descriptions, specialties) go through `src/lib/catalog-names.ts`,
  which falls through to the stored value for anything it does not know.
- **User-supplied images** get `<Portrait>`, which falls back to an authored
  initials plate rather than a grey hole, and rejects dead placeholder hosts.
- **Demonstration data is labelled.** `<DemoNotice>` states that the shop is
  fictional wherever seeded records would otherwise read as proof. Nothing in
  this product claims a customer, an award or a credential it does not have.
- **Every shipping raster carries provenance** — see
  `public/icons/PROVENANCE.md` and `public/media/PROVENANCE.md`.

## Known open items

Recorded rather than hidden; see the second finish verdict.

1. The Operate register does not yet reach the standard the public pages do:
   the admin overview still ships a four-cell hero-metric row, notifications
   render as nested tinted cards instead of stamps, and the hourly chart is in
   default Recharts dress and draws a flat zero line as though it were content.
2. `catalog-names.ts` is not wired into the dashboards, so barber and admin
   views still show English service names.
3. Barber appointment records carry a lot number but no filing date; the API
   does not return one, and none is invented.
4. Unrelated to design: `backend/db/01_schema.sql` lacks the `job_title`
   column that `publicTeamController` queries, so `/team` returns 500 on a
   fresh Docker deploy. Patched locally only.
