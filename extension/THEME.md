# MailCraft theme: "Minecraft" pixel style

Every screen in the side panel uses one shared, block-style theme. This page
explains how it's built and how to extend it without breaking the look.

**TL;DR:** use the React components (`Button`, `Card`, `TextInput`,
`ProgressBar`) or the `.mc-*` classes. Use Tailwind only for layout
(`flex`, `gap-*`, `grid`, `text-right`...). Don't write new hex colors in
components. Add them as tokens first.

---

## 1. Where things live

```
graphics/                         (repo root, shared art)
  minecraft_font.ttf              the pixel font
  *.png                           block / mob images (import as @graphics/...)

extension/src/assets/
  tailwind.css                    entry: imports Tailwind, then the theme files
  theme/
    tokens.css                    colors, font, sizes, animations (@theme)
    base.css                      raw element styles (body, headings, focus ring)
    components.css                .mc-* component classes
    textures/                     16x16 pixel tiles: dirt, planks, grass-cap

extension/src/components/         React wrappers around the .mc-* classes
```

`@graphics` is an alias defined in `wxt.config.ts`. It points at the
repo-level `graphics/` folder, so both TS (`import x from '@graphics/5-grass.png'`)
and CSS (`url('@graphics/...')`) can reach it.

---

## 2. Design rules

These five rules make it feel like a game.

1. **No rounded corners. No soft shadows, gradients-as-decoration or blur.**
   Everything is square, hard-edged and flat-shaded.
2. **One game pixel = 4 screen px** (`--px`). Borders, bevels, padding, drop
   shadows and press offsets are whole multiples of it.
3. **The bevel.** Raised things have a light edge top-left, a dark edge
   bottom-right, and a dark 1-game-pixel outline with notched (missing)
   corners. Sunken things (inputs, slots, bars) flip the light and dark edges.
4. **Hard text shadow.** Labels and headings get a solid 2px drop shadow
   (`--mc-text-shadow`), like in-game text.
5. **Stepped motion.** Animations use `steps()`, not smooth easing. Respect
   `prefers-reduced-motion` (base.css already turns animations off).

Font sizes: the Minecraft font is drawn on an 8px grid, so it's crispest at
8 / 16 / 24 / 32px. Use the `--text-pixel-*` tokens (12px is allowed for small
labels).

---

## 3. Color tokens

### Palette (source: schemecolor.com "Minecraft Game")

| Token | Hex | Role |
|---|---|---|
| `grassfield` | `#477A1E` | dark grass: primary button face, drips, shadow on bright green |
| `matcha` | `#70B237` | grass: highlight edge on green buttons, success, XP fill |
| `young-green` | `#8FCA5C` | light grass: highlight edge, focus ring, links, level number |
| `solid-brown` | `#61371F` | dark dirt/wood: shadow edge on brown things, input borders |
| `burma-teak` | `#854F2B` | dirt/planks: secondary button face |
| `milk-tea` | `#C28340` | light wood: highlight on brown, muted text, labels |

### Derived (added for contrast; not in the source palette)

| Token | Hex | Role |
|---|---|---|
| `bedrock` | `#170D06` | outlines, input wells, text shadow |
| `soil` | `#2B180C` | default panel background |
| `soil-raised` | `#3A2212` | panel highlight edge, dividers |
| `parchment` | `#F4E7CF` | body text |
| `moss` | `#2E5013` | shadow edge on grass buttons |
| `redstone` | `#B02E22` | errors, destructive buttons |
| `redstone-light` | `#FF8F80` | error text on dark backgrounds |

### Semantic roles (use these in new components)

`surface`, `surface-raised`, `outline`, `text`, `text-muted`, `accent`,
`success`, `warning`, `danger`. These point at palette tokens. To re-skin
the app (a "Nether" or "End" theme, a reward skin), repoint these.
Components don't change.

Every token becomes a Tailwind utility: `bg-matcha`, `text-milk-tea`,
`border-outline`, `text-accent`, etc. In CSS use `var(--color-matcha)`.

---

## 4. Components

| React | Class | Variants | Use for |
|---|---|---|---|
| `<Card variant heading>` | `.mc-panel` | `primary` → `--grass` (grass-topped dirt), `secondary` → `--wood` (oak planks), `plain` | any boxed section |
| `<Button variant size block>` | `.mc-btn` | `primary` (grass), `secondary` (wood), `danger` (redstone); `sm` / `md` / `lg`; `block` = full width | actions |
| `<TextInput label error updateValue>` | `.mc-field`, `.mc-input` | `aria-invalid` shows a red edge | text fields (label + error wired up for screen readers) |
| `<ProgressBar value label>` | `.mc-bar`, `.mc-bar__fill` | value is 0 to 1 | XP, cleanup progress |
| n/a | `.mc-status` | `--ok`, `--error`, `--pending` (blinks) | connection / sync state |
| n/a | `.mc-slot` | holds an `<img>` or text | inventory-style icon or item |
| n/a | `.mc-stat`, `.mc-stat__value` | n/a | label ... value rows |
| n/a | `.mc-title`, `.mc-subtitle`, `.mc-label`, `.mc-level`, `.mc-error`, `.mc-link` | n/a | text styles |
| n/a | `.mc-app` | n/a | wrapper for a whole screen |

Component props have defaults (`variant="primary"`, `size="md"`), and
`className` is merged, so you can add layout utilities:
`<Button className="self-end">`.

Example screen:

```tsx
<main className="mc-app">
  <Card variant="primary" heading="Today's haul">
    <div className="mc-stat">
      <span className="mc-label">Emails cleared</span>
      <span className="mc-stat__value">42</span>
    </div>
    <ProgressBar value={0.42} label="Daily goal" />
    <Button block>Start cleaning</Button>
  </Card>
</main>
```

---

## 5. Extending the theme

### Add a color
1. Add it to `tokens.css` under **Derived** (or **Palette** if it's from the
   source scheme), with a comment saying what it's for.
2. If it fills a role, add or repoint a **semantic** token.
3. Add a row to the table in §3 above.

### Add a component
1. Write the CSS in `components.css` inside `@layer components`, named
   `.mc-<thing>`, `.mc-<thing>--<variant>`, `.mc-<thing>__<part>`.
2. Want the bevel? Add your selector to the two shared lists at the top
   of `components.css` (the recipe list, and the inset list if it should
   look sunken). Then set `--mc-face`, `--mc-light`, `--mc-dark` (and
   optionally `--mc-edge`) in your own rule. Don't `@apply` `.mc-*`
   classes: Tailwind v4 only allows `@apply` with utilities.
3. If it's used in more than one place, wrap it in a React component in
   `src/components/` with typed `variant` / `size` props mapped to classes
   (see `Button.tsx`).
4. Add a row to the table in §4.

### Add a button / panel variant
Copy `.mc-btn--wood` (or `.mc-panel--wood`), change the three variables (and,
for buttons, the `--mc-press-*` pair and the `--mc-ink` text color; check
contrast is at least 4.5:1), then add the variant to the type and
map in the React component.

### Add a texture
Draw a **16x16** PNG (Piskel, Aseprite, or any pixel editor) using only
palette colors. Save it in `theme/textures/`, add a `--tex-<name>` variable
in `tokens.css`, and use it with `background-size: var(--tex-size)` and
`image-rendering: pixelated`. Small PNGs are inlined into the CSS by Vite.

### Use block art from `graphics/`
`import diamond from '@graphics/28-diamond.png'`, then put it in a slot:
`<span className="mc-slot"><img src={diamond} alt="Diamond" /></span>`.
Use `alt=""` when the image is decorative.

### Add an animation
Add the `@keyframes` inside the `@theme static` block in `tokens.css` and
expose it as `--animate-<name>`. Tailwind then gives you `animate-<name>`.
Use `steps()` timing.

---

## 6. Accessibility checklist

- Body text (`parchment` on `soil`) and muted text (`milk-tea` on `soil`)
  both pass WCAG AA.
- Button text passes AA: white on `grassfield` (5.2:1), parchment on
  `burma-teak` (5.5:1), white on `redstone`. That's why the grass button face
  is `grassfield`, not the brighter `matcha`: light text on `matcha` is only
  2.1:1. If you need a `matcha` face, use dark (`bedrock`) text.
- Every focusable thing gets a square `young-green` focus ring
  (`:focus-visible` in base.css). Don't remove it.
- Use real `<button>`s for clickable text (`.mc-link`), not `<div onClick>`.

---

## 7. Font notes

**If the font falls back to a system font:** Chrome injects its own
stylesheet into extension pages (`body { font-family: <system font>;
font-size: 75% }`). It's unlayered, so it beats anything in `@layer base`.
That's why `base.css` sets `font-family` and `font-size` on `body` **outside**
any layer. Keep that block. To check: DevTools → Elements → select `<body>`
→ Computed → `font-family` should start with `Minecraft`, and
`document.fonts` should show `Minecraft: loaded`. Test inside the real
extension: a plain http page doesn't get Chrome's injected stylesheet, so it
won't show this problem.

`graphics/minecraft_font.ttf` is "Minecraft" by Pwnage_Block (2011), from
fontmeme.com. The embedded license says **Creative Commons
Attribution-ShareAlike**, so keep this credit if the extension is shared
publicly.

The downloaded file had a malformed character map (`cmap`) that Chrome's
font sanitizer rejects ("OTS parsing error: cmap: Range glyph reference too
high"). The font silently fell back to monospace. The copy in the repo
was rebuilt with fontTools (same glyphs, valid tables). If you replace the
font, check DevTools → Console for "Failed to decode downloaded font". To
repair a file the same way:

```bash
pip install fonttools
python3 -c "from fontTools.ttLib import TTFont as T; f=T('minecraft_font.ttf', lazy=False); [f[t] for t in f.keys() if t!='GlyphOrder']; f.save('minecraft_font.ttf')"
```
