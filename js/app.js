/* ═══════════════════════════════════════════════════════════════
   app.js
   Main application controller — navigation, global state,
   assessment module, saved diets, F-75 module, and utilities.
═══════════════════════════════════════════════════════════════ */

/* ── Global Utility ─────────────────────────────────────────── */

/** Safe HTML escape to prevent XSS */
function escHtml(str) {
  if (typeof str !== "string") return String(str ?? "");
  return str.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

/* ═══════════════════════════════════════════════════════════════
   AssessmentModule
═══════════════════════════════════════════════════════════════ */

const AssessmentModule = (() => {

  let lastResult = null;

  /* ── MUAC Indicator ─────────────────────────────────────────── */

  function updateMuacIndicator(val) {
    const wrapper = document.getElementById("muac-band-wrapper");
    const pointer = document.getElementById("muac-pointer");
    const muac = parseFloat(val);
    if (!wrapper || !pointer || isNaN(muac)) {
      if (wrapper) wrapper.style.display = "none";
      return;
    }

    wrapper.style.display = "block";

    // Map MUAC to percentage position (range 9–15 cm mapped to 0–100%)
    const minV = 9, maxV = 15;
    const pct  = Math.min(Math.max(((muac - minV) / (maxV - minV)) * 100, 0), 100);
    pointer.style.left = pct + "%";
  }

  /* ── Radio & Appetite Buttons ─────────────────────────────── */

  function initFormInteractions() {
    // Appetite buttons
    document.getElementById("appetite-row")?.addEventListener("click", e => {
      const btn = e.target.closest(".appetite-btn");
      if (!btn) return;
      document.querySelectorAll(".appetite-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
    });
  }

  /* ── Classify ───────────────────────────────────────────────── */

  function classify() {
    const ageVal   = parseFloat(document.getElementById("child-age").value);
    const ageUnit  = document.getElementById("age-unit").value;
    const weight   = parseFloat(document.getElementById("child-weight").value);
    const muacVal  = document.getElementById("child-muac").value;
    const height   = document.getElementById("child-height").value;
    const edema    = document.querySelector('input[name="edema"]:checked')?.value || "no";
    const appetite = document.querySelector(".appetite-btn.active")?.dataset.value || "good";

    // Validation
    if (isNaN(ageVal) || ageVal < 0) {
      AppController.showToast("Please enter a valid age", "error"); return;
    }
    if (isNaN(weight) || weight <= 0) {
      AppController.showToast("Please enter a valid weight", "error"); return;
    }

    const ageMonths = NutritionCalc.ageToMonths(ageVal, ageUnit);
    const muac      = muacVal ? parseFloat(muacVal) : null;
    const heightNum = height  ? parseFloat(height)  : null;
    const name      = document.getElementById("child-name").value.trim();

    // Collect symptoms
    const symptoms = [];
    if (document.getElementById("sym-diarrhea")?.checked)    symptoms.push("diarrhea");
    if (document.getElementById("sym-fever")?.checked)        symptoms.push("fever");
    if (document.getElementById("sym-vomiting")?.checked)     symptoms.push("vomiting");
    if (document.getElementById("sym-respiratory")?.checked)  symptoms.push("respiratory");

    const result = NutritionCalc.classify({
      ageMonths, weight, muac, height: heightNum, edema, appetite, symptoms
    });

    lastResult = result;

    // Save to global context
    AppController.setPatientContext({
      name, ageMonths, weight, muac, height: heightNum, edema, appetite, symptoms,
      result
    });

    renderResults(result, { name, ageMonths, weight, muac });
    AppController.updateDashboardStats();
  }

  /* ── Render Results ─────────────────────────────────────────── */

  function renderResults(result, patient) {
    const container = document.getElementById("assessment-results");
    container.style.display = "flex";

    /* Badge */
    const badge = document.getElementById("hero-badge");
    badge.className = "hero-badge " + result.classification.toLowerCase();
    badge.textContent = result.classification;

    /* Title / Description */
    document.getElementById("result-title").textContent = {
      SAM:    "Severe Acute Malnutrition (SAM)",
      MAM:    "Moderate Acute Malnutrition (MAM)",
      Normal: "Normal Nutritional Status"
    }[result.classification] || result.classification;

    const descMap = {
      SAM:    "Requires immediate medical attention. Initiate WHO SAM protocol.",
      MAM:    "Nutritional support required. Monitor closely for deterioration.",
      Normal: "Continue preventive nutrition support and growth monitoring."
    };
    document.getElementById("result-description").textContent = descMap[result.classification] || "";

    /* Evidence Chips */
    const chipsHtml = result.evidence.map(e => {
      const cls = e.severity === "high" ? "badge red" : e.severity === "medium" ? "badge yellow" : "badge green";
      return `<span class="${cls}">${escHtml(e.text)}</span>`;
    }).join(" ");
    document.getElementById("result-chips").innerHTML = chipsHtml;

    /* Refeeding Warning */
    document.getElementById("refeeding-card").style.display =
      result.refeedingRisk ? "block" : "none";

    /* Phase Result */
    const phaseHtml = buildPhaseResultHTML(result.phase, result.requirements);
    document.getElementById("phase-result-body").innerHTML = phaseHtml;

    /* Requirements */
    document.getElementById("requirements-body").innerHTML = buildRequirementsHTML(result.requirements, patient.weight);

    // Smooth scroll to results
    container.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function buildPhaseResultHTML(phase, req) {
    const phaseMap = {
      Stabilization: { cls: "stab",  icon: "fas fa-hospital",    label: "Stabilization Phase",  sub: "F-75 formula every 3 hours. Treat acute complications." },
      Transition:    { cls: "trans", icon: "fas fa-exchange-alt", label: "Transition Phase",     sub: "Switch to F-100. Appetite improving — monitor closely." },
      Rehabilitation:{ cls: "rehab", icon: "fas fa-running",      label: "Rehabilitation Phase", sub: "High-calorie local foods. Target rapid catch-up growth." }
    };
    const p = phaseMap[phase] || phaseMap["Rehabilitation"];
    return `
      <div class="phase-result-item ${p.cls}">
        <div class="phase-result-icon"><i class="${p.icon}"></i></div>
        <div class="phase-result-text">
          <strong>${p.label}</strong>
          <p>${p.sub}</p>
        </div>
      </div>`;
  }

  function buildRequirementsHTML(req, weightKg) {
    return `
      <div class="req-grid">
        <div class="req-item">
          <div class="req-value">${req.kcalMin}–${req.kcalMax}</div>
          <div class="req-label">kcal / day</div>
          <div class="req-per">${req.perKgKcal.min}–${req.perKgKcal.max} kcal/kg/day</div>
        </div>
        <div class="req-item">
          <div class="req-value">${req.protMin}–${req.protMax}g</div>
          <div class="req-label">Protein / day</div>
          <div class="req-per">${req.perKgProt.min}–${req.perKgProt.max} g/kg/day</div>
        </div>
        <div class="req-item">
          <div class="req-value">${req.fatMin}–${req.fatMax}g</div>
          <div class="req-label">Fat / day</div>
          <div class="req-per">Based on ${weightKg} kg</div>
        </div>
      </div>
      <div class="alert alert-info" style="margin-top:12px;">
        <i class="fas fa-info-circle"></i>
        <div>Recommended formula: <strong>${req.formula}</strong> — Target: <strong>${req.kcalTarget} kcal/day</strong></div>
      </div>`;
  }

  /* ── Navigate to Planner ──────────────────────────────────── */

  function goToPlanner() {
    AppController.navigate("planner");
    setTimeout(() => DietPlanner.loadPatientContext(), 100);
  }

  function viewF75() {
    AppController.navigate("f75");
  }

  /* ── Save Assessment ─────────────────────────────────────── */

  async function saveAssessment() {
    const ctx = AppController.getPatientContext();
    if (!ctx || !ctx.result) {
      AppController.showToast("Complete an assessment first", "error"); return;
    }

    const record = {
      type:           "assessment",
      patientName:    ctx.name || "Unnamed",
      ageMonths:      ctx.ageMonths,
      weight:         ctx.weight,
      muac:           ctx.muac,
      edema:          ctx.edema,
      appetite:       ctx.appetite,
      classification: ctx.result.classification,
      phase:          ctx.result.phase,
      requirements:   ctx.result.requirements,
      date:           new Date().toLocaleDateString("en-PK"),
      timestamp:      Date.now()
    };

    try {
      const id = await dbSave("assessments", record);
      AppController.addSavedRecord({ id, ...record });
      AppController.updateDashboardStats();
      AppController.showToast("Assessment saved!", "success");
    } catch (err) {
      AppController.showToast("Error saving: " + err.message, "error");
    }
  }

  return {
    classify, updateMuacIndicator, goToPlanner, viewF75, saveAssessment, initFormInteractions
  };

})();

/* ═══════════════════════════════════════════════════════════════
   F75Module
═══════════════════════════════════════════════════════════════ */

const F75Module = (() => {

  function init() {
    updateLocalNutrition();
  }

  /* ── Tab Switching ─────────────────────────────────────────── */

  function setupTabs() {
    const strip = document.getElementById("f75-tabs");
    if (!strip) return;
    strip.addEventListener("click", e => {
      const btn = e.target.closest(".tab-btn");
      if (!btn) return;
      const tab = btn.dataset.tab;
      document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
      btn.classList.add("active");
      const panel = document.getElementById(tab);
      if (panel) panel.classList.add("active");
      if (tab === "localrecipe") updateLocalNutrition();
    });
  }

  /* ── Local Recipe Nutrition ─────────────────────────────────── */

  function updateLocalNutrition() {
    const milk   = parseFloat(document.getElementById("lr-milk")?.value)    || 0;
    const sugar  = parseFloat(document.getElementById("lr-sugar")?.value)   || 0;
    const cereal = parseFloat(document.getElementById("lr-cereal")?.value)  || 0;
    const oil    = parseFloat(document.getElementById("lr-oil")?.value)     || 0;

    const result   = NutritionCalc.calcLocalRecipe(milk, sugar, cereal, oil);
    const resultEl = document.getElementById("local-recipe-result");
    if (!resultEl) return;

    const col = (val, ok) => `<span style="color:${ok ? "var(--success)" : "var(--danger)"};font-weight:700;">${val}</span>`;

    resultEl.innerHTML = `
      <div class="rr-title">Estimated Nutrition per 100 ml:</div>
      <div class="rr-row"><span>Calories</span>${col(result.per100.kcal + " kcal", result.adequateKcal)} <small>(target: ~75)</small></div>
      <div class="rr-row"><span>Protein</span>${col(result.per100.protein + "g", result.adequateProtein)} <small>(target: ~0.9g)</small></div>
      <div class="rr-row"><span>Fat</span>${col(result.per100.fat + "g", result.adequateFat)} <small>(target: ~2.6g)</small></div>
      <div class="rr-row" style="margin-top:8px; padding-top:8px; border-top:1px solid rgba(26,127,90,.2);">
        <span>Per 1000 ml total:</span>
        <span>${result.totalKcal} kcal, ${result.totalProtein}g prot</span>
      </div>
      ${!result.adequateKcal ? `<div style="color:var(--warning);font-size:.75rem;margin-top:6px;">⚠ Calories below F-75 target. Consider adding more sugar or oil.</div>` : ""}`;
  }

  /* ── Volume Calculator ──────────────────────────────────────── */

  function calcVolume() {
    const weight  = parseFloat(document.getElementById("vc-weight")?.value)  || 0;
    const formula = document.getElementById("vc-formula")?.value || "f75";
    const target  = parseFloat(document.getElementById("vc-phase")?.value)   || 80;

    const resultsEl = document.getElementById("vol-results");
    if (!resultsEl) return;

    if (!weight || weight <= 0) {
      resultsEl.innerHTML = `<div class="empty-state"><i class="fas fa-calculator fa-2x"></i><p>Enter weight to calculate</p></div>`;
      return;
    }

    const r = NutritionCalc.calcFormulaVolume(weight, formula, target);
    const scheduleHTML = r.schedules.map(s => `
      <div class="vol-feed-item">
        <div class="vf-num">${s.mlPerFeed} ml</div>
        <div class="vf-lbl">${s.feeds}× per day</div>
        <div class="vf-lbl" style="font-size:.6rem;">${s.label.split("(")[0]}</div>
      </div>`).join("");

    resultsEl.innerHTML = `
      <div class="vol-result-card">
        <div class="vol-result-title">${r.formulaType} — ${weight} kg — Target: ${target} kcal/kg/day</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">
          <div class="req-item"><div class="req-value">${r.totalMl} ml</div><div class="req-label">Total Volume / Day</div></div>
          <div class="req-item"><div class="req-value">${r.totalKcal} kcal</div><div class="req-label">Total Energy / Day</div></div>
        </div>
        <div style="font-size:.8rem;font-weight:600;color:var(--text-2);margin-bottom:8px;">Volume per feed by schedule:</div>
        <div class="vol-feed-grid">${scheduleHTML}</div>
        <div class="alert alert-info" style="margin-top:12px;">
          <i class="fas fa-clock"></i>
          <p>Start with 8 feeds/day (every 3 hours) in stabilization phase. 
          Increase volume gradually by max 25% per day.</p>
        </div>
      </div>`;
  }

  return { init, setupTabs, updateLocalNutrition, calcVolume };

})();

/* ═══════════════════════════════════════════════════════════════
   SavedDiets Module
═══════════════════════════════════════════════════════════════ */

const SavedDiets = (() => {
  let allRecords = [];

  async function init() {
    try {
      const assessments = await dbGetAll("assessments");
      const diets       = await dbGetAll("diets");
      allRecords = [...assessments, ...diets].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    } catch {
      allRecords = [];
    }
    render(allRecords);
    updateDashboard();
  }

  function render(records) {
    const container = document.getElementById("saved-list");
    if (!container) return;
    if (!records.length) {
      container.innerHTML = `
        <div class="card-empty">
          <div class="empty-state">
            <i class="fas fa-folder-open fa-3x"></i>
            <h3>No saved records</h3>
            <p>Save assessments and diet plans to view them here</p>
            <button class="btn btn-primary" onclick="AppController.navigate('assessment')">
              <i class="fas fa-plus"></i> New Assessment
            </button>
          </div>
        </div>`;
      return;
    }

    container.innerHTML = records.map(r => buildRecordCard(r)).join("");
  }

  function buildRecordCard(r) {
    const cls = r.classification || "—";
    const bgColors = { SAM: "#fee2e2", MAM: "#fef3c7", Normal: "#f0fdf4" };
    const txtColors = { SAM: "#991b1b", MAM: "#92400e", Normal: "#166534" };
    const avatarBg  = bgColors[cls]   || "#f0f7f4";
    const avatarTxt = txtColors[cls]  || "#1a7f5a";
    const initial   = (r.patientName || "?")[0].toUpperCase();

    const isAssessment = r.type === "assessment";
    const typeIcon     = isAssessment ? "fas fa-clipboard-check" : "fas fa-utensils";
    const typeLabel    = isAssessment ? "Assessment" : "Diet Plan";

    return `
      <div class="saved-record">
        <div class="saved-avatar" style="background:${avatarBg};color:${avatarTxt};">${initial}</div>
        <div class="saved-info">
          <div class="saved-name">${escHtml(r.patientName || "Unnamed")}</div>
          <div class="saved-meta">
            <span class="badge ${cls === "SAM" ? "red" : cls === "MAM" ? "yellow" : "green"}">${cls}</span>
            &nbsp; ${escHtml(r.phase || "")} &nbsp;·&nbsp;
            <i class="${typeIcon}"></i> ${typeLabel} &nbsp;·&nbsp;
            ${escHtml(r.date || "")}
          </div>
          ${r.totals ? `<div style="font-size:.78rem;color:var(--text-2);margin-top:3px;">
            ${r.totals.calories} kcal · ${r.totals.protein}g protein · ${r.totals.fat}g fat</div>` : ""}
        </div>
        <div class="saved-actions">
          <button class="btn btn-sm btn-outline" onclick="SavedDiets.load('${r.id}')">
            <i class="fas fa-eye"></i> View
          </button>
          <button class="btn btn-sm btn-danger" onclick="SavedDiets.remove('${r.id}')">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>`;
  }

  function search(term) {
    const t = term.toLowerCase().trim();
    render(t ? allRecords.filter(r => (r.patientName || "").toLowerCase().includes(t)) : allRecords);
  }

  function addRecord(rec) {
    allRecords.unshift(rec);
    render(allRecords);
    updateDashboard();
  }

  function load(id) {
    const rec = allRecords.find(r => r.id === id);
    if (!rec) return;
    alert(`Record: ${rec.patientName || "Unnamed"}\nClassification: ${rec.classification}\nPhase: ${rec.phase}\nDate: ${rec.date}`);
  }

  async function remove(id) {
    if (!confirm("Delete this record? Cannot be undone.")) return;
    try {
      const rec = allRecords.find(r => r.id === id);
      const col = rec?.type === "diet" ? "diets" : "assessments";
      await dbDelete(col, id);
      allRecords = allRecords.filter(r => r.id !== id);
      render(allRecords);
      updateDashboard();
      AppController.showToast("Record deleted", "info");
    } catch (err) {
      AppController.showToast("Delete failed: " + err.message, "error");
    }
  }

  function updateDashboard() {
    const total = allRecords.length;
    const sam   = allRecords.filter(r => r.classification === "SAM").length;
    const mam   = allRecords.filter(r => r.classification === "MAM").length;
    const diets = allRecords.filter(r => r.type === "diet").length;

    const s = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
    s("stat-total", total); s("stat-sam", sam); s("stat-mam", mam); s("stat-diets", diets);

    // Recent assessments on dashboard
    const recent = allRecords.slice(0, 5);
    const recentEl = document.getElementById("recent-assessments-list");
    if (recentEl) {
      if (!recent.length) {
        recentEl.innerHTML = `<div class="empty-state"><i class="fas fa-clipboard-list"></i><p>No assessments yet</p></div>`;
      } else {
        recentEl.innerHTML = recent.map(r => {
          const cls = r.classification || "Normal";
          const clsBadge = cls === "SAM" ? "red" : cls === "MAM" ? "yellow" : "green";
          const initial  = (r.patientName || "?")[0].toUpperCase();
          return `<div class="recent-row" onclick="AppController.navigate('saved')">
            <div class="recent-avatar">${initial}</div>
            <div class="recent-info">
              <div class="recent-name">${escHtml(r.patientName || "Unnamed")}</div>
              <div class="recent-meta">${r.phase || ""} · ${r.date || ""}</div>
            </div>
            <div class="recent-badge"><span class="badge ${clsBadge}">${cls}</span></div>
          </div>`;
        }).join("");
      }
    }
  }

  return { init, load, remove, search, addRecord, updateDashboard };

})();

/* ═══════════════════════════════════════════════════════════════
   AppController — Main Application Controller
═══════════════════════════════════════════════════════════════ */

const AppController = (() => {

  let patientContext = null;
  let currentView    = "dashboard";
  let isUrdu         = false;

  /* ── Navigation ─────────────────────────────────────────────── */

  const VIEW_TITLES = {
    dashboard:  "Dashboard",
    assessment: "Child Assessment",
    planner:    "Diet Planner",
    fooddb:     "Food Database",
    saved:      "Saved Diets",
    f75:        "F-75 / F-100 Module"
  };

  function navigate(viewId) {
    // Hide all views
    document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
    document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));

    // Show target view
    const target = document.getElementById("view-" + viewId);
    if (target) target.classList.add("active");

    // Activate nav item
    const navItem = document.querySelector(`[data-view="${viewId}"]`);
    if (navItem) navItem.classList.add("active");

    // Update page title
    const titleEl = document.getElementById("page-title");
    if (titleEl) titleEl.textContent = VIEW_TITLES[viewId] || viewId;

    currentView = viewId;

    // View-specific initialisation
    if (viewId === "planner")    DietPlanner.loadPatientContext();
    if (viewId === "fooddb")     FoodDB.init();
    if (viewId === "saved")      SavedDiets.init();
    if (viewId === "f75")        { F75Module.setupTabs(); F75Module.init(); }

    // Close sidebar on mobile
    if (window.innerWidth < 768) {
      document.getElementById("sidebar")?.classList.remove("open");
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /* ── Patient Context ─────────────────────────────────────────── */

  function setPatientContext(ctx)  { patientContext = ctx; }
  function getPatientContext()     { return patientContext; }

  /* ── Saved Records ───────────────────────────────────────────── */

  function addSavedRecord(record) { SavedDiets.addRecord(record); }
  function updateDashboardStats() { SavedDiets.updateDashboard(); }

  /* ── Toast Notifications ──────────────────────────────────────── */

  function showToast(message, type = "info", duration = 3500) {
    const container = document.getElementById("toast-container");
    if (!container) return;

    const icons = { success: "fa-check-circle", error: "fa-times-circle", warning: "fa-exclamation-triangle", info: "fa-info-circle" };
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="fas ${icons[type] || icons.info}"></i> ${escHtml(message)}`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = "toastIn .25s ease reverse";
      setTimeout(() => toast.remove(), 250);
    }, duration);
  }

  /* ── Sidebar Toggle ──────────────────────────────────────────── */

  function initSidebar() {
    const sidebar  = document.getElementById("sidebar");
    const hamburger = document.getElementById("hamburger");

    hamburger?.addEventListener("click", () => {
      if (window.innerWidth < 768) {
        sidebar?.classList.toggle("open");
      } else {
        document.body.classList.toggle("sidebar-collapsed");
        sidebar?.classList.toggle("collapsed");
      }
    });

    // Nav item click
    document.querySelectorAll(".nav-item").forEach(item => {
      item.addEventListener("click", () => navigate(item.dataset.view));
    });

    // Close sidebar when clicking outside on mobile
    document.addEventListener("click", e => {
      if (window.innerWidth < 768 &&
          !sidebar?.contains(e.target) &&
          !hamburger?.contains(e.target) &&
          sidebar?.classList.contains("open")) {
        sidebar.classList.remove("open");
      }
    });
  }

  /* ── Theme Toggle ───────────────────────────────────────────── */

  function initThemeToggle() {
    // Sync icon with theme already restored by the anti-FOUC inline script
    if (document.documentElement.getAttribute("data-theme") === "dark") {
      var icon = document.getElementById("theme-icon");
      if (icon) { icon.classList.remove("fa-moon"); icon.classList.add("fa-sun"); }
    }
  }

  /* ── Language Toggle (Urdu) ──────────────────────────────────── */

  function initLanguageToggle() {
    const btn   = document.getElementById("lang-toggle");
    const label = document.getElementById("lang-label");
    btn?.addEventListener("click", () => {
      isUrdu = !isUrdu;
      if (label) label.textContent = isUrdu ? "English" : "اردو";
      document.documentElement.setAttribute("lang", isUrdu ? "ur" : "en");
      document.documentElement.setAttribute("dir", isUrdu ? "rtl" : "ltr");
      document.body.classList.toggle("rtl", isUrdu);
      showToast(isUrdu ? "زبان تبدیل ہو گئی" : "Language switched to English", "info");
    });
  }

  /* ── Date Display ────────────────────────────────────────────── */

  function initDateDisplay() {
    const el = document.getElementById("current-date");
    if (!el) return;
    const today = new Date();
    el.textContent = today.toLocaleDateString("en-PK", {
      weekday: "short", year: "numeric", month: "short", day: "numeric"
    });
  }

  /* ── Service Worker ──────────────────────────────────────────── */

  function registerSW() {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("sw.js")
        .then(() => console.info("[SW] Registered"))
        .catch(err => console.warn("[SW] Registration failed:", err));
    }
  }

  /* ── App Init ─────────────────────────────────────────────────── */

  function init() {
    initSidebar();
    initThemeToggle();
    initLanguageToggle();
    initDateDisplay();
    AssessmentModule.initFormInteractions();
    DietPlanner.init();
    FoodDB.init();
    SavedDiets.init();
    registerSW();
    navigate("dashboard");
    console.info("[SehatMand Bachay] Application ready.");
  }

  /* ── Public API ──────────────────────────────────────────────── */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  return {
    navigate, showToast,
    setPatientContext, getPatientContext,
    addSavedRecord, updateDashboardStats
  };

})();


