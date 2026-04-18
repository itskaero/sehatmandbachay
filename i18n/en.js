/**
 * SehatMand Bachay — English (en) strings
 * Source / reference language — all keys must be defined here.
 *
 * Naming convention:
 *   nav.*         sidebar navigation items
 *   dash.*        dashboard section
 *   assess.*      child assessment form
 *   planner.*     diet planner section
 *   f75.*         F-75/F-100 module
 *   fooddb.*      food database section
 *   saved.*       patient records section
 *   modal.*       modal titles and labels
 *   form.*        generic form labels and placeholders
 *   btn.*         button labels
 *   placeholder.* input placeholder text (used with data-i18n-placeholder)
 *   badge.*       status badges
 *   toast.*       toast / alert messages
 *   measure.*     household measure modal labels
 *   sidebar.*     sidebar footer / hospital auth area
 *   chart.*       chart labels
 */

I18n.register("en", {

  /* ── Page / App ─────────────────────────────────────────── */
  "app.name":               "SehatMand Bachay",
  "app.tagline":            "Pediatric Malnutrition Assessment & Diet Planning System — Pakistan",
  "lang.toggle":            "اردو",

  /* ── Sidebar navigation ─────────────────────────────────── */
  "nav.section.main":       "MAIN",
  "nav.dashboard":          "Dashboard",
  "nav.assessment":         "Child Assessment",
  "nav.planner":            "Diet Planner",
  "nav.section.tools":      "TOOLS",
  "nav.f75":                "F-75 / F-100 Module",
  "nav.saved":              "Patient Records",
  "nav.section.admin":      "ADMIN",
  "nav.fooddb":             "Food Database",

  /* ── Sidebar footer / hospital auth ─────────────────────── */
  "sidebar.noHospital":     "No Hospital Set",
  "sidebar.firebaseMode":   "Offline Mode",
  "sidebar.authBadge.view": "View Only",
  "sidebar.authBadge.auth": "Staff Authenticated",
  "btn.enterPin":           "Enter PIN",
  "btn.hospitalSetup":      "Hospital Setup",
  "btn.logout":             "Logout",

  /* ── Dashboard ───────────────────────────────────────────── */
  "dash.heading":           "Welcome to SehatMand Bachay",
  "dash.subheading":        "Pediatric Malnutrition Assessment & Diet Planning System — Pakistan",
  "dash.stat.total":        "Total Assessments",
  "dash.stat.sam":          "SAM Cases",
  "dash.stat.mam":          "MAM Cases",
  "dash.stat.diets":        "Diet Plans",
  "dash.whoRef.title":      "WHO Classification Reference",
  "dash.whoRef.status":     "Status",
  "dash.whoRef.muac":       "MUAC",
  "dash.whoRef.whz":        "WHZ",
  "dash.whoRef.edema":      "Edema",
  "dash.treatment.title":   "SAM Treatment Phases",
  "dash.phase.stabilize":   "Stabilization",
  "dash.phase.stabilize.desc": "F-75 formula • 80–100 kcal/kg/day • Treat complications",
  "dash.phase.transition":  "Transition",
  "dash.phase.transition.desc": "F-100 formula • 100–130 kcal/kg/day • Appetite improving",
  "dash.phase.rehab":       "Rehabilitation",
  "dash.phase.rehab.desc":  "Local foods • 150–220 kcal/kg/day • Rapid weight gain",
  "dash.recent.title":      "Recent Assessments",
  "dash.recent.empty":      "No assessments yet — start a new one!",
  "btn.newAssessment":      "New Assessment",
  "btn.viewAll":            "View All",

  /* ── Child Assessment ────────────────────────────────────── */
  "assess.heading":         "Child Assessment",
  "assess.subheading":      "Enter child details for WHO-based malnutrition classification",
  "assess.card.details":    "Child Details",
  "form.childName":         "Child Name",
  "form.sex":               "Sex",
  "btn.girl":               "Girl",
  "btn.boy":                "Boy",
  "form.age":               "Age",
  "form.weight":            "Weight",
  "form.muac":              "MUAC",
  "form.muac.hint":         "optional – for 6–59 months",
  "form.height":            "Height / Length",
  "form.edema":             "Bilateral Pitting Edema",
  "form.edema.no":          "No Edema",
  "form.edema.yes":         "Yes – SAM",
  "form.appetite":          "Appetite",
  "btn.appetite.good":      "Good",
  "btn.appetite.fair":      "Fair",
  "btn.appetite.poor":      "Poor",
  "form.appetite.hint":     "Appetite test: Offer RUTF — Good ≥50% eaten, Poor <50%",
  "form.symptoms":          "Associated Symptoms",
  "sym.diarrhea":           "Diarrhea",
  "sym.fever":              "Fever",
  "sym.vomiting":           "Vomiting",
  "sym.respiratory":        "Resp. Distress",
  "btn.classify":           "Classify & Calculate Requirements",
  "assess.result.phase":    "Treatment Phase",
  "assess.result.dailyReq": "Daily Nutritional Requirements",
  "assess.refeeding.title": "⚠ Refeeding Syndrome Risk",
  "btn.createDiet":         "Create Diet Plan",
  "btn.f75f100":            "F-75 / F-100",
  "btn.saveAssessment":     "Save Assessment",

  /* ── Diet Planner ────────────────────────────────────────── */
  "planner.heading":        "Diet Planner",
  "planner.subheading":     "Build a customized diet plan for the assessed child",
  "planner.noPatient":      "No patient selected",
  "planner.target":         "Target:",
  "btn.changePatient":      "Change Patient",
  "planner.foodLib.title":  "Food Library",
  "planner.cat.all":        "All",
  "planner.cat.grains":     "Grains",
  "planner.cat.protein":    "Protein",
  "planner.cat.dairy":      "Dairy",
  "planner.cat.legumes":    "Legumes",
  "planner.cat.fats":       "Fats",
  "planner.cat.fruits":     "Fruits",
  "planner.cat.veg":        "Veg",
  "planner.cat.mixed":      "Mixed Dishes",
  "planner.cat.therapeutic":"Therapeutic",
  "planner.macro.calories": "Calories",
  "planner.macro.protein":  "Protein",
  "planner.macro.fat":      "Fat",
  "planner.macro.carbs":    "Carbohydrates",
  "planner.macro.target":   "Target:",
  "planner.chart.title":    "Diet Chart",
  "planner.chart.empty":    "Tap food cards to add them to the diet chart",
  "planner.suggestions":    "Smart Suggestions",
  "planner.nutrition":      "Nutrition Summary",
  "btn.savePlan":           "Save Plan",
  "btn.exportPdf":          "Export PDF",
  "btn.printUrdu":          "Print (اردو)",
  "btn.clear":              "Clear",

  /* ── F-75 / F-100 ────────────────────────────────────────── */
  "f75.heading":            "F-75 / F-100 Therapeutic Formulas",
  "f75.subheading":         "WHO standard therapeutic milk formulas for SAM management",
  "f75.tab.f75":            "F-75 Formula",
  "f75.tab.f100":           "F-100 Formula",
  "f75.tab.local":          "Local Recipe",
  "f75.tab.calc":           "Volume Calculator",
  "f75.f75.title":          "F-75 — Stabilization Phase",
  "f75.badge.stab":         "STABILIZATION",
  "f75.recipe.title":       "WHO Standard Recipe (per 1000 ml)",
  "f75.table.ingredient":   "Ingredient",
  "f75.table.amount":       "Amount",
  "f75.schedule":           "Feeding Schedule: 8 feeds/day (every 3 hours). Starting volume: 80–100 ml/kg/day.",
  "f75.whenToUse":          "When to Use F-75",
  "f75.badge.rehab":        "REHABILITATION",
  "f75.f100.title":         "F-100 — Rehabilitation Phase",
  "f75.transition.title":   "Transition Steps (F-75 → F-100)",
  "f75.local.title":        "Local F-75 Alternative — Pakistan",
  "f75.local.badge":        "Use only when commercial formula unavailable",
  "f75.calc.title":         "F-75 / F-100 Volume Calculator",
  "form.childWeight":       "Child Weight (kg)",
  "form.formulaType":       "Formula Type",
  "form.targetEnergy":      "Target Energy",
  "f75.opt.f75":            "F-75 (Stabilization)",
  "f75.opt.f100":           "F-100 (Rehabilitation)",

  /* ── Food Database ───────────────────────────────────────── */
  "fooddb.heading":         "Food Database",
  "fooddb.subheading":      "Manage and add food items to the library",
  "fooddb.local.title":     "Local Pakistani Foods (Pre-loaded)",
  "fooddb.custom.title":    "Custom Foods (Firebase)",
  "fooddb.custom.empty":    "No custom foods added yet",
  "btn.addFood":            "Add Food Item",

  /* ── Patient Records (Saved) ─────────────────────────────── */
  "saved.heading":          "Patient Records",
  "saved.subheading":       "View and manage patients grouped by hospital",
  "saved.empty":            "No patient records",
  "saved.empty.sub":        "Save assessments and diet plans to view them here",

  /* ── Modals ──────────────────────────────────────────────── */
  "modal.addFood.title":    "Add Food Item",
  "modal.addDiet.title":    "Add to Diet Chart",
  "modal.hospitalSetup.title": "Hospital Setup",
  "modal.pin.title":        "Staff PIN",
  "modal.patientRecord.title": "Patient Record",
  "modal.addMeasurement.title": "Add Measurement",

  /* ── Add Food modal ──────────────────────────────────────── */
  "form.foodNameEn":        "Food Name (English)",
  "form.foodNameUr":        "اردو نام",
  "form.category":          "Category",
  "form.costCategory":      "Cost Category",
  "form.emojiIcon":         "Emoji Icon",
  "form.nutrition100g":     "Nutrition Values (per 100g)",
  "form.calories":          "Calories (kcal)",
  "form.carbs":             "Carbs (g)",
  "form.fat":               "Fat (g)",
  "form.clinicalTips":      "Clinical Tips / Notes",
  "btn.saveFood":           "Save Food",

  /* ── Add to Diet modal ───────────────────────────────────── */
  "modal.addDiet.measure":  "Household Measure",
  "modal.addDiet.amount":   "Amount (grams)",
  "modal.addDiet.mealTime": "Meal Time",
  "meal.morning":           "Morning (7am)",
  "meal.midMorning":        "Mid-Morning (10am)",
  "meal.lunch":             "Lunch (1pm)",
  "meal.afternoon":         "Afternoon (4pm)",
  "meal.dinner":            "Dinner (7pm)",
  "meal.nightFeed":         "Night Feed (10pm)",
  "btn.addToDiet":          "Add to Diet",

  /* ── Hospital Setup modal ────────────────────────────────── */
  "modal.hospitalSetup.info": "Set a hospital name and PIN. Staff with the PIN can add and edit records.",
  "form.hospitalName":      "Hospital / Clinic Name",
  "form.location":          "Location / District",
  "form.staffPin":          "Staff PIN",
  "form.confirmPin":        "Confirm PIN",
  "btn.saveHospital":       "Save Hospital Setup",
  "hosp.tab.saved":         "Saved Hospitals",
  "hosp.tab.manual":        "Manual Entry",
  "hosp.tab.detect":        "Auto-detect",
  "hosp.saved.empty":       "No saved hospitals yet — use Manual Entry or Auto-detect to add one.",
  "hosp.detect.info":       "Use your device's GPS to auto-fill the location, then enter the hospital name and PIN.",
  "btn.detectLocation":     "Detect My Location",
  "hosp.detect.detecting":  "Requesting location…",
  "hosp.detect.noSupport":  "Geolocation is not supported by this browser.",
  "hosp.detect.denied":     "Location access denied — allow it in browser settings.",
  "hosp.detect.unavailable":"Location unavailable.",
  "hosp.detect.timeout":    "Request timed out.",
  "hosp.select.switched":   "Switched to hospital",

  /* ── PIN modal ───────────────────────────────────────────── */
  "modal.pin.instruction":  "Enter the hospital staff PIN to enable editing",
  "btn.verifyPin":          "Verify PIN",

  /* ── Patient Record modal ────────────────────────────────── */
  "pr.trends.title":        "Growth Trends",
  "pr.chart.weight":        "Weight Over Time",
  "pr.chart.muac":          "MUAC Over Time",
  "pr.history.title":       "Assessment History",
  "pr.diets.title":         "Diet Plans",
  "pr.viewOnly":            "View-only mode — enter staff PIN to edit",
  "btn.addMeasurement":     "Add Measurement",

  /* ── Add Measurement modal ───────────────────────────────── */
  "form.weightKg":          "Weight (kg)",
  "form.ageMonths":         "Age (months)",
  "form.heightCm":          "Height (cm)",
  "form.muacCm":            "MUAC (cm)",
  "form.classifyNote":      "Classification will be automatically recalculated based on WHO tables.",

  /* ── Generic buttons ─────────────────────────────────────── */
  "btn.cancel":             "Cancel",
  "btn.save":               "Save",
  "btn.close":              "Close",
  "btn.edit":               "Edit",
  "btn.delete":             "Delete",
  "btn.view":               "View",

  /* ── Placeholder strings (data-i18n-placeholder) ─────────── */
  "placeholder.childName":  "Enter child name",
  "placeholder.age":        "e.g. 18",
  "placeholder.weight":     "e.g. 7.5",
  "placeholder.height":     "e.g. 75",
  "placeholder.muac":       "e.g. 12.5",
  "placeholder.searchFood": "Search foods…",
  "placeholder.searchSaved": "Search by name…",
  "placeholder.pin":        "Enter PIN",
  "placeholder.hospitalName": "e.g. DHQ Hospital Lahore",
  "placeholder.location":   "e.g. Lahore, Punjab",

  /* ── Badge / status labels ───────────────────────────────── */
  "badge.sam":              "SAM",
  "badge.mam":              "MAM",
  "badge.normal":           "Normal",
  "badge.edema":            "Edema",
  "badge.stabilization":    "STABILIZATION",
  "badge.transition":       "TRANSITION",
  "badge.rehabilitation":   "REHABILITATION",
  "badge.months":           "months",
  "badge.years":            "years",

  /* ── Toast messages ──────────────────────────────────────── */
  "toast.assessmentSaved":  "Assessment saved",
  "toast.dietSaved":        "Diet plan saved",
  "toast.pinCorrect":       "PIN verified — editing enabled",
  "toast.pinWrong":         "Incorrect PIN",
  "toast.hospitalSaved":    "Hospital setup saved",
  "toast.loggedOut":        "Logged out",
  "toast.langChanged":      "Language changed",
});
