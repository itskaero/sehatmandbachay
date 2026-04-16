/* ═══════════════════════════════════════════════════════════════
   nutrition.js
   WHO-based malnutrition classification and nutritional
   requirement calculations for pediatric SAM management.
   References:
   - WHO IMCI Guidelines
   - WHO Management of Severe Acute Malnutrition (2013)
   - UNICEF SAM Management Protocol
═══════════════════════════════════════════════════════════════ */

const NutritionCalc = (() => {

  /* ── Constants ────────────────────────────────────────────── */

  /** Phase-based energy & macronutrient targets (per kg body weight per day) */
  const PHASE_TARGETS = {
    Stabilization: {
      kcal:    { min: 80,  max: 100  },
      protein: { min: 1.0, max: 1.5  },
      fat:     { min: 3.0, max: 4.0  },
      formula:  "F-75",
      color:   "stab"
    },
    Transition: {
      kcal:    { min: 100, max: 130  },
      protein: { min: 2.0, max: 3.0  },
      fat:     { min: 4.0, max: 6.0  },
      formula:  "F-100",
      color:   "trans"
    },
    Rehabilitation: {
      kcal:    { min: 150, max: 220  },
      protein: { min: 4.0, max: 6.0  },
      fat:     { min: 6.0, max: 8.0  },
      formula:  "Local foods",
      color:   "rehab"
    }
  };

  /* ── Classification ───────────────────────────────────────── */

  /**
   * Classify malnutrition status based on WHO criteria.
   * Primary: MUAC (most practical in field) + bilateral edema.
   * Secondary: WHZ score if height available.
   *
   * @param {object} input
   *   ageMonths {number}
   *   weight    {number} kg
   *   muac      {number|null} cm
   *   height    {number|null} cm
   *   edema     {string} "yes"|"no"
   *   appetite  {string} "good"|"fair"|"poor"
   *   symptoms  {string[]} e.g. ["diarrhea","fever"]
   *
   * @returns {object} Full classification result
   */
  function classify(input) {
    const { ageMonths, weight, muac, height, edema, appetite, symptoms = [] } = input;

    let classification = "Normal";
    const evidence = [];
    const warnings = [];

    // ── Rule 1: Bilateral pitting edema = SAM (kwashiorkor)
    if (edema === "yes") {
      classification = "SAM";
      evidence.push({ text: "Bilateral pitting edema (kwashiorkor)", severity: "high" });
      warnings.push("kwashiorkor");
    }

    // ── Rule 2: MUAC (for 6–59 months)
    if (muac !== null && ageMonths >= 6 && ageMonths <= 59) {
      const m = parseFloat(muac);
      if (m < 11.5) {
        classification = "SAM";
        evidence.push({ text: `MUAC ${m.toFixed(1)} cm < 11.5 cm (SAM threshold)`, severity: "high" });
      } else if (m < 12.5) {
        if (classification !== "SAM") classification = "MAM";
        evidence.push({ text: `MUAC ${m.toFixed(1)} cm — 11.5–12.5 cm (MAM range)`, severity: "medium" });
      } else {
        evidence.push({ text: `MUAC ${m.toFixed(1)} cm > 12.5 cm (Normal)`, severity: "low" });
      }
    }

    // ── Rule 3: WHZ approximation if height available
    if (weight && height) {
      const whz = estimateWHZ(weight, height, ageMonths);
      if (whz !== null) {
        if (whz < -3) {
          classification = "SAM";
          evidence.push({ text: `Estimated WHZ ${whz.toFixed(1)} < -3 SD`, severity: "high" });
        } else if (whz < -2) {
          if (classification !== "SAM") classification = "MAM";
          evidence.push({ text: `Estimated WHZ ${whz.toFixed(1)} (-3 to -2 SD)`, severity: "medium" });
        }
      }
    }

    // ── Rule 4: Symptoms add context
    if (symptoms.includes("diarrhea")) warnings.push("diarrhea");
    if (symptoms.includes("respiratory")) warnings.push("respiratory_distress");

    // ── Phase identification
    const phase = identifyPhase(classification, appetite, edema);

    // ── Nutritional requirements
    const requirements = calculateRequirements(weight, phase);

    // ── Refeeding risk
    const refeedingRisk = classification === "SAM" || (classification === "MAM" && symptoms.length > 1);

    return {
      classification,
      phase,
      requirements,
      evidence,
      warnings,
      refeedingRisk
    };
  }

  /* ── Phase Identification ─────────────────────────────────── */

  function identifyPhase(classification, appetite, edema) {
    if (classification !== "SAM") {
      // MAM / Normal — go directly to rehabilitation-style feeding
      return appetite === "poor" ? "Transition" : "Rehabilitation";
    }

    // SAM
    if (appetite === "poor" || edema === "yes") return "Stabilization";
    if (appetite === "fair")                    return "Transition";
    return "Rehabilitation";
  }

  /* ── Nutritional Requirements ────────────────────────────── */

  function calculateRequirements(weightKg, phase) {
    const w  = parseFloat(weightKg);
    const pt = PHASE_TARGETS[phase] || PHASE_TARGETS["Rehabilitation"];

    const kcalMin    = Math.round(pt.kcal.min    * w);
    const kcalMax    = Math.round(pt.kcal.max    * w);
    const kcalTarget = Math.round(((pt.kcal.min + pt.kcal.max) / 2) * w);
    const protMin    = parseFloat((pt.protein.min * w).toFixed(1));
    const protMax    = parseFloat((pt.protein.max * w).toFixed(1));
    const fatMin     = parseFloat((pt.fat.min     * w).toFixed(1));
    const fatMax     = parseFloat((pt.fat.max     * w).toFixed(1));

    // Carbs: fill remainder of energy budget (protein 4 kcal/g, fat 9 kcal/g)
    const protKcal = ((protMin + protMax) / 2) * 4;
    const fatKcal  = ((fatMin  + fatMax)  / 2) * 9;
    const carbKcal = Math.max(0, kcalTarget - protKcal - fatKcal);
    const carbG    = parseFloat((carbKcal / 4).toFixed(1));

    return {
      kcalMin, kcalMax, kcalTarget,
      protMin, protMax,
      fatMin, fatMax,
      carbG,
      perKgKcal: pt.kcal,
      perKgProt: pt.protein,
      formula:   pt.formula,
      phaseColor: pt.color,
      phase
    };
  }

  /* ── WHZ Estimation ───────────────────────────────────────── */

  /**
   * Very simplified WHZ estimation using WHO median weight-for-height
   * reference values. This is approximate — use WHO Anthro for precision.
   */
  function estimateWHZ(weight, height, ageMonths) {
    const h = parseFloat(height);
    const w = parseFloat(weight);
    if (h < 45 || h > 120) return null;

    // Simplified WHO median weight-for-height table (every 5cm)
    // Source: WHO Child Growth Standards
    const table = [
      { h: 45,  median: 2.44, sd: 0.25 },
      { h: 50,  median: 3.35, sd: 0.36 },
      { h: 55,  median: 4.51, sd: 0.44 },
      { h: 60,  median: 5.96, sd: 0.58 },
      { h: 65,  median: 7.22, sd: 0.75 },
      { h: 70,  median: 8.36, sd: 0.85 },
      { h: 75,  median: 9.44, sd: 0.92 },
      { h: 80,  median: 10.4, sd: 1.00 },
      { h: 85,  median: 11.3, sd: 1.08 },
      { h: 90,  median: 12.2, sd: 1.17 },
      { h: 95,  median: 13.3, sd: 1.30 },
      { h: 100, median: 14.4, sd: 1.44 },
      { h: 105, median: 15.7, sd: 1.60 },
      { h: 110, median: 17.1, sd: 1.78 },
      { h: 115, median: 18.7, sd: 1.98 },
      { h: 120, median: 20.5, sd: 2.20 }
    ];

    // Linear interpolation
    let lower = null, upper = null;
    for (let i = 0; i < table.length - 1; i++) {
      if (h >= table[i].h && h <= table[i + 1].h) {
        lower = table[i]; upper = table[i + 1]; break;
      }
    }
    if (!lower || !upper) return null;

    const ratio  = (h - lower.h) / (upper.h - lower.h);
    const median = lower.median + ratio * (upper.median - lower.median);
    const sd     = lower.sd + ratio * (upper.sd - lower.sd);

    return parseFloat(((w - median) / sd).toFixed(2));
  }

  /* ── F-75 Volume Calculator ────────────────────────────────── */

  /**
   * Calculate F-75 or F-100 feeding volumes.
   * @param {number} weightKg
   * @param {string} formulaType "f75" | "f100"
   * @param {number} targetKcalPerKg
   * @returns {object}
   */
  function calcFormulaVolume(weightKg, formulaType, targetKcalPerKg) {
    const w          = parseFloat(weightKg);
    const kcalPer100 = formulaType === "f100" ? 100 : 75;
    const totalKcal  = targetKcalPerKg * w;
    const totalMl    = Math.round((totalKcal / kcalPer100) * 100);

    const schedules = [
      { feeds: 8, label: "Every 3 hours (SAM stabilization)"  },
      { feeds: 6, label: "Every 4 hours (transition)"         },
      { feeds: 5, label: "Every 4–5 hours (rehabilitation)"   }
    ];

    return {
      totalMl,
      totalKcal: Math.round(totalKcal),
      formulaKcalPer100ml: kcalPer100,
      formulaType: formulaType.toUpperCase(),
      schedules: schedules.map(s => ({
        ...s,
        mlPerFeed: Math.round(totalMl / s.feeds)
      }))
    };
  }

  /* ── Local Recipe Nutrition Calculator ────────────────────── */

  /**
   * Calculate estimated nutrition of the local F-75 recipe.
   * @param {number} milkMl   full-fat cow's milk (61 kcal/100ml)
   * @param {number} sugarG   table sugar (387 kcal/100g)
   * @param {number} cerealG  wheat flour (364 kcal/100g)
   * @param {number} oilMl    vegetable oil (900 kcal/100ml, density ~1g/ml)
   * @returns {object} per 100ml and totals
   */
  function calcLocalRecipe(milkMl, sugarG, cerealG, oilMl) {
    const milkKcal   = (milkMl   / 100) * 61;
    const sugarKcal  = (sugarG   / 100) * 387;
    const cerealKcal = (cerealG  / 100) * 364;
    const oilKcal    = (oilMl   / 100) * 900;

    const milkProt   = (milkMl   / 100) * 3.2;
    const cerealProt = (cerealG  / 100) * 12;

    const milkFat    = (milkMl   / 100) * 3.3;
    const oilFat     = oilMl; // ~1g/ml

    const totalKcal  = milkKcal + sugarKcal + cerealKcal + oilKcal;
    const totalProt  = milkProt + cerealProt;
    const totalFat   = milkFat  + oilFat;

    // Per 100ml (total volume ~1000ml)
    const per100 = {
      kcal:    parseFloat((totalKcal  / 10).toFixed(1)),
      protein: parseFloat((totalProt  / 10).toFixed(2)),
      fat:     parseFloat((totalFat   / 10).toFixed(2))
    };

    const target75 = { kcal: 75, protein: 0.9, fat: 2.6 };

    return {
      totalKcal:   Math.round(totalKcal),
      totalProtein: parseFloat(totalProt.toFixed(1)),
      totalFat:     parseFloat(totalFat.toFixed(1)),
      per100,
      target:       target75,
      adequateKcal:    per100.kcal    >= 65, // within 15% of 75
      adequateProtein: per100.protein >= 0.7,
      adequateFat:     per100.fat     >= 2.0
    };
  }

  /* ── Age Formatting ────────────────────────────────────────── */

  function formatAge(ageMonths) {
    if (ageMonths < 24) return `${ageMonths} month${ageMonths !== 1 ? "s" : ""}`;
    const y = Math.floor(ageMonths / 12);
    const m = ageMonths % 12;
    return m > 0 ? `${y}y ${m}m` : `${y} year${y !== 1 ? "s" : ""}`;
  }

  function ageToMonths(value, unit) {
    return unit === "years" ? Math.round(parseFloat(value) * 12) : parseInt(value);
  }

  /* ── Public API ────────────────────────────────────────────── */
  return {
    classify,
    identifyPhase,
    calculateRequirements,
    calcFormulaVolume,
    calcLocalRecipe,
    formatAge,
    ageToMonths,
    PHASE_TARGETS
  };

})();
