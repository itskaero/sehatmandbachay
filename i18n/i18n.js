/**
 * SehatMand Bachay — i18n core engine
 *
 * Usage:
 *   I18n.t("key")                → translated string (or key if missing)
 *   I18n.applyLang("ur")        → swap all [data-i18n] elements + set dir/lang
 *   I18n.currentLang            → "en" | "ur" | ...
 *
 * HTML markup:
 *   <span data-i18n="nav.dashboard">Dashboard</span>
 *   <input data-i18n-placeholder="placeholder.childName" ... />
 *   <button data-i18n-title="tooltip.exportPdf" ...>…</button>
 *   <span data-i18n-html="html.clinicalReminder">…</span>  ← innerHTML
 */

const I18n = (() => {
  const LANGS = {};
  let current = localStorage.getItem("smb_lang") || "en";

  /** Register a language dictionary — called by en.js, ur.js, etc. */
  function register(lang, strings) {
    LANGS[lang] = strings;
  }

  /** Return translated string for key in current language, with English fallback */
  function t(key) {
    return (LANGS[current] && LANGS[current][key])
        || (LANGS["en"]  && LANGS["en"][key])
        || key;
  }

  /** Walk DOM and swap all annotated elements, update <html> lang/dir */
  function applyLang(lang) {
    if (!LANGS[lang]) {
      console.warn("I18n: language not registered:", lang, "— available:", Object.keys(LANGS).join(", "));
      return;
    }
    current = lang;
    localStorage.setItem("smb_lang", lang);

    const html = document.documentElement;
    html.lang = lang;
    html.dir  = (lang === "ur") ? "rtl" : "ltr";

    // textContent replacements
    document.querySelectorAll("[data-i18n]").forEach(el => {
      const val = t(el.getAttribute("data-i18n"));
      if (val) el.textContent = val;
    });

    // placeholder replacements
    document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
      const val = t(el.getAttribute("data-i18n-placeholder"));
      if (val) el.placeholder = val;
    });

    // title/tooltip replacements
    document.querySelectorAll("[data-i18n-title]").forEach(el => {
      const val = t(el.getAttribute("data-i18n-title"));
      if (val) el.title = val;
    });

    // innerHTML replacements (for strings with tags like <strong>)
    document.querySelectorAll("[data-i18n-html]").forEach(el => {
      const val = t(el.getAttribute("data-i18n-html"));
      if (val) el.innerHTML = val;
    });

    // aria-label replacements
    document.querySelectorAll("[data-i18n-aria]").forEach(el => {
      const val = t(el.getAttribute("data-i18n-aria"));
      if (val) el.setAttribute("aria-label", val);
    });

    // Notify any module that needs to re-render after a lang change
    document.dispatchEvent(new CustomEvent("smb:langchange", { detail: { lang } }));
  }

  /** Call after DOM is ready and all lang files have been registered */
  function init() {
    applyLang(current);
  }

  return {
    register,
    t,
    applyLang,
    init,
    get currentLang() { return current; },
  };
})();
