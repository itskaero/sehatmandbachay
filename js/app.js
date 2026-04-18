/* ═══════════════════════════════════════════════════════════════
   app.js
   Main application controller — navigation, global state,
   assessment module, saved diets/patients, F-75 module,
   hospital auth integration, and trend charts.
═══════════════════════════════════════════════════════════════ */

/* ── Global Utility ─────────────────────────────────────────── */

function escHtml(str) {
  if (typeof str !== "string") return String(str ?? "");
  return str.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

/** Generate a stable patientId from name + hospitalId */
function makePatientId(name, hospitalId) {
  const key = (hospitalId || "local") + "|" + name.trim().toLowerCase();
  let h = 5381;
  for (let i = 0; i < key.length; i++) {
    h = ((h << 5) + h) + key.charCodeAt(i);
    h = h & 0xFFFFFFFF;
  }
  return "pt_" + (h >>> 0).toString(16);
}

/* ═══════════════════════════════════════════════════════════════
   AssessmentModule
═══════════════════════════════════════════════════════════════ */

const AssessmentModule = (() => {

  let lastResult = null;

  function updateMuacIndicator(val) {
    const wrapper = document.getElementById("muac-band-wrapper");
    const pointer = document.getElementById("muac-pointer");
    const muac = parseFloat(val);
    if (!wrapper || !pointer || isNaN(muac)) {
      if (wrapper) wrapper.style.display = "none";
      return;
    }
    wrapper.style.display = "block";
    const pct = Math.min(Math.max(((muac - 9) / (15 - 9)) * 100, 0), 100);
    pointer.style.left = pct + "%";
  }

  function initFormInteractions() {
    document.getElementById("appetite-row")?.addEventListener("click", e => {
      const btn = e.target.closest(".appetite-btn");
      if (!btn) return;
      document.querySelectorAll(".appetite-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
    });
  }

  function classify() {
    const ageVal    = parseFloat(document.getElementById("child-age").value);
    const ageUnit   = document.getElementById("age-unit").value;
    const weight    = parseFloat(document.getElementById("child-weight").value);
    const muacVal   = document.getElementById("child-muac").value;
    const height    = document.getElementById("child-height").value;
    const sex       = document.getElementById("child-sex")?.value || "";
    const edema     = document.querySelector('input[name="edema"]:checked')?.value || "no";
    const appetite  = document.querySelector(".appetite-btn.active")?.dataset.value || "good";

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

    const symptoms = [];
    if (document.getElementById("sym-diarrhea")?.checked)    symptoms.push("diarrhea");
    if (document.getElementById("sym-fever")?.checked)        symptoms.push("fever");
    if (document.getElementById("sym-vomiting")?.checked)     symptoms.push("vomiting");
    if (document.getElementById("sym-respiratory")?.checked)  symptoms.push("respiratory");

    const result = NutritionCalc.classify({
      ageMonths, weight, muac, height: heightNum, sex, edema, appetite, symptoms
    });

    lastResult = result;

    AppController.setPatientContext({
      name, ageMonths, weight, muac, height: heightNum, sex, edema, appetite, symptoms, result
    });

    renderResults(result, { name, ageMonths, weight, muac });
    AppController.updateDashboardStats();
  }

  function renderResults(result, patient) {
    const container = document.getElementById("assessment-results");
    container.style.display = "flex";

    const badge = document.getElementById("hero-badge");
    badge.className = "hero-badge " + result.classification.toLowerCase();
    badge.textContent = result.classification;

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

    const chipsHtml = result.evidence.map(e => {
      const cls = e.severity === "high" ? "badge red" : e.severity === "medium" ? "badge yellow" : "badge green";
      return `<span class="${cls}">${escHtml(e.text)}</span>`;
    }).join(" ");
    document.getElementById("result-chips").innerHTML = chipsHtml;

    document.getElementById("refeeding-card").style.display =
      result.refeedingRisk ? "block" : "none";

    document.getElementById("phase-result-body").innerHTML =
      buildPhaseResultHTML(result.phase, result.requirements);

    document.getElementById("requirements-body").innerHTML =
      buildRequirementsHTML(result.requirements, patient.weight);

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

  function goToPlanner() {
    AppController.navigate("planner");
    setTimeout(() => DietPlanner.loadPatientContext(), 100);
  }

  function viewF75() {
    AppController.navigate("f75");
  }

  async function saveAssessment() {
    const ctx = AppController.getPatientContext();
    if (!ctx || !ctx.result) {
      AppController.showToast("Complete an assessment first", "error"); return;
    }
    if (!HospitalAuth.canEdit()) {
      AppController.showToast("Staff PIN required to save records", "warning");
      HospitalAuth.openPinModal();
      return;
    }

    const hospCtx   = HospitalAuth.getRecordContext();
    const patientId = makePatientId(ctx.name || "Unnamed", hospCtx.hospitalId);

    const record = {
      type:           "assessment",
      patientId,
      patientName:    ctx.name || "Unnamed",
      ageMonths:      ctx.ageMonths,
      weight:         ctx.weight,
      height:         ctx.height || null,
      muac:           ctx.muac,
      sex:            ctx.sex || "",
      edema:          ctx.edema,
      appetite:       ctx.appetite,
      classification: ctx.result.classification,
      phase:          ctx.result.phase,
      requirements:   ctx.result.requirements,
      date:           new Date().toLocaleDateString("en-PK"),
      timestamp:      Date.now(),
      ...hospCtx
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
   TrendChart — Growth trend rendering using Chart.js
═══════════════════════════════════════════════════════════════ */

const TrendChart = (() => {

  let weightChart = null;
  let muacChart   = null;

  function destroy() {
    if (weightChart) { weightChart.destroy(); weightChart = null; }
    if (muacChart)   { muacChart.destroy();   muacChart   = null; }
  }

  function render(assessments) {
    destroy();
    if (!assessments || assessments.length < 1) return;

    // Sort by timestamp ascending
    const sorted = [...assessments].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

    const labels  = sorted.map(r => r.date || new Date(r.timestamp).toLocaleDateString("en-PK"));
    const weights = sorted.map(r => r.weight || null);
    const muacs   = sorted.map(r => r.muac   || null);

    const weightCtx = document.getElementById("trend-weight-chart");
    const muacCtx   = document.getElementById("trend-muac-chart");

    const gridColor = "rgba(128,128,128,0.15)";
    const font      = { family: "Inter, sans-serif", size: 11 };

    if (weightCtx && weights.some(v => v !== null)) {
      weightChart = new Chart(weightCtx, {
        type: "line",
        data: {
          labels,
          datasets: [{
            label: "Weight (kg)",
            data: weights,
            borderColor: "#1a7f5a",
            backgroundColor: "rgba(26,127,90,0.12)",
            borderWidth: 2.5,
            pointRadius: 5,
            pointHoverRadius: 7,
            fill: true,
            tension: 0.3
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { display: false },
            tooltip: { callbacks: {
              label: ctx => ` ${ctx.parsed.y} kg`
            }}
          },
          scales: {
            x: { grid: { color: gridColor }, ticks: { font } },
            y: {
              grid: { color: gridColor },
              ticks: { font, callback: v => v + " kg" },
              title: { display: true, text: "Weight (kg)", font }
            }
          }
        }
      });
    }

    if (muacCtx && muacs.some(v => v !== null)) {
      muacChart = new Chart(muacCtx, {
        type: "line",
        data: {
          labels,
          datasets: [
            {
              label: "MUAC (cm)",
              data: muacs,
              borderColor: "#d97706",
              backgroundColor: "rgba(217,119,6,0.10)",
              borderWidth: 2.5,
              pointRadius: 5,
              pointHoverRadius: 7,
              fill: true,
              tension: 0.3
            },
            // SAM threshold reference line
            {
              label: "SAM threshold (11.5)",
              data: labels.map(() => 11.5),
              borderColor: "#ef4444",
              borderWidth: 1.5,
              borderDash: [5, 4],
              pointRadius: 0,
              fill: false
            },
            // MAM threshold reference line
            {
              label: "MAM threshold (12.5)",
              data: labels.map(() => 12.5),
              borderColor: "#f59e0b",
              borderWidth: 1.5,
              borderDash: [5, 4],
              pointRadius: 0,
              fill: false
            }
          ]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { position: "bottom", labels: { font, boxWidth: 14 } },
            tooltip: { callbacks: {
              label: ctx => ` ${ctx.parsed.y} cm`
            }}
          },
          scales: {
            x: { grid: { color: gridColor }, ticks: { font } },
            y: {
              grid: { color: gridColor },
              ticks: { font, callback: v => v + " cm" },
              title: { display: true, text: "MUAC (cm)", font },
              min: 9, max: 16
            }
          }
        }
      });
    }
  }

  return { render, destroy };

})();

/* ═══════════════════════════════════════════════════════════════
   PatientRecordModal — Full patient detail view with trend chart
═══════════════════════════════════════════════════════════════ */

const PatientRecordModal = (() => {

  let currentPatientId   = null;
  let currentAssessments = [];
  let currentDiets       = [];
  let allRecords         = [];

  function open(patientId, records) {
    currentPatientId   = patientId;
    allRecords         = records;

    const matchPid = r => {
      const rp = r.patientId || ("legacy_" + (r.patientName||"?").toLowerCase().replace(/\s+/g,"_"));
      return rp === patientId;
    };

    currentAssessments = records.filter(r => matchPid(r) && r.type === "assessment")
                                .sort((a,b) => (a.timestamp||0) - (b.timestamp||0));
    currentDiets       = records.filter(r => matchPid(r) && r.type === "diet")
                                .sort((a,b) => (a.timestamp||0) - (b.timestamp||0));

    if (!currentAssessments.length && !currentDiets.length) return;

    const modal = document.getElementById("modal-patient-record");
    if (!modal) return;

    const latest = currentAssessments[currentAssessments.length - 1] ||
                   currentDiets[currentDiets.length - 1];
    const name   = latest.patientName || "Unnamed";
    const cls    = latest.classification || "—";

    document.getElementById("pr-patient-name").textContent = name;
    document.getElementById("pr-hospital").textContent =
      (latest.hospitalName ? `${latest.hospitalName}` : "") +
      (latest.location ? `, ${latest.location}` : "");

    const clsBadge = cls === "SAM" ? "red" : cls === "MAM" ? "yellow" : "green";
    document.getElementById("pr-class-badge").className = `badge ${clsBadge}`;
    document.getElementById("pr-class-badge").textContent = cls;

    renderTimeline();
    renderDiets();
    modal.style.display = "flex";

    // Render chart after modal is visible
    setTimeout(() => TrendChart.render(currentAssessments), 100);
  }

  function close() {
    TrendChart.destroy();
    const modal = document.getElementById("modal-patient-record");
    if (modal) modal.style.display = "none";
    currentPatientId = null;
    currentAssessments = [];
    currentDiets = [];
  }

  function renderTimeline() {
    const container = document.getElementById("pr-timeline");
    if (!container) return;

    if (!currentAssessments.length) {
      container.innerHTML = `<div class="empty-state"><i class="fas fa-clipboard-list"></i><p>No assessments recorded</p></div>`;
      return;
    }

    const canEdit = HospitalAuth.canEdit();

    container.innerHTML = currentAssessments.map((r, idx) => {
      const cls = r.classification || "Normal";
      const clsBadge = cls === "SAM" ? "red" : cls === "MAM" ? "yellow" : "green";
      return `
        <div class="timeline-entry" style="--idx:${idx}">
          <div class="tl-dot ${cls.toLowerCase()}"></div>
          <div class="tl-body">
            <div class="tl-header">
              <span class="badge ${clsBadge}">${cls}</span>
              <span class="tl-date">${r.date || ""}</span>
              ${canEdit ? `<button class="btn btn-xs btn-danger staff-only" onclick="PatientRecordModal.deleteRecord('${r.id}','assessments')">
                <i class="fas fa-trash"></i>
              </button>` : ""}
            </div>
            <div class="tl-metrics">
              ${r.weight  ? `<span><i class="fas fa-weight"></i> ${r.weight} kg</span>` : ""}
              ${r.height  ? `<span><i class="fas fa-ruler-vertical"></i> ${r.height} cm</span>` : ""}
              ${r.muac    ? `<span><i class="fas fa-circle-notch"></i> MUAC ${r.muac} cm</span>` : ""}
              ${r.ageMonths ? `<span><i class="fas fa-baby"></i> ${NutritionCalc.formatAge(r.ageMonths)}</span>` : ""}
            </div>
            <div style="font-size:.75rem;color:var(--text-2);margin-top:4px;">${r.phase || ""}</div>
            ${canEdit ? `
            <div class="tl-edit-row staff-only" style="margin-top:8px;">
              <button class="btn btn-xs btn-outline" onclick="PatientRecordModal.editMeasurement('${r.id}')">
                <i class="fas fa-edit"></i> Edit
              </button>
            </div>` : ""}
          </div>
        </div>`;
    }).join("");

    // Add new measurement button
    if (canEdit) {
      container.innerHTML += `
        <div class="tl-add staff-only">
          <button class="btn btn-sm btn-primary" onclick="PatientRecordModal.openAddMeasurement()">
            <i class="fas fa-plus"></i> Add Measurement
          </button>
        </div>`;
    } else {
      container.innerHTML += `<div class="view-only-msg" style="font-size:.78rem;color:var(--text-2);padding:8px 0;">
        <i class="fas fa-lock"></i> Enter staff PIN to add or edit records
      </div>`;
    }
  }

  function renderDiets() {
    const container = document.getElementById("pr-diets");
    if (!container) return;
    const canEdit = HospitalAuth.canEdit();

    if (!currentDiets.length) {
      container.innerHTML = `<div class="empty-state" style="padding:12px;"><i class="fas fa-utensils"></i><p>No diet plans saved</p></div>`;
      if (canEdit) {
        container.innerHTML += `<div class="staff-only" style="padding-top:4px;">
          <button class="btn btn-sm btn-primary" onclick="PatientRecordModal.goToPlanner()">
            <i class="fas fa-plus"></i> Create Diet Plan
          </button>
        </div>`;
      }
      return;
    }

    container.innerHTML = currentDiets.map(d => `
      <div class="diet-record-item">
        <div class="diet-rec-header">
          <span class="badge ${d.classification==="SAM"?"red":d.classification==="MAM"?"yellow":"green"}">${d.classification||"—"}</span>
          <span style="font-size:.77rem;color:var(--text-2);">${d.date||""}</span>
          ${canEdit ? `<div class="staff-only" style="margin-left:auto;display:flex;gap:4px;">
            <button class="btn btn-xs btn-outline" onclick="PatientRecordModal.editDiet('${d.id}')"><i class="fas fa-edit"></i></button>
            <button class="btn btn-xs btn-danger" onclick="PatientRecordModal.deleteRecord('${d.id}','diets')"><i class="fas fa-trash"></i></button>
          </div>` : ""}
        </div>
        <div style="font-size:.8rem;margin-top:6px;">
          <strong>${d.phase||""}</strong>
          ${d.totals ? ` — ${d.totals.calories} kcal · ${d.totals.protein}g prot · ${d.totals.fat}g fat` : ""}
        </div>
        ${d.items && d.items.length ? `<div style="font-size:.75rem;color:var(--text-2);margin-top:4px;">
          ${d.items.slice(0,4).map(i => escHtml(i.foodName)).join(", ")}${d.items.length>4?" …":""}
        </div>` : ""}
      </div>`).join("");

    if (canEdit) {
      container.innerHTML += `<div class="staff-only" style="margin-top:8px;">
        <button class="btn btn-sm btn-primary" onclick="PatientRecordModal.goToPlanner()">
          <i class="fas fa-plus"></i> Add Diet Plan
        </button>
      </div>`;
    }
  }

  function goToPlanner() {
    close();
    AppController.navigate("planner");
  }

  async function deleteRecord(id, collection) {
    if (!HospitalAuth.canEdit()) {
      AppController.showToast("Staff PIN required", "warning"); return;
    }
    if (!confirm("Delete this record?")) return;
    try {
      await dbDelete(collection, id);
      SavedDiets.removeById(id);
      // Update current lists
      currentAssessments = currentAssessments.filter(r => r.id !== id);
      currentDiets       = currentDiets.filter(r => r.id !== id);
      allRecords         = allRecords.filter(r => r.id !== id);
      renderTimeline();
      renderDiets();
      TrendChart.render(currentAssessments);
      AppController.updateDashboardStats();
      AppController.showToast("Deleted", "info");
    } catch(e) {
      AppController.showToast("Delete failed: " + e.message, "error");
    }
  }

  /* ─── Add / Edit measurement ─── */

  let editingId = null;

  function openAddMeasurement(prefillId) {
    if (!HospitalAuth.canEdit()) {
      AppController.showToast("Staff PIN required", "warning");
      HospitalAuth.openPinModal(); return;
    }
    editingId = prefillId || null;

    const modal = document.getElementById("modal-add-measurement");
    if (!modal) return;

    if (prefillId) {
      const rec = currentAssessments.find(r => r.id === prefillId);
      if (rec) {
        document.getElementById("meas-weight").value = rec.weight || "";
        document.getElementById("meas-height").value = rec.height || "";
        document.getElementById("meas-muac").value   = rec.muac   || "";
        document.getElementById("meas-age").value    = rec.ageMonths || "";
      }
      document.getElementById("modal-add-measurement-title").textContent = "Edit Measurement";
    } else {
      document.getElementById("meas-weight").value = "";
      document.getElementById("meas-height").value = "";
      document.getElementById("meas-muac").value   = "";
      document.getElementById("meas-age").value    = "";
      document.getElementById("modal-add-measurement-title").textContent = "Add Measurement";
    }

    modal.style.display = "flex";
  }

  function editMeasurement(id) { openAddMeasurement(id); }

  function closeAddMeasurement() {
    document.getElementById("modal-add-measurement").style.display = "none";
    editingId = null;
  }

  async function saveAddMeasurement() {
    if (!HospitalAuth.canEdit()) return;

    const weight    = parseFloat(document.getElementById("meas-weight").value) || null;
    const height    = parseFloat(document.getElementById("meas-height").value) || null;
    const muac      = parseFloat(document.getElementById("meas-muac").value)   || null;
    const ageMonths = parseInt(document.getElementById("meas-age").value)      || null;

    if (!weight) { AppController.showToast("Weight is required", "error"); return; }

    const latest = currentAssessments[currentAssessments.length - 1] || currentDiets[0];
    const sex    = latest?.sex || "";

    // Reclassify
    const result = NutritionCalc.classify({
      ageMonths: ageMonths || (latest?.ageMonths || 0),
      weight, height, muac, sex,
      edema: "no", appetite: "good", symptoms: []
    });

    const hospCtx   = HospitalAuth.getRecordContext();
    const patientId = currentPatientId;

    if (editingId) {
      const updates = {
        weight, height, muac, ageMonths,
        classification: result.classification,
        phase:          result.phase,
        requirements:   result.requirements,
        date:           new Date().toLocaleDateString("en-PK"),
        timestamp:      Date.now()
      };
      try {
        await dbUpdate("assessments", editingId, updates);
        const idx = currentAssessments.findIndex(r => r.id === editingId);
        if (idx !== -1) {
          currentAssessments[idx] = { ...currentAssessments[idx], ...updates };
          SavedDiets.updateById(editingId, updates);
        }
        AppController.showToast("Measurement updated", "success");
      } catch(e) { AppController.showToast("Save failed: " + e.message, "error"); return; }
    } else {
      const record = {
        type: "assessment",
        patientId,
        patientName: latest?.patientName || "Unnamed",
        weight, height, muac,
        ageMonths: ageMonths || (latest?.ageMonths || 0),
        sex,
        edema: "no", appetite: "good",
        classification: result.classification,
        phase:          result.phase,
        requirements:   result.requirements,
        date:           new Date().toLocaleDateString("en-PK"),
        timestamp:      Date.now(),
        ...hospCtx
      };
      try {
        const id = await dbSave("assessments", record);
        const newRec = { id, ...record };
        currentAssessments.push(newRec);
        currentAssessments.sort((a,b) => (a.timestamp||0)-(b.timestamp||0));
        SavedDiets.addRecord(newRec);
        AppController.updateDashboardStats();
        AppController.showToast("Measurement saved", "success");
      } catch(e) { AppController.showToast("Save failed: " + e.message, "error"); return; }
    }

    closeAddMeasurement();
    renderTimeline();
    TrendChart.render(currentAssessments);
  }

  /* ─── Edit diet (redirect to planner with that diet loaded) ─── */
  function editDiet(id) {
    if (!HospitalAuth.canEdit()) {
      AppController.showToast("Staff PIN required", "warning");
      HospitalAuth.openPinModal(); return;
    }
    const diet = currentDiets.find(d => d.id === id);
    if (!diet) return;
    close();
    DietPlanner.loadSavedDiet(diet);
    AppController.navigate("planner");
  }

  return {
    open, close, renderTimeline, renderDiets,
    goToPlanner, deleteRecord,
    openAddMeasurement, editMeasurement, closeAddMeasurement, saveAddMeasurement,
    editDiet
  };

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

    // Group by patientId
    const patientMap = new Map();
    for (const r of records) {
      const pid = r.patientId || ("legacy_" + (r.patientName||"?").toLowerCase().replace(/\s+/g,"_"));
      if (!patientMap.has(pid)) patientMap.set(pid, { pid, records: [] });
      patientMap.get(pid).records.push(r);
    }

    const hospitalId = HospitalAuth.getHospital()?.id;
    const hosp = HospitalAuth.getHospital();

    let html = "";
    for (const [pid, { records: precs }] of patientMap) {
      // Filter to current hospital if set
      if (hospitalId) {
        const hasHosp = precs.some(r => r.hospitalId === hospitalId || !r.hospitalId);
        if (!hasHosp) continue;
      }

      const latest = precs.sort((a,b) => (b.timestamp||0)-(a.timestamp||0))[0];
      const cls    = latest.classification || "Normal";
      const clsBadge = cls === "SAM" ? "red" : cls === "MAM" ? "yellow" : "green";
      const initial  = (latest.patientName || "?")[0].toUpperCase();
      const assessCount = precs.filter(r => r.type === "assessment").length;
      const dietCount   = precs.filter(r => r.type !== "assessment").length;

      html += `
        <div class="saved-record patient-group" onclick="PatientRecordModal.open('${pid}', SavedDiets.getAll())">
          <div class="saved-avatar" style="background:${cls==="SAM"?"#fee2e2":cls==="MAM"?"#fef3c7":"#f0fdf4"};color:${cls==="SAM"?"#991b1b":cls==="MAM"?"#92400e":"#166534"};">${initial}</div>
          <div class="saved-info">
            <div class="saved-name">${escHtml(latest.patientName || "Unnamed")}</div>
            <div class="saved-meta">
              <span class="badge ${clsBadge}">${cls}</span>
              &nbsp;${escHtml(latest.phase||"")} &nbsp;·&nbsp;
              <i class="fas fa-clipboard-check"></i> ${assessCount} &nbsp;·&nbsp;
              <i class="fas fa-utensils"></i> ${dietCount} &nbsp;·&nbsp;
              ${escHtml(latest.date||"")}
            </div>
            ${latest.weight ? `<div style="font-size:.78rem;color:var(--text-2);margin-top:3px;">
              Latest: ${latest.weight} kg${latest.height?` · ${latest.height} cm`:""}${latest.muac?` · MUAC ${latest.muac} cm`:""}
            </div>` : ""}
            ${latest.hospitalName ? `<div style="font-size:.73rem;color:var(--text-3);"><i class="fas fa-hospital-alt"></i> ${escHtml(latest.hospitalName)}</div>` : ""}
          </div>
          <div class="saved-actions" onclick="event.stopPropagation()">
            <button class="btn btn-sm btn-outline" onclick="PatientRecordModal.open('${pid}', SavedDiets.getAll())">
              <i class="fas fa-eye"></i> View
            </button>
            <button class="btn btn-sm btn-danger staff-only" onclick="SavedDiets.removePatient('${pid}')">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>`;
    }

    container.innerHTML = html || `<div class="empty-state card-empty">
      <i class="fas fa-hospital-alt fa-2x"></i>
      <p>No records for this hospital yet</p>
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

  function removeById(id) {
    allRecords = allRecords.filter(r => r.id !== id);
    render(allRecords);
    updateDashboard();
  }

  function updateById(id, updates) {
    const idx = allRecords.findIndex(r => r.id === id);
    if (idx !== -1) allRecords[idx] = { ...allRecords[idx], ...updates };
    updateDashboard();
  }

  function getAll() { return allRecords; }

  function load(id) {
    const rec = allRecords.find(r => r.id === id);
    if (!rec) return;
    const pid = rec.patientId;
    if (pid) PatientRecordModal.open(pid, allRecords);
  }

  async function removePatient(patientId) {
    if (!HospitalAuth.canEdit()) {
      AppController.showToast("Staff PIN required to delete records", "warning");
      HospitalAuth.openPinModal(); return;
    }
    const recs = allRecords.filter(r => {
      const rpid = r.patientId || ("legacy_" + (r.patientName||"?").toLowerCase().replace(/\s+/g,"_"));
      return rpid === patientId;
    });
    if (!recs.length) return;
    if (!confirm(`Delete all ${recs.length} records for ${recs[0].patientName||"this patient"}?`)) return;
    try {
      for (const r of recs) {
        const col = r.type === "diet" ? "diets" : "assessments";
        await dbDelete(col, r.id);
      }
      allRecords = allRecords.filter(r => {
        const rpid = r.patientId || ("legacy_" + (r.patientName||"?").toLowerCase().replace(/\s+/g,"_"));
        return rpid !== patientId;
      });
      render(allRecords);
      updateDashboard();
      AppController.showToast("Patient records deleted", "info");
    } catch(e) {
      AppController.showToast("Delete failed: " + e.message, "error");
    }
  }

  async function remove(id) {
    if (!HospitalAuth.canEdit()) {
      AppController.showToast("Staff PIN required", "warning");
      HospitalAuth.openPinModal(); return;
    }
    if (!confirm("Delete this record?")) return;
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
    const hospitalId = HospitalAuth.getHospital()?.id;
    const filtered   = hospitalId
      ? allRecords.filter(r => r.hospitalId === hospitalId || !r.hospitalId)
      : allRecords;

    const total = filtered.length;
    const sam   = filtered.filter(r => r.classification === "SAM").length;
    const mam   = filtered.filter(r => r.classification === "MAM").length;
    const diets = filtered.filter(r => r.type === "diet").length;

    const s = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
    s("stat-total", total); s("stat-sam", sam); s("stat-mam", mam); s("stat-diets", diets);

    const recent = filtered.slice(0, 5);
    const recentEl = document.getElementById("recent-assessments-list");
    if (recentEl) {
      if (!recent.length) {
        recentEl.innerHTML = `<div class="empty-state"><i class="fas fa-clipboard-list"></i><p>No assessments yet</p></div>`;
      } else {
        recentEl.innerHTML = recent.map(r => {
          const cls      = r.classification || "Normal";
          const clsBadge = cls === "SAM" ? "red" : cls === "MAM" ? "yellow" : "green";
          const initial  = (r.patientName || "?")[0].toUpperCase();
          const pid      = r.patientId || ("legacy_" + (r.patientName||"?").toLowerCase().replace(/\s+/g,"_"));
          return `<div class="recent-row" onclick="PatientRecordModal.open('${pid}', SavedDiets.getAll())">
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

  return { init, load, remove, removePatient, removeById, updateById, search, addRecord, getAll, updateDashboard };

})();

/* ═══════════════════════════════════════════════════════════════
   AppController — Main Application Controller
═══════════════════════════════════════════════════════════════ */

const AppController = (() => {

  let patientContext = null;
  let currentView    = "dashboard";
  let isUrdu         = false;

  const VIEW_TITLES = {
    dashboard:  "Dashboard",
    assessment: "Child Assessment",
    planner:    "Diet Planner",
    fooddb:     "Food Database",
    saved:      "Patient Records",
    f75:        "F-75 / F-100 Module"
  };

  function navigate(viewId) {
    document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
    document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));

    const target = document.getElementById("view-" + viewId);
    if (target) target.classList.add("active");

    const navItem = document.querySelector(`[data-view="${viewId}"]`);
    if (navItem) navItem.classList.add("active");

    const titleEl = document.getElementById("page-title");
    if (titleEl) titleEl.textContent = VIEW_TITLES[viewId] || viewId;

    currentView = viewId;

    if (viewId === "planner")    DietPlanner.loadPatientContext();
    if (viewId === "fooddb")     FoodDB.init();
    if (viewId === "saved")      SavedDiets.init();
    if (viewId === "f75")        { F75Module.setupTabs(); F75Module.init(); }

    if (window.innerWidth < 768) {
      document.getElementById("sidebar")?.classList.remove("open");
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function setPatientContext(ctx)  { patientContext = ctx; }
  function getPatientContext()     { return patientContext; }
  function addSavedRecord(record)  { SavedDiets.addRecord(record); }
  function updateDashboardStats()  { SavedDiets.updateDashboard(); }

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

  function initSidebar() {
    const sidebar   = document.getElementById("sidebar");
    const hamburger = document.getElementById("hamburger");

    hamburger?.addEventListener("click", () => {
      if (window.innerWidth < 768) {
        sidebar?.classList.toggle("open");
      } else {
        document.body.classList.toggle("sidebar-collapsed");
        sidebar?.classList.toggle("collapsed");
      }
    });

    document.querySelectorAll(".nav-item").forEach(item => {
      item.addEventListener("click", () => navigate(item.dataset.view));
    });

    document.addEventListener("click", e => {
      if (window.innerWidth < 768 &&
          !sidebar?.contains(e.target) &&
          !hamburger?.contains(e.target) &&
          sidebar?.classList.contains("open")) {
        sidebar.classList.remove("open");
      }
    });
  }

  function initThemeToggle() {
    if (document.documentElement.getAttribute("data-theme") === "dark") {
      var icon = document.getElementById("theme-icon");
      if (icon) { icon.classList.remove("fa-moon"); icon.classList.add("fa-sun"); }
    }
  }

  function initLanguageToggle() {
    // Apply stored language preference on startup via I18n engine
    if (typeof I18n !== "undefined") I18n.init();
  }

  function toggleLang() {
    if (typeof I18n === "undefined") return;
    const next = I18n.currentLang === "ur" ? "en" : "ur";
    I18n.applyLang(next);
    showToast(I18n.t("toast.langChanged"), "info");
  }

  function initDateDisplay() {
    const el = document.getElementById("current-date");
    if (!el) return;
    el.textContent = new Date().toLocaleDateString("en-PK", {
      weekday: "short", year: "numeric", month: "short", day: "numeric"
    });
  }

  function registerSW() {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("sw.js")
        .then(() => console.info("[SW] Registered"))
        .catch(err => console.warn("[SW] Registration failed:", err));
    }
  }

  function init() {
    HospitalAuth.init();
    initSidebar();
    initThemeToggle();
    initLanguageToggle();
    initDateDisplay();
    AssessmentModule.initFormInteractions();
    DietPlanner.init();
    FoodDB.init();
    SavedDiets.init();
    registerSW();

    // Prompt hospital setup on first run
    if (!HospitalAuth.isSetup()) {
      setTimeout(() => HospitalAuth.openSetupModal(), 500);
    }

    navigate("dashboard");
    console.info("[SehatMand Bachay] Application ready.");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  return {
    navigate, showToast, toggleLang,
    setPatientContext, getPatientContext,
    addSavedRecord, updateDashboardStats
  };

})();
