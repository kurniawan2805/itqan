# Itqan Design System

## Product Feel

Itqan is a calm Quran memorization app. The UI should feel focused, quiet, and intentional, not like a generic productivity dashboard.

Core qualities:

- Calm: low visual noise, generous spacing, restrained borders.
- Sacred: warm gold accents, book-like surfaces, no neon except in study focus mode.
- Focused: Mushaf and study screens remove unrelated navigation.
- Practical: controls are obvious, large enough for mobile, and close to the task.
- Consistent: one visual language across onboarding, dashboard, settings, mushaf, and study.

Avoid:

- Random gradients.
- Too many accent colors.
- Card clutter.
- Heavy shadows everywhere.
- Bright saturated green as the main brand color.
- Mismatched light/dark styles between screens.

## Theme Tokens

Use CSS variables in `:root` and `[data-theme='dark']`. Components should consume tokens, not hardcoded colors.

### Light Theme

```css
:root {
  --bg: #f5f1e8;
  --surface: #fffdf8;
  --surface-muted: #eee8dc;
  --surface-raised: #ffffff;

  --text: #16181d;
  --text-muted: #647084;
  --text-soft: #8a728f;

  --border: #ded5c4;
  --border-soft: rgba(156, 127, 58, 0.22);

  --accent: #b68a18;
  --accent-strong: #8f6810;
  --accent-soft: #f4ead0;
  --accent-text: #3d2b05;

  --success: #0f6b55;
  --success-soft: #dcefe8;
  --danger: #9f241f;
  --danger-soft: #f8dedb;

  --shadow-sm: 0 4px 16px rgba(38, 29, 12, 0.08);
  --shadow-md: 0 14px 38px rgba(38, 29, 12, 0.14);

  --radius-sm: 10px;
  --radius-md: 16px;
  --radius-lg: 24px;
  --radius-pill: 999px;
}
```

### Dark Theme

```css
[data-theme='dark'] {
  --bg: #090d12;
  --surface: #111821;
  --surface-muted: #171f2b;
  --surface-raised: #141c27;

  --text: #eef2f7;
  --text-muted: #98a2b3;
  --text-soft: #6f7b8e;

  --border: #243041;
  --border-soft: rgba(214, 174, 45, 0.2);

  --accent: #d6ae2d;
  --accent-strong: #f1c94b;
  --accent-soft: rgba(214, 174, 45, 0.14);
  --accent-text: #fff4c7;

  --success: #32b891;
  --success-soft: rgba(50, 184, 145, 0.14);
  --danger: #ff7a72;
  --danger-soft: rgba(255, 122, 114, 0.12);

  --shadow-sm: 0 6px 18px rgba(0, 0, 0, 0.2);
  --shadow-md: 0 18px 48px rgba(0, 0, 0, 0.34);
}
```

## Typography

Use system UI for Latin text:

```css
font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

Arabic text:

- Mushaf screen: QuranWBW page-specific KFGQPC v4 font only.
- Study screen: same page-specific KFGQPC v4 font for line/verse display.
- Never let Arabic fallback silently in Mushaf/Study. Hide or show loading until font is ready.

Type scale:

- Page title: `24px / 1.2`, weight 750.
- Section title: `18px / 1.25`, weight 750.
- Body: `15px / 1.5`, weight 400.
- Small/meta: `12px / 1.3`, weight 500.
- Arabic study: `clamp(2rem, 8vw, 4rem)`, line-height `1.7`.
- Mushaf Arabic: `min(36px, 5.4vw)`, page font.

## Layout Rules

### App Shell

- Default screens use centered max width: `min(960px, 100%)`.
- Padding mobile: `16px`.
- Padding desktop: `24px`.
- Bottom nav only appears outside focus modes.
- Focus modes: `mushaf`, `study`; no bottom nav.

### Spacing Scale

Use this scale:

- `4px`: icon/text micro gaps.
- `8px`: control inner gaps.
- `12px`: compact card gaps.
- `16px`: default section gaps.
- `24px`: major section gaps.
- `32px`: screen-level separation.

Do not invent random margins unless matching Mushaf typography.

## Core Components

### Buttons

Primary:

- Background: `--accent`.
- Text: `#111827` in dark study mode, `#fffdf8` in normal light contexts if contrast requires.
- Radius: `--radius-md`.
- Height: 44-52px.

Secondary:

- Background: `--surface-muted`.
- Border: `1px solid var(--border-soft)`.
- Text: `--text`.

Pill navigation:

- Radius: `--radius-pill`.
- Height: 42px.
- Padding inline: 14-18px.
- Used for `Home`, `Menu`, reciter controls, range chips.

Icon buttons:

- 42x42px.
- Radius: 12px or pill depending context.
- Border: `1px solid var(--border)`.

### Cards

Default card:

- Background: `--surface`.
- Border: `1px solid var(--border)`.
- Radius: `--radius-md`.
- Padding: 16px mobile, 20px desktop.
- Shadow: none by default; only use `--shadow-sm` for floating/active elements.

Important cards:

- Use a thin accent border or top accent line.
- Do not use large colored backgrounds unless in study mode.

### Form Fields

- Background: `--surface-raised`.
- Border: `1px solid var(--border)`.
- Radius: 12px.
- Height: 44px minimum.
- Focus ring: `0 0 0 3px var(--accent-soft)`.
- Labels are short, with helper text below when needed.

### Chips

- Used for memorized ranges and selected filters.
- Background: `--accent-soft`.
- Text: `--accent-text`.
- Border: `1px solid var(--border-soft)`.
- Radius: pill.

## Screen Specs

## Onboarding

Purpose: setup once without feeling like a tax form.

Layout:

- Step-like sections, not one giant grid on mobile.
- Desktop can use two columns for simple fields.
- Range input gets its own full-width card.
- Sticky bottom primary action on mobile if content grows.

Sections:

1. Profile
   - Name panggilan.
   - Hafalan path: front/back/custom.
2. Target
   - Unit: lines / half page / page.
   - Amount.
   - Optional finish date.
3. Audio & translation
   - Sabaq reciter.
   - Review reciter.
   - Translation language.
4. Existing memorization
   - Type: Page/Juz/Surah/Ayah.
   - Range input.
   - `+ Range`.
   - Range chips list.

Visual:

- Calm light theme.
- Use accent only for active step, primary button, and range chips.
- Avoid dark study styling here.

## Dashboard

Purpose: answer “what should I do today?”

Layout:

- Greeting with name: “Assalamu alaikum, {name}”.
- Date below.
- Three target cards: Sabaq, Sabqi, Manzil.
- Cards should be equal height on desktop.
- Each card includes:
  - label badge.
  - title.
  - simple description.
  - range/page summary.
  - primary action.

Card language:

- Sabaq: “Hafalan baru hari ini.”
- Sabqi: “Ulangan hafalan baru agar cepat kuat.”
- Manzil: “Murajaah hafalan lama supaya tetap lancar.”

Do not overload dashboard with settings.

## Mushaf Mode

Purpose: read Quran page with minimal distraction.

Rules:

- No bottom nav.
- Top bar like QuranWBW:
  - left: Home pill.
  - center: Page number.
  - right: Menu pill.
- Meta bar below top bar:
  - left: Surah name.
  - right: Juz.
- Mushaf page centered.
- Body background should be `--surface` or very light paper color.

Mushaf renderer:

- Use page-specific font via `FontFace` API.
- Never show fallback Arabic.
- Line spacing controlled by:
  - `.mushaf-line-group { margin-top: ... }`
  - `.mushaf-line { height: calc(var(--mushaf-font-size) * ...) }`
- Keep line spacing close to QuranWBW reference.

Navigation:

- Quran RTL paging:
  - left arrow = next page.
  - right arrow = previous page.

## Study Mode

Purpose: memorize new material, ayah/line by ayah/line.

Visual:

- Dark theme by default.
- Gold accent.
- Big Arabic card with strong focus.
- Translation card below, optional toggle.
- Bottom action bar.

Header:

- close/back icon.
- progress bar.
- item count: `1/7`.

Main:

- Surah label.
- Item label: `Ayah 1`, `Line 3`, etc.
- Arabic card.
- Translation card.
- Tabs:
  - Meaning.
  - Context.
  - Connected.
  - Similar.

Study actions:

- Repeat 5x.
- Play range.
- Toggle translation.
- Mark done.

Audio:

- Sabaq full ayah uses EveryAyah verse audio.
- Sabaq line segment uses QuranWBW word audio queue.
- Sabqi/Manzil uses EveryAyah playlist.

## Review Mode

Purpose: murajaah close/far range without heavy explanation.

Visual:

- Can reuse Study Mode dark shell.
- Less emphasis on translation.
- Main control is range audio playlist.

Defaults:

- Translation off.
- Repeat range available.
- Mark range reviewed.

## Settings

Purpose: adjust app behavior; not a second onboarding.

Sections:

- Profile.
- Hafalan path.
- Target.
- Audio.
- Translation.
- Mushaf.
- Data/reset/export later.

Use grouped cards with section headers.

## Icon Style

Use Lucide icons consistently:

- Home.
- Menu/Grid.
- Play/Pause.
- Rotate/Repeat.
- BookOpen.
- Settings.
- Star/mark difficult.

Icon size:

- Small inline: 14-16px.
- Buttons: 18-20px.
- Cards: 20-24px.

## Accessibility

- Every icon-only button must have `aria-label`.
- Minimum touch target: 42px.
- Keep text contrast AA.
- Do not rely on color only for status.
- Audio controls must be reachable by keyboard.

## Implementation Notes

Refactor CSS toward tokens first:

1. Add theme variables.
2. Replace hardcoded card/button colors.
3. Split screen-specific blocks:
   - app shell.
   - dashboard.
   - onboarding.
   - mushaf.
   - study.
   - settings.
4. Add `data-theme` support later.

Priority fixes for current UI:

1. Normalize cards and form fields to use token surfaces.
2. Redesign onboarding into clear sections.
3. Redesign study action bar; current button row is too utilitarian.
4. Use dark theme only for study, not random dark fragments elsewhere.
5. Keep Mushaf close to QuranWBW reference, not the app card style.
