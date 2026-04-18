# SehatMand Bachay — Localisation Guide

## Folder layout

```
i18n/
  i18n.js        ← core engine (do not edit for translation work)
  en.js          ← English — source / reference language  ← START HERE
  ur.js          ← اردو (Urdu) — existing translation
  TRANSLATE.md   ← this file
```

---

## How to add a new language

1. **Copy `en.js`** and rename it to your ISO 639-1 code, e.g. `ps.js` (Pashto), `sd.js` (Sindhi).

2. **Change the registration call** on the first `I18n.register(…)` line:
   ```js
   // was:
   I18n.register("en", { … });
   // becomes:
   I18n.register("ps", { … });
   ```

3. **Translate each value string** inside the object.  
   - Keys (left of the colon) must stay exactly as-is.  
   - Values (right of the colon) are what you translate.  
   - Untranslated keys can be deleted — the engine falls back to English automatically.

4. **Load the file in `index.html`**, alongside the other lang files:
   ```html
   <script src="i18n/i18n.js"></script>
   <script src="i18n/en.js"></script>
   <script src="i18n/ur.js"></script>
   <script src="i18n/ps.js"></script>   <!-- ← add this line -->
   ```

5. **Add a toggle button** in the sidebar language area (search for `lang.toggle` in `index.html`).

---

## Key naming conventions

| Prefix | Used for |
|--------|----------|
| `nav.*` | Sidebar navigation labels |
| `dash.*` | Dashboard section copy |
| `assess.*` | Child Assessment view |
| `planner.*` | Diet Planner view |
| `f75.*` | F-75 / F-100 module |
| `fooddb.*` | Food Database view |
| `saved.*` | Patient Records view |
| `modal.*` | Modal titles |
| `form.*` | Form field labels |
| `btn.*` | Button labels |
| `placeholder.*` | Input placeholder text |
| `badge.*` | Status chip / badge text |
| `toast.*` | Toast notification messages |
| `meal.*` | Meal-time option labels |
| `sym.*` | Symptom checkbox labels |
| `sidebar.*` | Sidebar footer area |
| `pr.*` | Patient Record modal |

---

## HTML attribute reference

The engine reads four DOM attributes:

| Attribute | What it updates | Example |
|-----------|----------------|---------|
| `data-i18n` | `element.textContent` | `<span data-i18n="nav.dashboard">Dashboard</span>` |
| `data-i18n-placeholder` | `input.placeholder` | `<input data-i18n-placeholder="placeholder.childName" …>` |
| `data-i18n-title` | `element.title` (tooltip) | `<button data-i18n-title="tooltip.exportPdf" …>` |
| `data-i18n-html` | `element.innerHTML` | `<p data-i18n-html="dash.phase.stabilize.desc">…</p>` |
| `data-i18n-aria` | `aria-label` attribute | `<nav data-i18n-aria="nav.ariaLabel" …>` |

Always keep the **existing visible text** as the fallback content of the element (shown before JS loads).

---

## RTL support

When Urdu (or another RTL language) is active, the engine sets:
```
<html lang="ur" dir="rtl">
```
The app's CSS uses logical properties (`margin-inline-start`, `padding-inline-end`) where possible  
so RTL layout flips automatically.  For any element that does **not** flip correctly, add a scoped  
`[dir="rtl"] .your-class { … }` override in `style.css`.

---

## Medical / clinical terms that stay in English

The following strings are intentionally kept in their acronym form even in Urdu and
other translations, because clinical staff in Pakistan recognise them by their English names:

- `SAM`, `MAM` — severity classifications
- `MUAC` — mid-upper arm circumference
- `WHZ` — weight-for-height z-score  
- `F-75`, `F-100` — therapeutic formula names
- `RUTF` — ready-to-use therapeutic food
- Unit suffixes: `kg`, `cm`, `kcal`, `g`, `ml`

---

## Testing your translation

1. Open the app in a browser.
2. Click the language toggle button (top-right of sidebar footer).
3. Verify text switches throughout the UI.
4. Check RTL layout if adding an RTL language.
5. Check that placeholders update in search boxes and form fields.

---

## Reporting missing translations

If a key shows as its raw key name (e.g. `"assess.heading"` appears in the UI), it means:
- The key is missing from both the active language and `en.js`.
- Add it to `en.js` first, then to your translation file.

If the text stays in English when another language is active:
- Either the element is missing a `data-i18n` attribute (open a PR to add it in `index.html`),  
  or the key is deliberately not translated (it uses the English fallback).
