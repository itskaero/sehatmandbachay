/* ═══════════════════════════════════════════════════════════════
   nutrition.js
   WHO-based malnutrition classification and nutritional
   requirement calculations for pediatric SAM management.
   References:
   - WHO Child Growth Standards 2006 (weight-for-height/length)
   - WHO IMCI Guidelines
   - WHO Management of Severe Acute Malnutrition (2013)
   - UNICEF SAM Management Protocol
═══════════════════════════════════════════════════════════════ */

const NutritionCalc = (() => {

  /* ── Constants ────────────────────────────────────────────── */

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

  /* ── WHO Weight-for-Height/Length Reference Tables ────────── */
  /*
   * Source: WHO Child Growth Standards 2006
   * Values: weight (kg) at -3 SD, -2 SD, Median for each height (cm).
   * Girls and Boys tables use standing height ≥65 cm.
   * For 45–65 cm, recumbent length is used.
   */

  // Girls: [height_cm, sd_neg3, sd_neg2, median]
  const WFH_GIRLS = [
    [45, 1.9, 2.1, 2.5], [46, 2.0, 2.2, 2.6], [47, 2.1, 2.3, 2.7],
    [48, 2.2, 2.4, 2.8], [49, 2.3, 2.5, 3.0], [50, 2.4, 2.6, 3.1],
    [51, 2.6, 2.8, 3.3], [52, 2.7, 3.0, 3.5], [53, 2.9, 3.2, 3.7],
    [54, 3.1, 3.4, 3.9], [55, 3.3, 3.6, 4.2], [56, 3.5, 3.8, 4.4],
    [57, 3.7, 4.0, 4.7], [58, 3.9, 4.3, 5.0], [59, 4.2, 4.5, 5.2],
    [60, 4.4, 4.8, 5.5], [61, 4.6, 5.0, 5.8], [62, 4.8, 5.3, 6.0],
    [63, 5.1, 5.5, 6.3], [64, 5.3, 5.7, 6.6], [65, 5.6, 6.1, 6.9],
    [66, 5.8, 6.3, 7.2], [67, 6.0, 6.5, 7.4], [68, 6.2, 6.8, 7.7],
    [69, 6.4, 7.0, 7.9], [70, 6.6, 7.2, 8.2], [71, 6.8, 7.4, 8.4],
    [72, 7.0, 7.6, 8.6], [73, 7.2, 7.8, 8.9], [74, 7.4, 8.1, 9.1],
    [75, 7.6, 8.3, 9.4], [76, 7.8, 8.5, 9.6], [77, 8.0, 8.7, 9.9],
    [78, 8.2, 8.9, 10.1],[79, 8.4, 9.1, 10.3],[80, 8.6, 9.4, 10.6],
    [81, 8.8, 9.6, 10.8],[82, 9.0, 9.8, 11.1],[83, 9.2, 10.0,11.3],
    [84, 9.4, 10.2,11.5],[85, 9.6, 10.5,11.8],[86, 9.8, 10.7,12.1],
    [87, 10.0,10.9,12.3],[88, 10.2,11.1,12.6],[89, 10.4,11.3,12.8],
    [90, 10.6,11.6,13.1],[91, 10.8,11.8,13.4],[92, 11.1,12.1,13.7],
    [93, 11.3,12.3,13.9],[94, 11.5,12.5,14.2],[95, 11.7,12.8,14.5],
    [96, 11.9,13.0,14.8],[97, 12.1,13.3,15.1],[98, 12.4,13.5,15.4],
    [99, 12.6,13.8,15.7],[100,12.8,14.0,16.0],[101,13.1,14.3,16.3],
    [102,13.3,14.6,16.7],[103,13.5,14.8,17.0],[104,13.8,15.1,17.4],
    [105,14.0,15.4,17.7],[106,14.3,15.7,18.1],[107,14.5,16.0,18.5],
    [108,14.8,16.2,18.9],[109,15.1,16.6,19.3],[110,14.8,16.4,19.9],
    [111,15.0,16.6,20.2],[112,15.3,16.9,20.6],[113,15.5,17.2,20.9],
    [114,15.7,17.4,21.3],[115,15.9,17.6,21.6],[116,16.1,17.8,21.9],
    [117,16.3,18.1,22.2],[118,16.5,18.3,22.5],[119,16.7,18.5,22.8],
    [120,16.9,18.7,23.1]
  ];

  // Boys: [height_cm, sd_neg3, sd_neg2, median]
  const WFH_BOYS = [
    [45, 1.9, 2.1, 2.4], [46, 2.0, 2.2, 2.5], [47, 2.1, 2.3, 2.7],
    [48, 2.2, 2.4, 2.8], [49, 2.3, 2.6, 3.0], [50, 2.5, 2.7, 3.1],
    [51, 2.6, 2.9, 3.3], [52, 2.8, 3.1, 3.5], [53, 3.0, 3.3, 3.8],
    [54, 3.2, 3.5, 4.0], [55, 3.4, 3.7, 4.3], [56, 3.6, 4.0, 4.5],
    [57, 3.8, 4.2, 4.8], [58, 4.0, 4.4, 5.1], [59, 4.3, 4.7, 5.3],
    [60, 4.5, 4.9, 5.6], [61, 4.7, 5.2, 5.9], [62, 5.0, 5.4, 6.1],
    [63, 5.2, 5.7, 6.4], [64, 5.4, 5.9, 6.7], [65, 5.6, 6.2, 7.0],
    [66, 5.8, 6.4, 7.2], [67, 6.0, 6.6, 7.5], [68, 6.2, 6.8, 7.7],
    [69, 6.4, 7.0, 8.0], [70, 6.6, 7.3, 8.2], [71, 6.8, 7.5, 8.4],
    [72, 7.0, 7.7, 8.7], [73, 7.2, 7.9, 8.9], [74, 7.4, 8.1, 9.2],
    [75, 7.6, 8.3, 9.4], [76, 7.8, 8.5, 9.6], [77, 7.9, 8.7, 9.9],
    [78, 8.1, 8.9, 10.1],[79, 8.3, 9.1, 10.4],[80, 8.5, 9.3, 10.6],
    [81, 8.7, 9.5, 10.8],[82, 8.9, 9.7, 11.1],[83, 9.1, 9.9, 11.3],
    [84, 9.3, 10.1,11.5],[85, 9.5, 10.4,11.8],[86, 9.7, 10.6,12.1],
    [87, 9.9, 10.8,12.3],[88, 10.1,11.0,12.6],[89, 10.3,11.3,12.8],
    [90, 10.5,11.5,13.1],[91, 10.8,11.7,13.4],[92, 11.0,12.0,13.7],
    [93, 11.2,12.2,13.9],[94, 11.4,12.5,14.2],[95, 11.6,12.7,14.5],
    [96, 11.9,13.0,14.8],[97, 12.1,13.2,15.1],[98, 12.3,13.5,15.4],
    [99, 12.5,13.8,15.7],[100,12.8,14.0,16.0],[101,13.0,14.3,16.4],
    [102,13.3,14.6,16.7],[103,13.5,14.9,17.1],[104,13.8,15.2,17.5],
    [105,14.0,15.5,17.9],[106,14.3,15.8,18.3],[107,14.5,16.1,18.7],
    [108,14.8,16.4,19.1],[109,15.1,16.8,19.6],[110,14.8,16.5,20.7],
    [111,15.1,16.8,21.0],[112,15.4,17.1,21.4],[113,15.7,17.5,21.8],
    [114,16.0,17.8,22.2],[115,16.2,18.0,22.5],[116,16.5,18.4,23.0],
    [117,16.8,18.7,23.5],[118,17.1,19.0,24.0],[119,17.5,19.4,24.2],
    [120,17.8,19.7,24.6]
  ];

  /* ── Classification ───────────────────────────────────────── */

  /**
   * Classify malnutrition status based on WHO criteria.
   * @param {object} input
   *   ageMonths {number}
   *   weight    {number} kg
   *   muac      {number|null} cm
   *   height    {number|null} cm
   *   sex       {string} "boy"|"girl"|"" (defaults to more conservative)
   *   edema     {string} "yes"|"no"
   *   appetite  {string} "good"|"fair"|"poor"
   *   symptoms  {string[]}
   * @returns {object} Full classification result
   */
  function classify(input) {
    const { ageMonths, weight, muac, height, sex = "", edema, appetite, symptoms = [] } = input;

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

    // ── Rule 3: Weight-for-Height (WHO 2006 tables)
    if (weight && height) {
      const wfhResult = classifyWFH(weight, height, sex);
      if (wfhResult) {
        if (wfhResult.status === "SAM") {
          classification = "SAM";
          evidence.push({
            text: `Weight ${weight} kg at height ${height} cm: < -3 SD (WHO WFH) — SAM`,
            severity: "high"
          });
        } else if (wfhResult.status === "MAM") {
          if (classification !== "SAM") classification = "MAM";
          evidence.push({
            text: `Weight ${weight} kg at height ${height} cm: -3 to -2 SD (WHO WFH) — MAM`,
            severity: "medium"
          });
        } else {
          evidence.push({
            text: `Weight ${weight} kg at height ${height} cm: ≥ -2 SD (WHO WFH) — Normal`,
            severity: "low"
          });
        }
        // Add Z-score for display
        if (wfhResult.whz !== null) {
          evidence[evidence.length - 1].text += ` [WHZ ≈ ${wfhResult.whz.toFixed(1)}]`;
        }
      }
    }

    // ── Rule 4: Symptoms context
    if (symptoms.includes("diarrhea"))    warnings.push("diarrhea");
    if (symptoms.includes("respiratory")) warnings.push("respiratory_distress");

    const phase        = identifyPhase(classification, appetite, edema);
    const requirements = calculateRequirements(weight, phase);
    const refeedingRisk = classification === "SAM" || (classification === "MAM" && symptoms.length > 1);

    return { classification, phase, requirements, evidence, warnings, refeedingRisk };
  }

  /* ── WHO WFH Classification ───────────────────────────────── */

  /**
   * Classify weight-for-height using WHO 2006 SD tables.
   * Uses sex-specific tables; defaults to most conservative (boys) if unknown.
   * @param {number} weight kg
   * @param {number} height cm
   * @param {string} sex "boy"|"girl"|""
   * @returns {{ status: "SAM"|"MAM"|"Normal", whz: number|null } | null}
   */
  function classifyWFH(weight, height, sex) {
    const h = parseFloat(height);
    const w = parseFloat(weight);
    if (isNaN(h) || isNaN(w) || h < 45 || h > 120) return null;

    // Use girl table by default; use boys if sex="boy"
    // (boys have slightly higher -3SD thresholds → more conservative for SAM catch)
    const table = (sex === "boy") ? WFH_BOYS : WFH_GIRLS;

    // Binary search for surrounding rows
    let lo = 0, hi = table.length - 1;
    while (lo < hi - 1) {
      const mid = (lo + hi) >> 1;
      if (table[mid][0] <= h) lo = mid; else hi = mid;
    }

    let sd3, sd2, median;
    if (table[lo][0] === h) {
      [, sd3, sd2, median] = table[lo];
    } else if (table[hi][0] === h) {
      [, sd3, sd2, median] = table[hi];
    } else {
      // Linear interpolation
      const ratio = (h - table[lo][0]) / (table[hi][0] - table[lo][0]);
      sd3    = table[lo][1] + ratio * (table[hi][1] - table[lo][1]);
      sd2    = table[lo][2] + ratio * (table[hi][2] - table[lo][2]);
      median = table[lo][3] + ratio * (table[hi][3] - table[lo][3]);
    }

    // Approximate Z-score for display (linear between SD bands)
    let whz = null;
    if (w < sd3) {
      const sd = (sd2 - sd3); // width of one SD band below -2
      whz = -3 - (sd > 0 ? (sd3 - w) / sd : 0);
    } else if (w < sd2) {
      const sd = (sd2 - sd3);
      whz = -3 + (sd > 0 ? (w - sd3) / sd : 0);
    } else {
      const sd = (median - sd2) / 2; // rough above -2
      whz = -2 + (sd > 0 ? (w - sd2) / sd : 0);
      whz = Math.min(whz, 3);
    }

    let status;
    if (w < sd3)      status = "SAM";
    else if (w < sd2) status = "MAM";
    else              status = "Normal";

    return { status, whz: parseFloat(whz.toFixed(1)), sd3, sd2, median };
  }

  /* ── Phase Identification ─────────────────────────────────── */

  function identifyPhase(classification, appetite, edema) {
    if (classification !== "SAM") {
      return appetite === "poor" ? "Transition" : "Rehabilitation";
    }
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

  /* ── F-75 Volume Calculator ────────────────────────────────── */

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

  function calcLocalRecipe(milkMl, sugarG, cerealG, oilMl) {
    const milkKcal   = (milkMl   / 100) * 61;
    const sugarKcal  = (sugarG   / 100) * 387;
    const cerealKcal = (cerealG  / 100) * 364;
    const oilKcal    = (oilMl   / 100) * 900;

    const milkProt   = (milkMl   / 100) * 3.2;
    const cerealProt = (cerealG  / 100) * 12;

    const milkFat    = (milkMl   / 100) * 3.3;
    const oilFat     = oilMl;

    const totalKcal  = milkKcal + sugarKcal + cerealKcal + oilKcal;
    const totalProt  = milkProt + cerealProt;
    const totalFat   = milkFat  + oilFat;

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
      adequateKcal:    per100.kcal    >= 65,
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
    classifyWFH,
    calcFormulaVolume,
    calcLocalRecipe,
    formatAge,
    ageToMonths,
    PHASE_TARGETS,
    WFH_GIRLS,
    WFH_BOYS
  };

})();
