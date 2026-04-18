/**
 * SehatMand Bachay — اردو (ur) strings
 *
 * Translation guidelines:
 *  - Use plain Pakistani Urdu (standard written form, not regional dialect)
 *  - Medical terms (SAM, MAM, MUAC, F-75, F-100, RUTF) are kept as-is
 *    because clinical staff recognise the acronyms
 *  - Numbers, units (kg, cm, kcal) remain in Latin script
 *  - Keys that intentionally stay in English (e.g. food-category codes,
 *    program acronyms) are omitted — the engine falls back to en.js
 *
 * To add/fix a translation: edit the value string next to the key.
 * Missing keys will automatically fall back to English.
 */

I18n.register("ur", {

  /* ── Page / App ─────────────────────────────────────────── */
  "app.name":               "سیہت مند بچے",
  "app.tagline":            "پاکستان میں بچوں کی غذائی کمی کی تشخیص اور خوراک کا نظام",
  "lang.toggle":            "English",

  /* ── Sidebar navigation ─────────────────────────────────── */
  "nav.section.main":       "مرکزی",
  "nav.dashboard":          "ڈیش بورڈ",
  "nav.assessment":         "بچے کی تشخیص",
  "nav.planner":            "خوراک کا منصوبہ",
  "nav.section.tools":      "ٹولز",
  "nav.f75":                "ایف-75 / ایف-100 ماڈیول",
  "nav.saved":              "مریض کے ریکارڈ",
  "nav.section.admin":      "انتظام",
  "nav.fooddb":             "کھانے کا ڈیٹا بیس",

  /* ── Sidebar footer / hospital auth ─────────────────────── */
  "sidebar.noHospital":     "کوئی ہسپتال سیٹ نہیں",
  "sidebar.firebaseMode":   "آف لائن موڈ",
  "sidebar.authBadge.view": "صرف دیکھیں",
  "sidebar.authBadge.auth": "عملہ مستند",
  "btn.enterPin":           "پن داخل کریں",
  "btn.hospitalSetup":      "ہسپتال سیٹ اپ",
  "btn.logout":             "لاگ آوٹ",

  /* ── Dashboard ───────────────────────────────────────────── */
  "dash.heading":           "سیہت مند بچے میں خوش آمدید",
  "dash.subheading":        "پاکستان میں بچوں کی غذائی کمی کی تشخیص اور خوراک کا نظام",
  "dash.stat.total":        "کل تشخیصات",
  "dash.stat.sam":          "شدید غذائی کمی (SAM)",
  "dash.stat.mam":          "اعتدال پسند غذائی کمی (MAM)",
  "dash.stat.diets":        "خوراک کے منصوبے",
  "dash.whoRef.title":      "ڈبلیو ایچ او درجہ بندی",
  "dash.whoRef.status":     "حالت",
  "dash.whoRef.muac":       "MUAC",
  "dash.whoRef.whz":        "WHZ",
  "dash.whoRef.edema":      "سوجن",
  "dash.treatment.title":   "SAM علاج کے مراحل",
  "dash.phase.stabilize":   "استحکام",
  "dash.phase.stabilize.desc": "ایف-75 فارمولا • 80–100 kcal/kg/روز • پیچیدگیوں کا علاج",
  "dash.phase.transition":  "منتقلی",
  "dash.phase.transition.desc": "ایف-100 فارمولا • 100–130 kcal/kg/روز • بھوک بہتر ہو رہی ہے",
  "dash.phase.rehab":       "بحالی",
  "dash.phase.rehab.desc":  "مقامی کھانا • 150–220 kcal/kg/روز • تیز وزن میں اضافہ",
  "dash.recent.title":      "حالیہ تشخیصات",
  "dash.recent.empty":      "ابھی کوئی تشخیص نہیں — نئی تشخیص شروع کریں!",
  "btn.newAssessment":      "نئی تشخیص",
  "btn.viewAll":            "سب دیکھیں",

  /* ── Child Assessment ────────────────────────────────────── */
  "assess.heading":         "بچے کی تشخیص",
  "assess.subheading":      "ڈبلیو ایچ او معیار کے مطابق غذائی کمی کی درجہ بندی کے لیے تفصیلات درج کریں",
  "assess.card.details":    "بچے کی تفصیلات",
  "form.childName":         "بچے کا نام",
  "form.sex":               "جنس",
  "btn.girl":               "لڑکی",
  "btn.boy":                "لڑکا",
  "form.age":               "عمر",
  "form.weight":            "وزن",
  "form.muac":              "MUAC",
  "form.muac.hint":         "اختیاری — 6 سے 59 ماہ کے لیے",
  "form.height":            "قد / لمبائی",
  "form.edema":             "دونوں طرف گڑھے دار سوجن",
  "form.edema.no":          "سوجن نہیں",
  "form.edema.yes":         "ہاں — SAM",
  "form.appetite":          "بھوک",
  "btn.appetite.good":      "اچھی",
  "btn.appetite.fair":      "ٹھیک ٹھاک",
  "btn.appetite.poor":      "کم",
  "form.appetite.hint":     "بھوک ٹیسٹ: RUTF دیں — اچھی ≥50% کھائی، کم <50%",
  "form.symptoms":          "متعلقہ علامات",
  "sym.diarrhea":           "اسہال",
  "sym.fever":              "بخار",
  "sym.vomiting":           "قے",
  "sym.respiratory":        "سانس کی تکلیف",
  "btn.classify":           "تشخیص اور ضروریات کا حساب کریں",
  "assess.result.phase":    "علاج کا مرحلہ",
  "assess.result.dailyReq": "روزانہ غذائی ضروریات",
  "assess.refeeding.title": "⚠ ری فیڈنگ سنڈروم کا خطرہ",
  "btn.createDiet":         "خوراک کا منصوبہ بنائیں",
  "btn.f75f100":            "ایف-75 / ایف-100",
  "btn.saveAssessment":     "تشخیص محفوظ کریں",

  /* ── Diet Planner ────────────────────────────────────────── */
  "planner.heading":        "خوراک کا منصوبہ",
  "planner.subheading":     "بچے کے لیے مناسب خوراک کا منصوبہ تیار کریں",
  "planner.noPatient":      "کوئی مریض منتخب نہیں",
  "planner.target":         "ہدف:",
  "btn.changePatient":      "مریض تبدیل کریں",
  "planner.foodLib.title":  "کھانوں کی فہرست",
  "planner.cat.all":        "سب",
  "planner.cat.grains":     "اناج",
  "planner.cat.protein":    "پروٹین",
  "planner.cat.dairy":      "دودھ کی مصنوعات",
  "planner.cat.legumes":    "دالیں",
  "planner.cat.fats":       "چکنائی",
  "planner.cat.fruits":     "پھل",
  "planner.cat.veg":        "سبزیاں",
  "planner.cat.mixed":      "ملی جلی ڈشز",
  "planner.cat.therapeutic":"علاجی خوراک",
  "planner.macro.calories": "کیلوری",
  "planner.macro.protein":  "پروٹین",
  "planner.macro.fat":      "چکنائی",
  "planner.macro.carbs":    "کاربوہائیڈریٹ",
  "planner.macro.target":   "ہدف:",
  "planner.chart.title":    "خوراک چارٹ",
  "planner.chart.empty":    "خوراک چارٹ میں شامل کرنے کے لیے کھانے پر ٹیپ کریں",
  "planner.suggestions":    "تجویز کردہ خوراک",
  "planner.nutrition":      "غذائیت کا خلاصہ",
  "btn.savePlan":           "منصوبہ محفوظ کریں",
  "btn.exportPdf":          "پی ڈی ایف ایکسپورٹ",
  "btn.printUrdu":          "پرنٹ کریں",
  "btn.clear":              "صاف کریں",

  /* ── F-75 / F-100 ────────────────────────────────────────── */
  "f75.heading":            "ایف-75 / ایف-100 علاجی فارمولے",
  "f75.subheading":         "SAM کے انتظام کے لیے ڈبلیو ایچ او معیاری علاجی دودھ فارمولے",
  "f75.tab.f75":            "ایف-75 فارمولا",
  "f75.tab.f100":           "ایف-100 فارمولا",
  "f75.tab.local":          "مقامی نسخہ",
  "f75.tab.calc":           "مقدار کیلکولیٹر",
  "f75.f75.title":          "ایف-75 — استحکام کا مرحلہ",
  "f75.badge.stab":         "استحکام",
  "f75.recipe.title":       "ڈبلیو ایچ او معیاری نسخہ (فی 1000 ml)",
  "f75.table.ingredient":   "اجزاء",
  "f75.table.amount":       "مقدار",
  "f75.schedule":           "خوراک کا وقت: دن میں 8 بار (ہر 3 گھنٹے)۔ شروعاتی مقدار: 80–100 ml/kg/دن۔",
  "f75.whenToUse":          "ایف-75 کب استعمال کریں",
  "f75.badge.rehab":        "بحالی",
  "f75.f100.title":         "ایف-100 — بحالی کا مرحلہ",
  "f75.transition.title":   "منتقلی کے مراحل (ایف-75 سے ایف-100)",
  "f75.local.title":        "مقامی ایف-75 متبادل — پاکستان",
  "f75.local.badge":        "صرف اس وقت استعمال کریں جب تجارتی فارمولا دستیاب نہ ہو",
  "f75.calc.title":         "ایف-75 / ایف-100 مقدار کیلکولیٹر",
  "form.childWeight":       "بچے کا وزن (kg)",
  "form.formulaType":       "فارمولے کی قسم",
  "form.targetEnergy":      "ہدف توانائی",
  "f75.opt.f75":            "ایف-75 (استحکام)",
  "f75.opt.f100":           "ایف-100 (بحالی)",

  /* ── Food Database ───────────────────────────────────────── */
  "fooddb.heading":         "کھانے کا ڈیٹا بیس",
  "fooddb.subheading":      "کھانے کی اشیاء شامل کریں اور ان کا انتظام کریں",
  "fooddb.local.title":     "مقامی پاکستانی کھانے (پہلے سے لوڈ)",
  "fooddb.custom.title":    "کسٹم کھانے (Firebase)",
  "fooddb.custom.empty":    "ابھی کوئی کسٹم کھانا شامل نہیں",
  "btn.addFood":            "کھانا شامل کریں",

  /* ── Patient Records ─────────────────────────────────────── */
  "saved.heading":          "مریض کے ریکارڈ",
  "saved.subheading":       "ہسپتال کے مطابق مریضوں کے ریکارڈ دیکھیں",
  "saved.empty":            "کوئی مریض ریکارڈ نہیں",
  "saved.empty.sub":        "ریکارڈ دیکھنے کے لیے تشخیصات اور خوراک کے منصوبے محفوظ کریں",

  /* ── Modals ──────────────────────────────────────────────── */
  "modal.addFood.title":    "کھانا شامل کریں",
  "modal.addDiet.title":    "خوراک چارٹ میں شامل کریں",
  "modal.hospitalSetup.title": "ہسپتال سیٹ اپ",
  "modal.pin.title":        "عملے کا پن",
  "modal.patientRecord.title": "مریض کا ریکارڈ",
  "modal.addMeasurement.title": "پیمائش شامل کریں",

  /* ── Add Food modal ──────────────────────────────────────── */
  "form.foodNameEn":        "کھانے کا انگریزی نام",
  "form.category":          "قسم",
  "form.costCategory":      "قیمت کی درجہ بندی",
  "form.emojiIcon":         "ایموجی آئیکن",
  "form.nutrition100g":     "غذائی اقدار (فی 100g)",
  "form.calories":          "کیلوری (kcal)",
  "form.carbs":             "کاربوہائیڈریٹ (g)",
  "form.fat":               "چکنائی (g)",
  "form.clinicalTips":      "طبی تجاویز / نوٹس",
  "btn.saveFood":           "کھانا محفوظ کریں",

  /* ── Add to Diet modal ───────────────────────────────────── */
  "modal.addDiet.measure":  "گھریلو پیمانہ",
  "modal.addDiet.amount":   "مقدار (گرام)",
  "modal.addDiet.mealTime": "کھانے کا وقت",
  "meal.morning":           "صبح (7 بجے)",
  "meal.midMorning":        "درمیانی صبح (10 بجے)",
  "meal.lunch":             "دوپہر کا کھانا (1 بجے)",
  "meal.afternoon":         "دوپہر بعد (4 بجے)",
  "meal.dinner":            "رات کا کھانا (7 بجے)",
  "meal.nightFeed":         "رات کا دودھ (10 بجے)",
  "btn.addToDiet":          "خوراک میں شامل کریں",

  /* ── Hospital Setup modal ────────────────────────────────── */
  "modal.hospitalSetup.info": "ہسپتال کا نام اور پن سیٹ کریں۔ پن والے عملے کے افراد ریکارڈ شامل اور ترمیم کر سکتے ہیں۔",
  "form.hospitalName":      "ہسپتال / کلینک کا نام",
  "form.location":          "جگہ / ضلع",
  "form.staffPin":          "عملے کا پن",
  "form.confirmPin":        "پن کی تصدیق کریں",
  "btn.saveHospital":       "ہسپتال سیٹ اپ محفوظ کریں",

  /* ── PIN modal ───────────────────────────────────────────── */
  "modal.pin.instruction":  "ترمیم کو فعال کرنے کے لیے ہسپتال عملے کا پن داخل کریں",
  "btn.verifyPin":          "پن تصدیق کریں",

  /* ── Patient Record modal ────────────────────────────────── */
  "pr.trends.title":        "نمو کے رجحانات",
  "pr.chart.weight":        "وقت کے ساتھ وزن",
  "pr.chart.muac":          "وقت کے ساتھ MUAC",
  "pr.history.title":       "تشخیص کی تاریخ",
  "pr.diets.title":         "خوراک کے منصوبے",
  "pr.viewOnly":            "صرف دیکھنے کا موڈ — ترمیم کے لیے عملے کا پن داخل کریں",
  "btn.addMeasurement":     "پیمائش شامل کریں",

  /* ── Add Measurement modal ───────────────────────────────── */
  "form.weightKg":          "وزن (kg)",
  "form.ageMonths":         "عمر (ماہ)",
  "form.heightCm":          "قد (cm)",
  "form.muacCm":            "MUAC (cm)",
  "form.classifyNote":      "درجہ بندی خودبخود ڈبلیو ایچ او جداول کی بنیاد پر دوبارہ حساب کی جائے گی۔",

  /* ── Generic buttons ─────────────────────────────────────── */
  "btn.cancel":             "منسوخ",
  "btn.save":               "محفوظ کریں",
  "btn.close":              "بند کریں",
  "btn.edit":               "ترمیم کریں",
  "btn.delete":             "حذف کریں",
  "btn.view":               "دیکھیں",

  /* ── Placeholder strings ─────────────────────────────────── */
  "placeholder.childName":  "بچے کا نام درج کریں",
  "placeholder.age":        "مثلاً 18",
  "placeholder.weight":     "مثلاً 7.5",
  "placeholder.height":     "مثلاً 75",
  "placeholder.muac":       "مثلاً 12.5",
  "placeholder.searchFood": "کھانا تلاش کریں…",
  "placeholder.searchSaved":"نام سے تلاش کریں…",
  "placeholder.pin":        "پن داخل کریں",
  "placeholder.hospitalName":"مثلاً ڈی ایچ کیو ہسپتال لاہور",
  "placeholder.location":   "مثلاً لاہور، پنجاب",

  /* ── Badge / status labels ───────────────────────────────── */
  "badge.sam":              "SAM",
  "badge.mam":              "MAM",
  "badge.normal":           "نارمل",
  "badge.edema":            "سوجن",
  "badge.stabilization":    "استحکام",
  "badge.transition":       "منتقلی",
  "badge.rehabilitation":   "بحالی",
  "badge.months":           "ماہ",
  "badge.years":            "سال",

  /* ── Toast messages ──────────────────────────────────────── */
  "toast.assessmentSaved":  "تشخیص محفوظ ہو گئی",
  "toast.dietSaved":        "خوراک کا منصوبہ محفوظ ہو گیا",
  "toast.pinCorrect":       "پن تصدیق ہو گیا — ترمیم فعال ہے",
  "toast.pinWrong":         "پن غلط ہے",
  "toast.hospitalSaved":    "ہسپتال سیٹ اپ محفوظ ہو گیا",
  "toast.loggedOut":        "لاگ آوٹ ہو گیا",
  "toast.langChanged":      "زبان تبدیل ہو گئی",
});
