/* ═══════════════════════════════════════════════════════════════
   diet-planner.js
   Diet chart builder — food selection, macro tracking,
   save/export, and real-time suggestions.
═══════════════════════════════════════════════════════════════ */

const DietPlanner = (() => {

  /* ── State ────────────────────────────────────────────────── */
  let dietItems    = [];   // { id, food, amount, meal }
  let targets      = { kcalTarget: 0, protMax: 0, fatMax: 0, carbG: 0 };
  let phase        = "Rehabilitation";
  let classification = "";
  let selectedFoodId = null;
  let currentFilter  = "all";
  let currentSearch  = "";

  /* ── Initialise ───────────────────────────────────────────── */

  function init() {
    renderFoodLibrary();
    setupCategoryTabs();
    loadPatientContext();
    updateSummary();
  }

  /* ── Load Patient from Assessment ────────────────────────── */

  function loadPatientContext() {
    const ctx = AppController.getPatientContext();
    if (!ctx) return;

    const nameEl  = document.getElementById("planner-name");
    const classEl = document.getElementById("planner-class");
    const targEl  = document.getElementById("planner-target");
    const chipEl  = document.getElementById("planner-class-chip");

    if (nameEl) nameEl.textContent = ctx.name || "Unnamed Patient";

    if (ctx.result) {
      targets        = ctx.result.requirements;
      phase          = ctx.result.phase;
      classification = ctx.result.classification;

      if (classEl) classEl.textContent = `${ctx.result.classification} — ${ctx.result.phase}`;
      if (targEl)  targEl.textContent  = targets.kcalTarget;

      // Color the chip
      if (chipEl) {
        chipEl.style.background = ctx.result.classification === "SAM"
          ? "var(--danger-light)" : ctx.result.classification === "MAM"
          ? "var(--warning-light)" : "var(--success-light)";
      }
    }

    // Update progress bar labels
    updateTargetLabels();
  }

  function updateTargetLabels() {
    const el = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
    el("cal-target-lbl",  targets.kcalTarget ? `${targets.kcalTarget} kcal` : "No target set");
    el("prot-target-lbl", targets.protMax    ? `${targets.protMin}–${targets.protMax}g` : "—");
    el("fat-target-lbl",  targets.fatMax     ? `${targets.fatMin}–${targets.fatMax}g`   : "—");
  }

  /* ── Category Tabs ────────────────────────────────────────── */

  function setupCategoryTabs() {
    const tabs = document.getElementById("cat-tabs");
    if (!tabs) return;
    tabs.addEventListener("click", e => {
      const btn = e.target.closest(".cat-tab");
      if (!btn) return;
      document.querySelectorAll(".cat-tab").forEach(t => t.classList.remove("active"));
      btn.classList.add("active");
      currentFilter = btn.dataset.cat;
      renderFoodLibrary();
    });
  }

  /* ── Food Library Rendering ───────────────────────────────── */

  function renderFoodLibrary() {
    const grid = document.getElementById("food-grid");
    if (!grid) return;

    const all   = FoodDB.getAllFoods();
    const term  = currentSearch.toLowerCase();

    const foods = all.filter(f => {
      const catOk  = currentFilter === "all" || f.category === currentFilter;
      const termOk = !term || f.name.toLowerCase().includes(term) || (f.nameUrdu || "").includes(term);
      return catOk && termOk;
    });

    if (!foods.length) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;padding:20px;"><i class="fas fa-search"></i><p>No foods found</p></div>`;
      return;
    }

    grid.innerHTML = foods.map(f => `
      <div class="food-card" onclick="DietPlanner.openAddModal('${f.id}')" title="${escHtml(f.name)}">
        <div class="food-emoji">${f.emoji || "🍽️"}</div>
        <div class="food-name">${escHtml(f.name)}</div>
        <div class="food-kcal">${f.per100g.calories} kcal/100g</div>
        <div class="food-cost ${f.cost === 'medium' ? 'medium' : ''}">${f.cost === "low" ? "₨Low" : f.cost === "medium" ? "₨Mid" : "₨"}</div>
      </div>`
    ).join("");
  }

  function refreshFoodLibrary() {
    renderFoodLibrary();
  }

  function filterFoods(term) {
    currentSearch = term;
    renderFoodLibrary();
  }

  /* ── Add-to-Diet Modal ────────────────────────────────────── */

  function openAddModal(foodId, e) {
    if (e) e.stopPropagation();
    const food = FoodDB.getFoodById(foodId);
    if (!food) return;
    selectedFoodId = foodId;

    document.getElementById("add-diet-preview").innerHTML = `
      <span class="fap-emoji">${food.emoji || "🍽️"}</span>
      <div>
        <div class="fap-name">${escHtml(food.name)}</div>
        <div class="fap-meta">${food.per100g.calories} kcal · ${food.per100g.protein}g protein · ${food.per100g.fat}g fat per 100g</div>
      </div>`;

    document.getElementById("diet-amount").value = 100;
    previewNutrition();
    document.getElementById("modal-add-diet").style.display = "flex";
    setTimeout(() => document.getElementById("diet-amount").select(), 100);
  }

  function closeAddModal(e) {
    if (e && e.target !== document.getElementById("modal-add-diet") && e.type === "click") return;
    document.getElementById("modal-add-diet").style.display = "none";
    selectedFoodId = null;
  }

  function setAmount(grams) {
    document.getElementById("diet-amount").value = grams;
    previewNutrition();
  }

  function previewNutrition() {
    const food   = FoodDB.getFoodById(selectedFoodId);
    if (!food) return;
    const amount = parseFloat(document.getElementById("diet-amount").value) || 0;
    const factor = amount / 100;
    const cal    = Math.round(food.per100g.calories * factor);
    const prot   = (food.per100g.protein * factor).toFixed(1);
    const fat    = (food.per100g.fat     * factor).toFixed(1);
    const carb   = (food.per100g.carbs   * factor).toFixed(1);

    document.getElementById("diet-nutrition-preview").innerHTML = `
      <div class="np-item"><div class="np-val">${cal}</div><div class="np-lbl">kcal</div></div>
      <div class="np-item"><div class="np-val">${prot}g</div><div class="np-lbl">Protein</div></div>
      <div class="np-item"><div class="np-val">${fat}g</div><div class="np-lbl">Fat</div></div>
      <div class="np-item"><div class="np-val">${carb}g</div><div class="np-lbl">Carbs</div></div>`;
  }

  function confirmAdd() {
    const food   = FoodDB.getFoodById(selectedFoodId);
    if (!food) return;
    const amount = parseFloat(document.getElementById("diet-amount").value);
    const meal   = document.getElementById("diet-meal").value;
    if (!amount || amount <= 0) {
      AppController.showToast("Enter a valid amount", "error"); return;
    }

    dietItems.push({ uid: Date.now(), foodId: selectedFoodId, food, amount, meal });
    document.getElementById("modal-add-diet").style.display = "none";
    selectedFoodId = null;
    renderDietChart();
    updateSummary();
    AppController.showToast(`${food.name} added to diet`, "success");
  }

  /* ── Diet Chart Rendering ─────────────────────────────────── */

  function renderDietChart() {
    const container = document.getElementById("diet-chart-items");
    if (!container) return;

    if (!dietItems.length) {
      container.innerHTML = `<div class="empty-state"><i class="fas fa-utensils fa-2x"></i><p>Tap food cards to add them to the diet chart</p></div>`;
      return;
    }

    // Group by meal
    const byMeal = {};
    dietItems.forEach(item => {
      if (!byMeal[item.meal]) byMeal[item.meal] = [];
      byMeal[item.meal].push(item);
    });

    let html = "";
    Object.entries(byMeal).forEach(([meal, items]) => {
      const mealKcal = items.reduce((s, i) => s + (i.food.per100g.calories * i.amount / 100), 0);
      html += `<div class="meal-group" style="margin-bottom:16px;">
        <div style="font-size:.8rem;font-weight:700;color:var(--primary);margin-bottom:6px;text-transform:uppercase;letter-spacing:.5px;">
          <i class="fas fa-clock"></i> ${escHtml(meal)} — ${Math.round(mealKcal)} kcal
        </div>`;
      items.forEach(item => {
        const factor = item.amount / 100;
        const cal    = Math.round(item.food.per100g.calories * factor);
        const prot   = (item.food.per100g.protein * factor).toFixed(1);
        const fat    = (item.food.per100g.fat     * factor).toFixed(1);
        html += `<div class="diet-item">
          <span class="di-emoji">${item.food.emoji || "🍽️"}</span>
          <div class="di-info">
            <div class="di-name">${escHtml(item.food.name)}</div>
            <div class="di-macros">${item.amount}g · ${prot}g protein · ${fat}g fat</div>
          </div>
          <span class="di-kcal">${cal} kcal</span>
          <button class="di-remove" onclick="DietPlanner.removeItem(${item.uid})" title="Remove">
            <i class="fas fa-times"></i>
          </button>
        </div>`;
      });
      html += "</div>";
    });

    container.innerHTML = html;
  }

  function removeItem(uid) {
    dietItems = dietItems.filter(i => i.uid !== uid);
    renderDietChart();
    updateSummary();
  }

  function clearAll() {
    if (dietItems.length && !confirm("Clear all items from the diet chart?")) return;
    dietItems = [];
    renderDietChart();
    updateSummary();
  }

  /* ── Nutrition Summary Update ─────────────────────────────── */

  function updateSummary() {
    const totals = calcTotals();

    // Update values
    setText("cal-val",  `${Math.round(totals.calories)} kcal`);
    setText("prot-val", `${totals.protein.toFixed(1)} g`);
    setText("fat-val",  `${totals.fat.toFixed(1)} g`);
    setText("carb-val", `${totals.carbs.toFixed(1)} g`);

    // Update progress bars
    const calPct  = targets.kcalTarget ? Math.min((totals.calories / targets.kcalTarget) * 100, 120) : 0;
    const protPct = targets.protMax    ? Math.min((totals.protein  / targets.protMax)    * 100, 120) : 0;
    const fatPct  = targets.fatMax     ? Math.min((totals.fat      / targets.fatMax)     * 100, 120) : 0;
    const carbPct = targets.carbG      ? Math.min((totals.carbs    / targets.carbG)      * 100, 120) : 0;

    setBar("cal-prog",  calPct);
    setBar("prot-prog", protPct);
    setBar("fat-prog",  fatPct);
    setBar("carb-prog", carbPct);

    // Status bar
    const statusBar = document.getElementById("intake-status-bar");
    if (statusBar && targets.kcalTarget && totals.calories > 0) {
      const pct = totals.calories / targets.kcalTarget;
      if      (pct < 0.7)  { statusBar.className = "low";  statusBar.textContent = `⚠ Intake ${Math.round(pct*100)}% of target — increase calories`; }
      else if (pct > 1.2)  { statusBar.className = "high"; statusBar.textContent = `⚠ Intake ${Math.round(pct*100)}% of target — may be too high for SAM`; }
      else                  { statusBar.className = "ok";   statusBar.textContent = `✓ Calorie intake within target range (${Math.round(pct*100)}%)`; }
    } else if (statusBar) {
      statusBar.className = "";
      statusBar.textContent = "";
    }

    // Update suggestions
    SuggestionsEngine.render(totals, targets, phase, classification);
  }

  function calcTotals() {
    const categories = new Set();
    const result = dietItems.reduce((acc, item) => {
      const f = item.food.per100g;
      const x = item.amount / 100;
      acc.calories += f.calories * x;
      acc.protein  += f.protein  * x;
      acc.fat      += f.fat      * x;
      acc.carbs    += (f.carbs || 0) * x;
      categories.add(item.food.category);
      return acc;
    }, { calories: 0, protein: 0, fat: 0, carbs: 0 });
    result._foodCategories = categories;
    return result;
  }

  /* ── Save Diet ─────────────────────────────────────────────── */

  async function saveDiet() {
    if (!dietItems.length) {
      AppController.showToast("Diet chart is empty", "error"); return;
    }
    const totals = calcTotals();
    const ctx    = AppController.getPatientContext();

    const record = {
      patientName:   ctx?.name || "Unnamed",
      classification: classification || "Unknown",
      phase,
      targets,
      items: dietItems.map(i => ({
        foodId:   i.foodId,
        foodName: i.food.name,
        amount:   i.amount,
        meal:     i.meal,
        calories: Math.round(i.food.per100g.calories * i.amount / 100)
      })),
      totals: {
        calories: Math.round(totals.calories),
        protein:  parseFloat(totals.protein.toFixed(1)),
        fat:      parseFloat(totals.fat.toFixed(1)),
        carbs:    parseFloat(totals.carbs.toFixed(1))
      },
      date: new Date().toLocaleDateString("en-PK"),
      timestamp: Date.now()
    };

    try {
      const id = await dbSave("diets", record);
      // Also push into the patient context for immediately showing
      AppController.addSavedRecord({ id, ...record, type: "diet" });
      AppController.showToast("Diet plan saved successfully!", "success");
      AppController.updateDashboardStats();
    } catch (err) {
      AppController.showToast("Error saving diet: " + err.message, "error");
    }
  }

  /* ── Export PDF ────────────────────────────────────────────── */

  function exportPDF() {
    if (!dietItems.length) {
      AppController.showToast("Add foods to diet chart first", "error"); return;
    }
    const ctx    = AppController.getPatientContext();
    const totals = calcTotals();
    PDFExport.generate(ctx, dietItems, totals, targets, phase, classification);
  }

  /* ── Print Urdu ────────────────────────────────────────────── */

  function printUrdu() {
    if (!dietItems.length) {
      AppController.showToast("Add foods to diet chart first", "error"); return;
    }
    const ctx    = AppController.getPatientContext();
    const totals = calcTotals();
    PDFExport.buildPrintSection(ctx, dietItems, totals, targets, phase, classification);
    window.print();
  }

  /* ── Public getDietData (for PDF) ─────────────────────────── */

  function getDietData() { return { dietItems, totals: calcTotals(), targets, phase, classification }; }

  /* ── Helpers ───────────────────────────────────────────────── */

  function setText(id, val) { const e = document.getElementById(id); if (e) e.textContent = val; }
  function setBar(id, pct)  {
    const e = document.getElementById(id);
    if (e) {
      e.style.width = Math.min(pct, 100) + "%";
      // Turn bar red if > 115%
      if (pct > 115) e.style.background = "var(--danger)";
    }
  }

  /* ── Public API ────────────────────────────────────────────── */
  return {
    init,
    loadPatientContext,
    renderFoodLibrary,
    refreshFoodLibrary,
    filterFoods,
    openAddModal,
    closeAddModal,
    setAmount,
    previewNutrition,
    confirmAdd,
    removeItem,
    clearAll,
    saveDiet,
    exportPDF,
    printUrdu,
    getDietData
  };

})();
