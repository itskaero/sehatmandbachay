/* ═══════════════════════════════════════════════════════════════
   suggestions.js
   Smart suggestions engine — analyses current diet state and
   recommends foods based on deficits, SAM phase, and affordability.
═══════════════════════════════════════════════════════════════ */

const SuggestionsEngine = (() => {

  /**
   * Generate smart suggestions based on current nutrition totals,
   * targets, classification, and available food library.
   *
   * @param {object} totals      { calories, protein, fat, carbs }
   * @param {object} targets     { kcalTarget, protMax, fatMax, carbG }
   * @param {string} phase       "Stabilization"|"Transition"|"Rehabilitation"
   * @param {string} classification "SAM"|"MAM"|"Normal"
   * @returns {Array} Array of suggestion objects
   */
  function generate(totals, targets, phase, classification) {
    const suggestions = [];
    const warnings    = [];
    const allFoods    = FoodDB.getAllFoods();

    const calPct  = targets.kcalTarget > 0 ? (totals.calories / targets.kcalTarget)  : 0;
    const protPct = targets.protMax > 0    ? (totals.protein  / targets.protMax)     : 0;
    const fatPct  = targets.fatMax > 0     ? (totals.fat      / targets.fatMax)      : 0;

    /* ── Calorie Deficit ──────────────────────────────────────── */
    if (calPct < 0.7 && targets.kcalTarget > 0) {
      const deficit = Math.round(targets.kcalTarget - totals.calories);
      const highCalFoods = allFoods
        .filter(f => f.per100g.calories > 200 && f.cost !== "high")
        .sort((a, b) => b.per100g.calories - a.per100g.calories)
        .slice(0, 3);

      suggestions.push({
        type:    "calorie",
        icon:    "⚡",
        severity: "high",
        message: `Calorie deficit: <strong>${deficit} kcal</strong> below target (${Math.round(calPct * 100)}% met). Add energy-dense foods:`,
        foods:   highCalFoods
      });
    }

    /* ── Protein Deficit ──────────────────────────────────────── */
    if (protPct < 0.65 && targets.protMax > 0) {
      const deficit = (targets.protMax - totals.protein).toFixed(1);
      const highProtFoods = allFoods
        .filter(f => f.per100g.protein > 5 && f.cost !== "high")
        .sort((a, b) => b.per100g.protein - a.per100g.protein)
        .slice(0, 3);

      suggestions.push({
        type:    "protein",
        icon:    "🥩",
        severity: "medium",
        message: `Protein low: need <strong>${deficit}g more</strong>. Try these protein-rich affordable options:`,
        foods:   highProtFoods
      });

      // Specific daal + egg combo recommendation
      const daal = allFoods.find(f => f.id === "pk_003");
      const egg  = allFoods.find(f => f.id === "pk_006");
      if (daal && egg) {
        suggestions.push({
          type:    "combo",
          icon:    "💡",
          severity: "low",
          message: "Tip: <strong>Daal + Egg</strong> combination provides complete amino acids at low cost — ideal for SAM recovery.",
          foods:   [daal, egg]
        });
      }
    }

    /* ── Fat Deficit ───────────────────────────────────────────── */
    if (fatPct < 0.5 && targets.fatMax > 0) {
      const oil = allFoods.find(f => f.id === "pk_009");
      suggestions.push({
        type:    "fat",
        icon:    "🧈",
        severity: "medium",
        message: "Fat intake is low. Add <strong>1–2 tsp of oil or ghee</strong> to meals to boost calorie density without increasing volume.",
        foods:   oil ? [oil] : []
      });
    }

    /* ── Overfeeding Warning ───────────────────────────────────── */
    if (calPct > 1.3 && classification === "SAM" && phase === "Stabilization") {
      warnings.push({
        type:    "overfeed",
        icon:    "⚠️",
        severity: "critical",
        message: `<strong>⚠ Overfeeding Risk:</strong> Current intake (${Math.round(totals.calories)} kcal) exceeds stabilization target by ${Math.round((calPct - 1) * 100)}%. Risk of refeeding syndrome. Reduce to ${targets.kcalTarget} kcal/day max.`
      });
    }

    /* ── Refeeding Syndrome Warning ─────────────────────────────── */
    if (classification === "SAM" && phase === "Stabilization" && calPct > 0.2) {
      warnings.push({
        type:    "refeeding",
        icon:    "🚨",
        severity: "high",
        message: "<strong>Refeeding Protocol:</strong> In stabilization, use F-75 only. Start at 80 kcal/kg/day. Increase by max 25% per day. Monitor electrolytes daily."
      });
    }

    /* ── Adequate Intake Positive Feedback ────────────────────── */
    if (calPct >= 0.9 && calPct <= 1.15 && protPct >= 0.75) {
      suggestions.push({
        type:    "ok",
        icon:    "✅",
        severity: "ok",
        message: "Diet plan looks balanced! Calorie and protein targets are being met. Continue monitoring weight gain.",
        foods:   []
      });
    }

    /* ── Phase-specific Tips ──────────────────────────────────── */
    if (phase === "Stabilization" && totals.calories > 0) {
      suggestions.push({
        type:    "phase-tip",
        icon:    "🏥",
        severity: "info",
        message: "Stabilization phase: Use F-75 formula (75 kcal/100ml). Give 8 feeds per day. Do NOT rush to higher calorie intake.",
        foods:   []
      });
    } else if (phase === "Transition") {
      suggestions.push({
        type:    "phase-tip",
        icon:    "🔄",
        severity: "info",
        message: "Transition phase: Switch to F-100 (100 kcal/100ml). Appetite should be improving. Introduce soft local foods alongside formula.",
        foods:   []
      });
    } else if (phase === "Rehabilitation" && totals.calories > 0) {
      suggestions.push({
        type:    "phase-tip",
        icon:    "💪",
        severity: "info",
        message: "Rehabilitation phase: Target rapid catch-up growth. Aim for 150–220 kcal/kg/day using nutrient-dense local foods.",
        foods:   []
      });
    }

    /* ── Low Fruit/Vegetable Variety ──────────────────────────── */
    const hasVeg = totals._foodCategories && (
      totals._foodCategories.has("vegetable") ||
      totals._foodCategories.has("fruit")
    );
    if (!hasVeg && totals.calories > 0) {
      const fruits = allFoods.filter(f => (f.category === "fruit" || f.category === "vegetable") && f.cost === "low").slice(0, 2);
      if (fruits.length) {
        suggestions.push({
          type:    "variety",
          icon:    "🥦",
          severity: "low",
          message: "Add fruits or vegetables for micronutrients (vitamins C, A, folate, iron):",
          foods:   fruits
        });
      }
    }

    return { suggestions, warnings };
  }

  /**
   * Render suggestions into the UI panel.
   */
  function render(totals, targets, phase, classification) {
    const card = document.getElementById("suggestions-card");
    const body = document.getElementById("suggestions-body");
    if (!card || !body) return;

    const { suggestions, warnings } = generate(totals, targets, phase, classification);
    const all = [...warnings, ...suggestions];

    if (!all.length || totals.calories === 0) {
      card.style.display = "none";
      return;
    }

    card.style.display = "block";
    body.innerHTML = all.map(s => buildSuggestionHTML(s)).join("");
  }

  function buildSuggestionHTML(s) {
    const severityClass = {
      critical: "alert alert-danger",
      high:     "alert alert-warning",
      medium:   "alert alert-info",
      info:     "alert alert-info",
      ok:       "alert alert-success",
      low:      ""
    }[s.severity] || "";

    const foodBtns = (s.foods || []).map(f =>
      `<button class="sug-food-btn" onclick="DietPlanner.openAddModal('${f.id}')">
         ${f.emoji || "🍽️"} ${f.name}
       </button>`
    ).join(" ");

    if (s.severity === "critical" || s.severity === "high") {
      return `<div class="${severityClass}" style="margin-bottom:10px;">
        <span>${s.icon}</span>
        <div>${s.message}${foodBtns ? `<div style="margin-top:8px;">${foodBtns}</div>` : ""}</div>
      </div>`;
    }

    return `<div class="suggestion-item">
      <span class="sug-icon">${s.icon}</span>
      <div>
        <div style="font-size:.83rem;">${s.message}</div>
        ${foodBtns ? `<div style="margin-top:6px;">${foodBtns}</div>` : ""}
      </div>
    </div>`;
  }

  return { generate, render };

})();
