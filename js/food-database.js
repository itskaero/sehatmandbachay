/* ═══════════════════════════════════════════════════════════════
   food-database.js  –  SehatMand Bachay
   Comprehensive Pakistani food library (89 foods) + Firebase
   CRUD operations for custom food management.
   Nutrient values per 100 g sourced from:
     • Pakistan National Nutrition Survey 2018
     • Pakistan Food Composition Table (PFCT, 2019)
     • USDA Food Data Central (FDC 2023)
     • WHO / UNICEF SAM Food composition guides
═══════════════════════════════════════════════════════════════ */

/* ════════════════════════════════════════════════════════════════
   PRE-LOADED PAKISTANI FOOD LIBRARY  (89 items)
   Structure per food:
     id        – unique string (pk_NNN)
     name      – English name
     nameUrdu  – Urdu equivalent
     emoji     – single Unicode emoji / character
     category  – grain | legume | dairy | protein | vegetable |
                 fruit | fat | carb | mixed | therapeutic | other
     cost      – low | medium | high
     per100g   – { calories, protein, carbs, fat }  (all in g)
     tips      – Clinical / preparation tip
     isLocal   – true = pre-loaded, false = therapeutic/import
════════════════════════════════════════════════════════════════ */

const LOCAL_FOODS = [

  /* ── CEREALS & GRAINS ───────────────────────────────────────── */
  {
    id: "pk_001",
    name: "Roti / Chapati (Whole Wheat)",
    nameUrdu: "گندم کی روٹی",
    emoji: "🫓", category: "grain", cost: "low",
    per100g: { calories: 297, protein: 9.3, carbs: 60.8, fat: 3.5 },
    tips: "Mash with milk or daal for young children. Whole wheat roti preferred — more iron, fibre & B-vitamins than maida.",
    isLocal: true
  },
  {
    id: "pk_002",
    name: "Cooked White Rice",
    nameUrdu: "سفید پکے چاول",
    emoji: "🍚", category: "grain", cost: "low",
    per100g: { calories: 130, protein: 2.7, carbs: 28.2, fat: 0.3 },
    tips: "Very easy to digest. Mix with daal or stir in a teaspoon of ghee to increase calorie density.",
    isLocal: true
  },
  {
    id: "pk_002b",
    name: "Brown / Basmati Rice (Cooked)",
    nameUrdu: "براؤن / باسمتی چاول",
    emoji: "🍚", category: "grain", cost: "low",
    per100g: { calories: 132, protein: 2.9, carbs: 27.5, fat: 0.5 },
    tips: "More iron and fibre than white rice. Cook very soft and blend with daal for nutritious baby food.",
    isLocal: true
  },
  {
    id: "pk_013",
    name: "Whole Wheat Flour (Atta)",
    nameUrdu: "گندم کا آٹا",
    emoji: "🌾", category: "grain", cost: "low",
    per100g: { calories: 364, protein: 12.0, carbs: 77.0, fat: 1.5 },
    tips: "Used for roti and porridge. Acts as cereal component in local F-75 recipe (35 g per litre).",
    isLocal: true
  },
  {
    id: "pk_014",
    name: "Sooji Halwa (Semolina Pudding, cooked with milk)",
    nameUrdu: "سوجی حلوہ",
    emoji: "🟡", category: "grain", cost: "low",
    per100g: { calories: 180, protein: 3.2, carbs: 30.5, fat: 6.5 },
    tips: "Energy-dense traditional dish. Prepare with full-fat milk and ghee for maximum calorie benefit.",
    isLocal: true
  },
  {
    id: "pk_019",
    name: "Maize / Corn Flour (Makki)",
    nameUrdu: "مکئی کا آٹا",
    emoji: "🌽", category: "grain", cost: "low",
    per100g: { calories: 361, protein: 7.0, carbs: 76.8, fat: 3.9 },
    tips: "Staple in rural Punjab & KPK. Makki roti with saag is a highly nutritious traditional combination.",
    isLocal: true
  },
  {
    id: "pk_020",
    name: "Semolina / Suji (Dry)",
    nameUrdu: "سوجی / رَوا",
    emoji: "🟤", category: "grain", cost: "low",
    per100g: { calories: 360, protein: 12.7, carbs: 72.8, fat: 1.1 },
    tips: "Highly digestible. Cook as a thin porridge for infants. Key cereal component in local F-75 recipe.",
    isLocal: true
  },
  {
    id: "pk_021",
    name: "Oatmeal Porridge (cooked with water)",
    nameUrdu: "جوئی دلیہ",
    emoji: "🥣", category: "grain", cost: "low",
    per100g: { calories: 68, protein: 2.4, carbs: 12.0, fat: 1.4 },
    tips: "Cook with full-fat milk to more than double calorie content. Beta-glucan supports gut healing in SAM.",
    isLocal: true
  },
  {
    id: "pk_022",
    name: "White Bread / Pav Roti",
    nameUrdu: "ڈبل روٹی",
    emoji: "🍞", category: "grain", cost: "low",
    per100g: { calories: 265, protein: 8.4, carbs: 51.6, fat: 3.3 },
    tips: "Soft texture suitable for young children. Spread with peanut butter, ghee or cream for extra calories.",
    isLocal: true
  },
  {
    id: "pk_023",
    name: "Rice Kanji / Thin Rice Porridge",
    nameUrdu: "چاول کی کانجی",
    emoji: "🍶", category: "grain", cost: "low",
    per100g: { calories: 55, protein: 1.1, carbs: 12.4, fat: 0.2 },
    tips: "Traditional convalescent food. Easy to swallow for ill children. Enrich with milk, egg and sugar.",
    isLocal: true
  },
  {
    id: "pk_024",
    name: "Wheat Dalia (Broken-wheat Porridge, cooked)",
    nameUrdu: "گندم کا دلیہ",
    emoji: "🥣", category: "grain", cost: "low",
    per100g: { calories: 90, protein: 3.1, carbs: 18.5, fat: 0.8 },
    tips: "High-fibre, nutritious porridge. Prepare with full-fat milk, sugar and ghee for a calorie-dense meal.",
    isLocal: true
  },
  {
    id: "pk_025",
    name: "Naan (Leavened White Bread)",
    nameUrdu: "نان",
    emoji: "🥙", category: "grain", cost: "low",
    per100g: { calories: 310, protein: 9.1, carbs: 57.7, fat: 4.9 },
    tips: "Soft and easy to chew. Pull into small pieces for young children. Serve alongside daal or milk.",
    isLocal: true
  },
  {
    id: "pk_082",
    name: "Pasta / Macaroni (cooked)",
    nameUrdu: "پاستا / مکرونی",
    emoji: "🍝", category: "grain", cost: "low",
    per100g: { calories: 158, protein: 5.8, carbs: 30.9, fat: 0.9 },
    tips: "Well-cooked pasta is very soft. Blend with milk cheese sauce for a calorie-dense infant meal.",
    isLocal: true
  },

  /* ── PULSES & LEGUMES ───────────────────────────────────────── */
  {
    id: "pk_003",
    name: "Masoor Daal (Red Lentils, cooked)",
    nameUrdu: "مسور دال",
    emoji: "🍲", category: "legume", cost: "low",
    per100g: { calories: 116, protein: 9.0, carbs: 20.1, fat: 0.4 },
    tips: "Fastest-cooking daal. Best affordable protein for SAM recovery. Combine with roti for complete amino acids.",
    isLocal: true
  },
  {
    id: "pk_027",
    name: "Mung Daal (Split Green Gram, cooked)",
    nameUrdu: "مونگ دال",
    emoji: "🟢", category: "legume", cost: "low",
    per100g: { calories: 105, protein: 7.0, carbs: 19.2, fat: 0.4 },
    tips: "Most easily digestible daal. Ideal for ill children. Low gas-forming. Excellent first daal for weaning.",
    isLocal: true
  },
  {
    id: "pk_028",
    name: "Chana Daal (Split Bengal Gram, cooked)",
    nameUrdu: "چنا دال",
    emoji: "🟡", category: "legume", cost: "low",
    per100g: { calories: 164, protein: 8.7, carbs: 27.2, fat: 2.6 },
    tips: "Rich in protein and folate. Cook thoroughly. Blend for young children. Good source on non-haem iron.",
    isLocal: true
  },
  {
    id: "pk_030",
    name: "Arhar / Toor Daal (Pigeon Peas, cooked)",
    nameUrdu: "تور / ارہر دال",
    emoji: "🟠", category: "legume", cost: "low",
    per100g: { calories: 116, protein: 6.8, carbs: 21.1, fat: 0.4 },
    tips: "Widely used across Pakistan. Good protein and folate source. Thin consistency works well for young children.",
    isLocal: true
  },
  {
    id: "pk_031",
    name: "Urad Daal (Split Black Gram, cooked)",
    nameUrdu: "اڑد دال",
    emoji: "⚫", category: "legume", cost: "low",
    per100g: { calories: 127, protein: 8.7, carbs: 22.6, fat: 0.6 },
    tips: "High protein and iron. Cook until very soft. Mash well for young children. Traditional strengthening food.",
    isLocal: true
  },
  {
    id: "pk_018",
    name: "Chickpeas / Kabuli Chana (cooked)",
    nameUrdu: "کابلی چنے",
    emoji: "🫛", category: "legume", cost: "low",
    per100g: { calories: 164, protein: 8.9, carbs: 27.4, fat: 2.6 },
    tips: "High protein and iron. Mash thoroughly or blend into hummus for young children.",
    isLocal: true
  },
  {
    id: "pk_029",
    name: "Kidney Beans / Rajma (cooked)",
    nameUrdu: "لوبیا / راجما",
    emoji: "🫘", category: "legume", cost: "low",
    per100g: { calories: 127, protein: 8.7, carbs: 22.8, fat: 0.5 },
    tips: "Must be thoroughly boiled to destroy lectins. High in iron. Mash well for young children.",
    isLocal: true
  },
  {
    id: "pk_032",
    name: "Chickpea Flour / Besan (raw, dry)",
    nameUrdu: "بیسن",
    emoji: "🟤", category: "legume", cost: "low",
    per100g: { calories: 387, protein: 22.4, carbs: 57.8, fat: 6.7 },
    tips: "Highest-protein flour. Stir into porridge to boost protein density. Also used in laddu (traditional energy ball).",
    isLocal: true
  },
  {
    id: "pk_033",
    name: "Soybeans (boiled / cooked)",
    nameUrdu: "سویا بین",
    emoji: "🟡", category: "legume", cost: "medium",
    per100g: { calories: 173, protein: 16.6, carbs: 9.9, fat: 9.0 },
    tips: "Highest plant protein of all legumes. Add soya flour (atta) to fortify porridges and baked foods.",
    isLocal: true
  },

  /* ── DAIRY PRODUCTS ─────────────────────────────────────────── */
  {
    id: "pk_004",
    name: "Whole Cow's Milk (full-fat, fresh)",
    nameUrdu: "گائے کا دودھ",
    emoji: "🥛", category: "dairy", cost: "medium",
    per100g: { calories: 61, protein: 3.2, carbs: 4.8, fat: 3.3 },
    tips: "Full-fat preferred for malnourished children. Key ingredient in local F-75. Never dilute for SAM patients.",
    isLocal: true
  },
  {
    id: "pk_005",
    name: "Yogurt / Dahi (full-fat)",
    nameUrdu: "دہی",
    emoji: "🥣", category: "dairy", cost: "low",
    per100g: { calories: 61, protein: 3.5, carbs: 4.7, fat: 3.3 },
    tips: "Probiotics support gut repair in SAM. Easy to digest. Excellent protein and calcium source.",
    isLocal: true
  },
  {
    id: "pk_034",
    name: "Full-fat Dried Whole Milk Powder",
    nameUrdu: "سوکھا دودھ (پورا چکنائی)",
    emoji: "🥛", category: "dairy", cost: "medium",
    per100g: { calories: 496, protein: 26.3, carbs: 38.4, fat: 26.7 },
    tips: "Reconstitute 125 g in 1000 ml water for whole milk equivalent. Use in porridges and therapeutic formulas.",
    isLocal: true
  },
  {
    id: "pk_083",
    name: "Dried Skimmed Milk / DSM (low-fat powder)",
    nameUrdu: "سوکھا مکھن نکالا دودھ",
    emoji: "🥛", category: "dairy", cost: "medium",
    per100g: { calories: 362, protein: 36.0, carbs: 52.0, fat: 0.8 },
    tips: "Core WHO F-75 ingredient: 25 g/L. F-100: 80 g/L. Very high protein. Available at pharmacies.",
    isLocal: false
  },
  {
    id: "pk_035",
    name: "Khoya / Mawa (Dried Evaporated Milk)",
    nameUrdu: "کھویا / ماوا",
    emoji: "🧀", category: "dairy", cost: "medium",
    per100g: { calories: 421, protein: 21.8, carbs: 31.8, fat: 25.9 },
    tips: "Energy and protein dense. Stir into porridges, halwa or sweet dishes for a calorie boost.",
    isLocal: true
  },
  {
    id: "pk_036",
    name: "Paneer (Fresh Soft Cheese)",
    nameUrdu: "پنیر",
    emoji: "🧀", category: "dairy", cost: "medium",
    per100g: { calories: 265, protein: 18.3, carbs: 3.4, fat: 20.8 },
    tips: "High protein and calcium, low carbs. Soft texture for young children. Crumble or blend into food.",
    isLocal: true
  },
  {
    id: "pk_037",
    name: "Heavy Cream / Malai (fresh, thick)",
    nameUrdu: "بالائی / ملائی",
    emoji: "🫙", category: "dairy", cost: "medium",
    per100g: { calories: 340, protein: 2.1, carbs: 2.8, fat: 36.1 },
    tips: "Very calorie-dense. Add 1 tbsp to any dish to boost energy without significantly increasing volume.",
    isLocal: true
  },
  {
    id: "pk_039",
    name: "Sweet Lassi (full-fat yogurt drink)",
    nameUrdu: "میٹھی لسی",
    emoji: "🥤", category: "dairy", cost: "low",
    per100g: { calories: 70, protein: 3.3, carbs: 10.1, fat: 1.9 },
    tips: "Probiotic drink with calcium and protein. Add extra sugar for more energy. Good transition-phase food.",
    isLocal: true
  },

  /* ── EGGS, POULTRY & MEAT ───────────────────────────────────── */
  {
    id: "pk_006",
    name: "Hen's Egg (boiled, ~50 g each)",
    nameUrdu: "ابلا انڈہ",
    emoji: "🥚", category: "protein", cost: "low",
    per100g: { calories: 155, protein: 13.0, carbs: 1.1, fat: 11.0 },
    tips: "Complete high-quality protein. 1 egg ≈ 50 g = 78 kcal, 6.5 g protein. Cheapest complete protein source.",
    isLocal: true
  },
  {
    id: "pk_040",
    name: "Egg Yolk Only (raw or soft-cooked)",
    nameUrdu: "انڈے کی زردی",
    emoji: "🟡", category: "protein", cost: "low",
    per100g: { calories: 322, protein: 15.9, carbs: 3.6, fat: 26.5 },
    tips: "Nutrient powerhouse — iron, zinc, vitamins A, D, B12 and choline. Start at 6 months. 1 yolk/day recommended.",
    isLocal: true
  },
  {
    id: "pk_041",
    name: "Scrambled Egg (pan-fried with oil)",
    nameUrdu: "انڈے کی بھجیہ / آملیٹ",
    emoji: "🍳", category: "protein", cost: "low",
    per100g: { calories: 185, protein: 13.6, carbs: 1.3, fat: 14.1 },
    tips: "Soft texture ideal for toddlers. Add a splash of milk when scrambling for extra calcium.",
    isLocal: true
  },
  {
    id: "pk_012",
    name: "Chicken (broiler, boneless, cooked)",
    nameUrdu: "مرغی کا گوشت",
    emoji: "🍗", category: "protein", cost: "medium",
    per100g: { calories: 165, protein: 31.0, carbs: 0.0, fat: 3.6 },
    tips: "Excellent high-protein food for rehabilitation phase. Shred or mince finely for young children.",
    isLocal: true
  },
  {
    id: "pk_042",
    name: "Beef (lean, cooked / stewed)",
    nameUrdu: "گائے کا گوشت",
    emoji: "🥩", category: "protein", cost: "medium",
    per100g: { calories: 217, protein: 26.1, carbs: 0.0, fat: 12.0 },
    tips: "Richest source of haem iron among meats — best absorbed form. Critical for anaemia recovery. Shred finely.",
    isLocal: true
  },
  {
    id: "pk_043",
    name: "Mutton / Lamb (cooked)",
    nameUrdu: "بکرے / مینڈھے کا گوشت",
    emoji: "🍖", category: "protein", cost: "high",
    per100g: { calories: 258, protein: 25.6, carbs: 0.0, fat: 16.6 },
    tips: "Rich in iron and zinc. Higher fat than chicken — good calorie density for rehabilitation phase.",
    isLocal: true
  },
  {
    id: "pk_044",
    name: "Liver — Chicken or Beef (cooked)",
    nameUrdu: "کلیجی",
    emoji: "🟤", category: "protein", cost: "low",
    per100g: { calories: 175, protein: 24.2, carbs: 4.1, fat: 5.9 },
    tips: "Best single source of haem iron, zinc, vitamin A and B12. Offer 1–2×/week. Critical for anaemia in SAM.",
    isLocal: true
  },
  {
    id: "pk_047",
    name: "Keema (minced meat, cooked)",
    nameUrdu: "قیمہ",
    emoji: "🥩", category: "protein", cost: "medium",
    per100g: { calories: 245, protein: 24.7, carbs: 0.0, fat: 15.8 },
    tips: "Finely minced = soft texture for toddlers. Blend with mashed potato or rice for infants. Iron-rich.",
    isLocal: true
  },
  {
    id: "pk_045",
    name: "Rohu / Carp Fish (cooked, carefully deboned)",
    nameUrdu: "روہو مچھلی",
    emoji: "🐟", category: "protein", cost: "medium",
    per100g: { calories: 148, protein: 25.0, carbs: 0.0, fat: 5.3 },
    tips: "High-quality protein and omega-3 fatty acids. Remove ALL bones with great care before offering to children.",
    isLocal: true
  },
  {
    id: "pk_046",
    name: "Tuna (canned in water, drained)",
    nameUrdu: "ٹونا مچھلی (ڈبہ بند)",
    emoji: "🐡", category: "protein", cost: "medium",
    per100g: { calories: 116, protein: 25.5, carbs: 0.0, fat: 1.0 },
    tips: "Convenient high-protein option. Mix into mashed potato or rice. DHA supports brain development.",
    isLocal: true
  },
  {
    id: "pk_048",
    name: "Sardines (canned in oil)",
    nameUrdu: "سارڈین مچھلی",
    emoji: "🐟", category: "protein", cost: "medium",
    per100g: { calories: 208, protein: 24.6, carbs: 0.0, fat: 11.5 },
    tips: "Soft bones = excellent calcium & phosphorus. Mash thoroughly. Good omega-3 and vitamin D source.",
    isLocal: true
  },
  {
    id: "pk_015",
    name: "Peanuts / Groundnuts (roasted, unsalted)",
    nameUrdu: "مونگ پھلی",
    emoji: "🥜", category: "protein", cost: "low",
    per100g: { calories: 567, protein: 25.8, carbs: 16.1, fat: 49.2 },
    tips: "Base of RUTF (Plumpy'Nut). Grind to smooth paste for young children. Very high energy + protein at low cost.",
    isLocal: true
  },
  {
    id: "pk_063",
    name: "Peanut Butter (smooth, unsalted)",
    nameUrdu: "مونگ پھلی کا مکھن",
    emoji: "🥜", category: "protein", cost: "medium",
    per100g: { calories: 588, protein: 25.0, carbs: 20.0, fat: 50.4 },
    tips: "Core RUTF ingredient. Most calorie-dense affordable food. Spread on bread or mix into porridge.",
    isLocal: true
  },

  /* ── VEGETABLES ─────────────────────────────────────────────── */
  {
    id: "pk_008",
    name: "Potato (boiled / mashed)",
    nameUrdu: "ابلا یا میشڈ آلو",
    emoji: "🥔", category: "vegetable", cost: "low",
    per100g: { calories: 87, protein: 1.9, carbs: 20.1, fat: 0.1 },
    tips: "Mash with ghee and full-fat milk for a calorie-dense purée. Good potassium and vitamin C source.",
    isLocal: true
  },
  {
    id: "pk_049",
    name: "Sweet Potato / Shakarkandi (boiled)",
    nameUrdu: "شکر قندی",
    emoji: "🍠", category: "vegetable", cost: "low",
    per100g: { calories: 90, protein: 2.0, carbs: 20.7, fat: 0.1 },
    tips: "Rich in beta-carotene (vitamin A) — critical nutrient in SAM recovery. Natural sweetness appeals to children.",
    isLocal: true
  },
  {
    id: "pk_050",
    name: "Carrot / Gajar (cooked or pureed)",
    nameUrdu: "گاجر",
    emoji: "🥕", category: "vegetable", cost: "low",
    per100g: { calories: 35, protein: 0.8, carbs: 8.2, fat: 0.2 },
    tips: "Excellent vitamin A source. Always pair with a fat (ghee/oil) to enhance beta-carotene absorption.",
    isLocal: true
  },
  {
    id: "pk_017",
    name: "Spinach / Palak (cooked)",
    nameUrdu: "پالک",
    emoji: "🥬", category: "vegetable", cost: "low",
    per100g: { calories: 23, protein: 3.0, carbs: 3.6, fat: 0.3 },
    tips: "Rich in folate, iron and vitamin A. Serve with vitamin-C food (lemon juice, tomato) to boost iron absorption.",
    isLocal: true
  },
  {
    id: "pk_070",
    name: "Saag / Mustard Greens (cooked)",
    nameUrdu: "ساگ / سرسوں کا ساگ",
    emoji: "🥬", category: "vegetable", cost: "low",
    per100g: { calories: 30, protein: 2.6, carbs: 4.0, fat: 0.5 },
    tips: "Rich in iron, calcium and vitamins A & C. Add ghee to improve nutrient absorption and palatability.",
    isLocal: true
  },
  {
    id: "pk_051",
    name: "Pumpkin / Kaddu (cooked)",
    nameUrdu: "کدو",
    emoji: "🎃", category: "vegetable", cost: "low",
    per100g: { calories: 26, protein: 1.0, carbs: 6.5, fat: 0.1 },
    tips: "Very high beta-carotene content. Extremely soft when cooked — ideal for infants. Blend with milk.",
    isLocal: true
  },
  {
    id: "pk_052",
    name: "Bottle Gourd / Lauki / Ghia (cooked)",
    nameUrdu: "لوکی / گھیا",
    emoji: "🟢", category: "vegetable", cost: "low",
    per100g: { calories: 14, protein: 0.6, carbs: 3.3, fat: 0.0 },
    tips: "Highly hydrating and very easy to digest. Traditional weaning food. Always combine with daal or milk.",
    isLocal: true
  },
  {
    id: "pk_053",
    name: "Green Peas / Hare Matar (cooked)",
    nameUrdu: "مٹر",
    emoji: "🟢", category: "vegetable", cost: "low",
    per100g: { calories: 84, protein: 5.4, carbs: 14.5, fat: 0.4 },
    tips: "Good plant protein for a vegetable. Blend into khichri or daal for extra nutrients.",
    isLocal: true
  },
  {
    id: "pk_054",
    name: "Tomato (fresh or cooked)",
    nameUrdu: "ٹماٹر",
    emoji: "🍅", category: "vegetable", cost: "low",
    per100g: { calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2 },
    tips: "Rich in vitamin C and lycopene. Add to daal — vitamin C significantly boosts iron absorption.",
    isLocal: true
  },
  {
    id: "pk_055",
    name: "Cauliflower / Phool Gobhi (cooked)",
    nameUrdu: "پھول گوبھی",
    emoji: "🥦", category: "vegetable", cost: "low",
    per100g: { calories: 25, protein: 1.9, carbs: 5.3, fat: 0.3 },
    tips: "Good vitamin C and folate source. Mash with potato and ghee for a nutrient-dense, calorie-rich purée.",
    isLocal: true
  },
  {
    id: "pk_084",
    name: "Bitter Gourd / Karela (cooked)",
    nameUrdu: "کریلا",
    emoji: "🥒", category: "vegetable", cost: "low",
    per100g: { calories: 17, protein: 1.0, carbs: 3.7, fat: 0.2 },
    tips: "Nutritious but very bitter. Use sparingly. Good for blood sugar regulation in older children and adults.",
    isLocal: true
  },
  {
    id: "pk_085",
    name: "Onion / Pyaz (raw or cooked)",
    nameUrdu: "پیاز",
    emoji: "🧅", category: "vegetable", cost: "low",
    per100g: { calories: 40, protein: 1.1, carbs: 9.3, fat: 0.1 },
    tips: "Used in virtually all Pakistani cooking. Adds flavour, quercetin antioxidants, and trace minerals.",
    isLocal: true
  },
  {
    id: "pk_091",
    name: "Brinjal / Eggplant / Baingan (cooked)",
    nameUrdu: "بینگن",
    emoji: "🍆", category: "vegetable", cost: "low",
    per100g: { calories: 25, protein: 1.0, carbs: 5.9, fat: 0.2 },
    tips: "Soft when cooked. Mash into purée for young children. Low in calories — combine with ghee to boost energy.",
    isLocal: true
  },

  /* ── FRUITS ─────────────────────────────────────────────────── */
  {
    id: "pk_007",
    name: "Banana (ripe)",
    nameUrdu: "کیلا",
    emoji: "🍌", category: "fruit", cost: "low",
    per100g: { calories: 89, protein: 1.1, carbs: 22.8, fat: 0.3 },
    tips: "Easy concentrated energy. Mash for infants. Rich in potassium and vitamin B6. Helps recovery from diarrhea.",
    isLocal: true
  },
  {
    id: "pk_016",
    name: "Dates / Khajoor (dried)",
    nameUrdu: "کھجور",
    emoji: "🟫", category: "fruit", cost: "low",
    per100g: { calories: 277, protein: 1.8, carbs: 74.0, fat: 0.2 },
    tips: "Very energy-dense natural food with iron and potassium. Soak and mash for young children.",
    isLocal: true
  },
  {
    id: "pk_056",
    name: "Mango (ripe, fresh)",
    nameUrdu: "آم",
    emoji: "🥭", category: "fruit", cost: "low",
    per100g: { calories: 60, protein: 0.8, carbs: 15.0, fat: 0.4 },
    tips: "Rich in beta-carotene (vitamin A) and vitamin C. Seasonal summer fruit — excellent for SAM rehabilitation.",
    isLocal: true
  },
  {
    id: "pk_057",
    name: "Guava / Amrood (fresh)",
    nameUrdu: "امرود",
    emoji: "🍐", category: "fruit", cost: "low",
    per100g: { calories: 68, protein: 2.6, carbs: 14.3, fat: 1.0 },
    tips: "Extremely high vitamin C (228 mg/100g — 5× that of orange). Boosts iron absorption from plant foods.",
    isLocal: true
  },
  {
    id: "pk_058",
    name: "Papaya (ripe, fresh)",
    nameUrdu: "پپیتا",
    emoji: "🍑", category: "fruit", cost: "low",
    per100g: { calories: 43, protein: 0.5, carbs: 10.8, fat: 0.3 },
    tips: "Rich in vitamins A and C. Papain enzyme aids protein digestion. Soft flesh — ideal for young children.",
    isLocal: true
  },
  {
    id: "pk_059",
    name: "Apple (fresh, with skin)",
    nameUrdu: "سیب",
    emoji: "🍎", category: "fruit", cost: "medium",
    per100g: { calories: 52, protein: 0.3, carbs: 13.8, fat: 0.2 },
    tips: "Grate or puree for infants. Pectin helps with diarrhea recovery. Good early weaning fruit.",
    isLocal: true
  },
  {
    id: "pk_060",
    name: "Orange / Kinnu (fresh juice or segments)",
    nameUrdu: "سنگترہ / کنو",
    emoji: "🍊", category: "fruit", cost: "low",
    per100g: { calories: 45, protein: 0.7, carbs: 11.2, fat: 0.2 },
    tips: "Excellent vitamin C source. Give alongside iron-rich foods to significantly boost iron absorption.",
    isLocal: true
  },
  {
    id: "pk_086",
    name: "Watermelon / Tarbuz (fresh)",
    nameUrdu: "تربوز",
    emoji: "🍉", category: "fruit", cost: "low",
    per100g: { calories: 30, protein: 0.6, carbs: 7.6, fat: 0.2 },
    tips: "Hydrating summer fruit with vitamins A and C. Blend for infants. Excellent for hot-season rehydration.",
    isLocal: true
  },
  {
    id: "pk_087",
    name: "Grapes (fresh, seedless)",
    nameUrdu: "انگور",
    emoji: "🍇", category: "fruit", cost: "medium",
    per100g: { calories: 69, protein: 0.7, carbs: 18.1, fat: 0.2 },
    tips: "Rich in antioxidants. Always peel and halve (or quarter) before giving to children — choking hazard.",
    isLocal: true
  },
  {
    id: "pk_092",
    name: "Pomegranate / Anar (seeds/juice)",
    nameUrdu: "انار",
    emoji: "🍎", category: "fruit", cost: "medium",
    per100g: { calories: 83, protein: 1.7, carbs: 18.7, fat: 1.2 },
    tips: "Very high antioxidants. Rich in folate and vitamin C. Traditional iron-recovery fruit in Pakistan.",
    isLocal: true
  },

  /* ── FATS, OILS & SWEETENERS ────────────────────────────────── */
  {
    id: "pk_009",
    name: "Vegetable / Sunflower / Canola Oil",
    nameUrdu: "سبزیوں کا تیل",
    emoji: "🫙", category: "fat", cost: "medium",
    per100g: { calories: 900, protein: 0.0, carbs: 0.0, fat: 100.0 },
    tips: "Add 1–2 tsp (5–10 ml) to any food to add 45–90 kcal with almost zero volume increase. Essential in SAM.",
    isLocal: true
  },
  {
    id: "pk_061",
    name: "Desi Ghee (clarified butter)",
    nameUrdu: "دیسی گھی",
    emoji: "🧈", category: "fat", cost: "medium",
    per100g: { calories: 900, protein: 0.0, carbs: 0.0, fat: 99.5 },
    tips: "Traditional calorie-dense fat with fat-soluble vitamins A, D, E & K. Add to all cooked dishes freely.",
    isLocal: true
  },
  {
    id: "pk_038",
    name: "Butter / Makhan",
    nameUrdu: "مکھن",
    emoji: "🧈", category: "fat", cost: "medium",
    per100g: { calories: 717, protein: 0.9, carbs: 0.1, fat: 81.1 },
    tips: "Rich in fat-soluble vitamins. Spread on bread or stir into porridge. Good substitute if ghee unavailable.",
    isLocal: true
  },
  {
    id: "pk_064",
    name: "Coconut Oil",
    nameUrdu: "ناریل کا تیل",
    emoji: "🥥", category: "fat", cost: "medium",
    per100g: { calories: 892, protein: 0.0, carbs: 0.0, fat: 99.1 },
    tips: "MCTs are absorbed directly without bile salt emulsification — beneficial when gut function is impaired in SAM.",
    isLocal: true
  },
  {
    id: "pk_011",
    name: "White Sugar (refined)",
    nameUrdu: "چینی",
    emoji: "🍬", category: "carb", cost: "low",
    per100g: { calories: 387, protein: 0.0, carbs: 100.0, fat: 0.0 },
    tips: "Use to increase energy density of F-75 (70 g/L) and F-100 (50 g/L). Add to porridges and drinks.",
    isLocal: true
  },
  {
    id: "pk_062",
    name: "Pure Honey / Shehad",
    nameUrdu: "شہد",
    emoji: "🍯", category: "carb", cost: "medium",
    per100g: { calories: 304, protein: 0.3, carbs: 82.4, fat: 0.0 },
    tips: "⚠️ NEVER give to infants under 12 months — risk of infant botulism. For older children: energy + antioxidants.",
    isLocal: true
  },
  {
    id: "pk_088",
    name: "Jaggery / Gur (Palm or Cane)",
    nameUrdu: "گڑ",
    emoji: "🟫", category: "carb", cost: "low",
    per100g: { calories: 383, protein: 0.4, carbs: 98.0, fat: 0.1 },
    tips: "Unrefined sweetener with small amounts of iron and minerals. Slightly more nutritious than white sugar.",
    isLocal: true
  },

  /* ── TRADITIONAL MIXED DISHES ───────────────────────────────── */
  {
    id: "pk_010",
    name: "Khichri (Rice + Daal, cooked with ghee)",
    nameUrdu: "کھچڑی",
    emoji: "🍳", category: "mixed", cost: "low",
    per100g: { calories: 110, protein: 5.0, carbs: 20.0, fat: 2.5 },
    tips: "Traditional Pakistani recovery food. Very easily digestible. Add extra ghee to increase calorie density.",
    isLocal: true
  },
  {
    id: "pk_065",
    name: "Haleem (Wheat + Meat Porridge)",
    nameUrdu: "حلیم",
    emoji: "🍲", category: "mixed", cost: "medium",
    per100g: { calories: 140, protein: 9.5, carbs: 18.0, fat: 3.5 },
    tips: "Complete protein + energy dish. Traditional weaning food. Soft texture, easy to chew. Rich in iron.",
    isLocal: true
  },
  {
    id: "pk_066",
    name: "Kheer (Rice Milk Pudding)",
    nameUrdu: "کھیر",
    emoji: "🍮", category: "mixed", cost: "low",
    per100g: { calories: 130, protein: 4.5, carbs: 20.5, fat: 3.8 },
    tips: "Energy and protein-rich from milk. Sweet taste readily accepted by children. Good rehabilitation food.",
    isLocal: true
  },
  {
    id: "pk_068",
    name: "Milk Dalia (warm wheat porridge with milk)",
    nameUrdu: "دودھ دلیہ",
    emoji: "🥣", category: "mixed", cost: "low",
    per100g: { calories: 115, protein: 4.2, carbs: 17.5, fat: 3.1 },
    tips: "Classic childhood food. Prepare with full-fat milk, added sugar and 1 tsp ghee. Easy home preparation.",
    isLocal: true
  },
  {
    id: "pk_067",
    name: "Banana Milk Shake (full-fat milk + ripe banana)",
    nameUrdu: "دودھ کیلا شیک",
    emoji: "🥤", category: "mixed", cost: "low",
    per100g: { calories: 92, protein: 3.0, carbs: 16.8, fat: 2.3 },
    tips: "Calorie-dense, sweet drink that children readily accept. Easy to prepare at home. Add sugar if needed.",
    isLocal: true
  },
  {
    id: "pk_069",
    name: "Aloo Gosht (Potato–Meat Curry)",
    nameUrdu: "آلو گوشت",
    emoji: "🍛", category: "mixed", cost: "medium",
    per100g: { calories: 120, protein: 8.0, carbs: 8.5, fat: 6.1 },
    tips: "Complete meal — protein, carbs, fat. Mash the potato and shred meat finely for young children.",
    isLocal: true
  },
  {
    id: "pk_089",
    name: "Daal Chawal (Cooked Daal + Rice)",
    nameUrdu: "دال چاول",
    emoji: "🍛", category: "mixed", cost: "low",
    per100g: { calories: 120, protein: 5.8, carbs: 22.0, fat: 1.2 },
    tips: "Most common affordable Pakistani meal — complementary plant protein. Add ghee to increase calorie density.",
    isLocal: true
  },
  {
    id: "pk_090",
    name: "Anda Paratha (Egg-stuffed Flatbread)",
    nameUrdu: "انڈہ پراٹھا",
    emoji: "🥚", category: "mixed", cost: "low",
    per100g: { calories: 280, protein: 9.5, carbs: 35.0, fat: 12.0 },
    tips: "Complete meal with protein, carbs and fat. Popular breakfast. Tear into small pieces for young children.",
    isLocal: true
  },
  {
    id: "pk_093",
    name: "Suji Energy Laddu (Semolina + Ghee + Sugar)",
    nameUrdu: "سوجی کا لڈو",
    emoji: "🟡", category: "mixed", cost: "low",
    per100g: { calories: 430, protein: 7.5, carbs: 62.0, fat: 17.5 },
    tips: "Traditional energy-dense snack. Each 30g ball = ~130 kcal. Easy to make at home. Good between-meal energy boost.",
    isLocal: true
  },
  {
    id: "pk_094",
    name: "Peanut Energy Laddu (Peanut + Jaggery + Sesame)",
    nameUrdu: "مونگ پھلی کا لڈو",
    emoji: "🥜", category: "mixed", cost: "low",
    per100g: { calories: 490, protein: 15.0, carbs: 48.0, fat: 28.0 },
    tips: "Homemade RUTF-like snack. Very high energy and protein. Each 30g ball ≈ 145 kcal + 4.5g protein.",
    isLocal: true
  },

  /* ── THERAPEUTIC & SPECIAL FOODS ───────────────────────────── */
  {
    id: "pk_071",
    name: "RUTF / Plumpy'Nut (92 g sachet)",
    nameUrdu: "RUTF خصوصی علاجی خوراک",
    emoji: "🟤", category: "therapeutic", cost: "high",
    per100g: { calories: 520, protein: 13.5, carbs: 44.7, fat: 31.0 },
    tips: "WHO gold standard for SAM outpatient rehabilitation. 1 sachet (92g) = 500 kcal. Dose strictly per weight.",
    isLocal: false
  },
  {
    id: "pk_072",
    name: "RUSF / Plumpy'Sup (92 g sachet)",
    nameUrdu: "RUSF معاون خوراک",
    emoji: "🟡", category: "therapeutic", cost: "high",
    per100g: { calories: 470, protein: 10.0, carbs: 58.0, fat: 22.0 },
    tips: "WHO standard for MAM treatment. 1 sachet/day for 6–59 months. Give alongside normal family foods.",
    isLocal: false
  },
  {
    id: "pk_073",
    name: "CSB++ / Corn-Soy Blend (fortified powder)",
    nameUrdu: "مکئی سویا بلینڈ (CSB++)",
    emoji: "🌽", category: "therapeutic", cost: "medium",
    per100g: { calories: 410, protein: 21.0, carbs: 57.5, fat: 11.0 },
    tips: "UNICEF supplementary food for MAM. Mix 80 g powder + 350 ml water for thick porridge. 17 fortified nutrients.",
    isLocal: false
  },
  {
    id: "pk_074",
    name: "BP-100 Fortified Biscuit",
    nameUrdu: "بی پی ۱۰۰ علاجی بسکٹ",
    emoji: "🍪", category: "therapeutic", cost: "high",
    per100g: { calories: 500, protein: 14.0, carbs: 58.0, fat: 24.0 },
    tips: "Fortified therapeutic biscuit for SAM rehabilitation where RUTF unavailable. 175g/day in 3–4 sessions.",
    isLocal: false
  },
  {
    id: "pk_083b",
    name: "DSM / Dried Skimmed Milk (therapeutic grade, powder)",
    nameUrdu: "سوکھا مکھن نکالا دودھ (علاجی)",
    emoji: "🥛", category: "therapeutic", cost: "medium",
    per100g: { calories: 362, protein: 36.0, carbs: 52.0, fat: 0.8 },
    tips: "Core WHO F-75 ingredient: 25 g/L. F-100: 80 g/L. Very high protein content. Available at pharmacies.",
    isLocal: false
  },
  {
    id: "pk_075",
    name: "ORS — Oral Rehydration Salts (200 ml prepared solution)",
    nameUrdu: "او آر ایس (نمک شکر کا پانی)",
    emoji: "💧", category: "therapeutic", cost: "low",
    per100g: { calories: 14, protein: 0.0, carbs: 3.6, fat: 0.0 },
    tips: "Give for diarrhea in malnourished children. 75 ml/kg over 4 hours for mild-moderate dehydration. Can be home-prepared.",
    isLocal: false
  }

];

/* ════════════════════════════════════════════════════════════════
   FoodDB Module — Rendering, Search & Firebase CRUD
════════════════════════════════════════════════════════════════ */

const FoodDB = (() => {

  let firebaseFoods = [];
  let searchTerm    = "";

  /* ── Init ───────────────────────────────────────────────────── */

  async function init() {
    await loadFirebaseFoods();
    renderLocalFoods();
    renderFirebaseFoods();
    updateCounts();
  }

  /* ── Load custom foods ──────────────────────────────────────── */

  async function loadFirebaseFoods() {
    try {
      firebaseFoods = await dbGetAll("foods");
    } catch {
      firebaseFoods = [];
    }
  }

  /* ── Accessors ──────────────────────────────────────────────── */

  function getAllFoods() {
    return [...LOCAL_FOODS, ...firebaseFoods];
  }

  function getFoodById(id) {
    return getAllFoods().find(f => f.id === id) || null;
  }

  /* ── Render grids ───────────────────────────────────────────── */

  function renderLocalFoods(filter) {
    const term = typeof filter === "string" ? filter : searchTerm;
    const grid = document.getElementById("local-foods-grid");
    if (!grid) return;
    const filtered = LOCAL_FOODS.filter(f => matchesSearch(f, term));
    grid.innerHTML = filtered.length
      ? filtered.map(f => buildFoodCard(f, false)).join("")
      : `<div class="empty-state"><i class="fas fa-search fa-2x"></i><p>No matching foods found</p></div>`;
  }

  function renderFirebaseFoods(filter) {
    const term = typeof filter === "string" ? filter : searchTerm;
    const grid = document.getElementById("firebase-foods-grid");
    if (!grid) return;
    const filtered = firebaseFoods.filter(f => matchesSearch(f, term));
    if (!filtered.length) {
      grid.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-cloud-upload-alt fa-2x"></i>
          <p>No custom foods yet.<br/>
          Click <strong>+ Add Food Item</strong> to add your own local foods.</p>
        </div>`;
      return;
    }
    grid.innerHTML = filtered.map(f => buildFoodCard(f, true)).join("");
  }

  function matchesSearch(food, term) {
    if (!term) return true;
    const t = term.toLowerCase();
    return (
      food.name.toLowerCase().includes(t) ||
      (food.nameUrdu || "").includes(term) ||
      food.category.includes(t)
    );
  }

  /* ── Build food card ────────────────────────────────────────── */

  function buildFoodCard(food, editable) {
    const catLabel  = categoryLabel(food.category);
    const costClass = { low: "cost-green", medium: "cost-yellow", high: "cost-red" }[food.cost] || "";
    const costText  = { low: "₨ Low Cost", medium: "₨₨ Mid Cost", high: "₨₨₨ High Cost" }[food.cost] || food.cost;

    /* Per-serving quick calculator — 1 typical serving */
    const srv = typicalServing(food.category);
    const srvKcal  = Math.round(food.per100g.calories * srv / 100);
    const srvProt  = (food.per100g.protein  * srv / 100).toFixed(1);

    return `
      <div class="fdb-card" id="fdb-${food.id}">
        ${food.isLocal ? '<div class="fdb-local-tag">BUILT-IN</div>' : '<div class="fdb-local-tag special">SPECIAL</div>'}
        <div class="fdb-top">
          <span class="fdb-emoji" role="img">${food.emoji || "🍽️"}</span>
          <div class="fdb-title">
            <div class="fdb-name">${escHtml(food.name)}</div>
            ${food.nameUrdu ? `<div class="fdb-urdu" dir="rtl" lang="ur">${food.nameUrdu}</div>` : ""}
          </div>
        </div>
        <div class="fdb-category-tag">${catLabel}</div>
        <div class="fdb-macros">
          <span class="fdb-macro kcal-tag" title="Calories per 100g">
            ⚡ <strong>${food.per100g.calories}</strong> kcal
          </span>
          <span class="fdb-macro" title="Protein per 100g">
            🥩 ${food.per100g.protein}g prot
          </span>
          <span class="fdb-macro" title="Fat per 100g">
            🧈 ${food.per100g.fat}g fat
          </span>
          <span class="fdb-macro ${costClass}" title="Relative cost in Pakistan">
            ${costText}
          </span>
        </div>
        <div class="fdb-serving-hint">
          Typical ${srv}g serving ≈ <strong>${srvKcal} kcal</strong>, ${srvProt}g protein
        </div>
        ${food.tips
          ? `<p class="fdb-tips"><i class="fas fa-lightbulb"></i> ${escHtml(food.tips)}</p>`
          : ""}
        <div class="fdb-actions">
          ${editable
            ? `<button class="btn btn-sm btn-outline" onclick="FoodDB.editFood('${food.id}')">
                 <i class="fas fa-edit"></i> Edit
               </button>
               <button class="btn btn-sm btn-danger" onclick="FoodDB.deleteFood('${food.id}')">
                 <i class="fas fa-trash"></i>
               </button>`
            : `<button class="btn btn-sm btn-primary" style="width:100%"
                 onclick="DietPlanner.openAddModal('${food.id}')">
                 <i class="fas fa-plus-circle"></i> Add to Diet
               </button>`}
        </div>
      </div>`;
  }

  /** Typical serving size (g) per category for the preview hint */
  function typicalServing(cat) {
    const map = {
      grain: 80, legume: 100, dairy: 200, protein: 60, vegetable: 100,
      fruit: 100, fat: 10, carb: 15, mixed: 150, therapeutic: 92, other: 100
    };
    return map[cat] || 100;
  }

  function categoryLabel(cat) {
    const map = {
      grain:       "🌾 Grain / Cereal",
      legume:      "🫘 Legume / Pulse",
      dairy:       "🥛 Dairy",
      protein:     "🥩 Protein",
      vegetable:   "🥦 Vegetable",
      fruit:       "🍎 Fruit",
      fat:         "🧈 Fat / Oil",
      carb:        "🍬 Sweetener / Carb",
      mixed:       "🍲 Mixed Dish",
      therapeutic: "💊 Therapeutic",
      beverage:    "🥤 Beverage",
      other:       "🍽️ Other"
    };
    return map[cat] || cat;
  }

  /* ── Search ─────────────────────────────────────────────────── */

  function search(term) {
    searchTerm = term.toLowerCase().trim();
    renderLocalFoods(searchTerm);
    renderFirebaseFoods(searchTerm);
  }

  /* ── Counts ─────────────────────────────────────────────────── */

  function updateCounts() {
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set("local-food-count",    LOCAL_FOODS.length    + " items");
    set("firebase-food-count", firebaseFoods.length + " items");
  }

  /* ── Modal open / close ─────────────────────────────────────── */

  function openModal(foodId) {
    const modal = document.getElementById("modal-food");
    const title = document.getElementById("modal-food-title");
    clearForm();
    if (foodId) {
      title.textContent = "Edit Food Item";
      const food = firebaseFoods.find(f => f.id === foodId);
      if (food) populateForm(food, foodId);
    } else {
      title.textContent = "Add New Food Item";
    }
    if (modal) modal.style.display = "flex";
  }

  function closeModal() {
    const modal = document.getElementById("modal-food");
    if (modal) modal.style.display = "none";
    clearForm();
  }

  function overlayClose(e) {
    if (e.target === document.getElementById("modal-food")) closeModal();
  }

  /* ── Form helpers ────────────────────────────────────────────── */

  function clearForm() {
    const ids = ["food-edit-id","food-name","food-name-urdu","food-emoji",
                 "food-cal","food-prot","food-carb","food-fat","food-tips"];
    ids.forEach(id => { const el = document.getElementById(id); if (el) el.value = ""; });
    const cat  = document.getElementById("food-category"); if (cat)  cat.value  = "grain";
    const cost = document.getElementById("food-cost");     if (cost) cost.value = "low";
  }

  function populateForm(food, editId) {
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val ?? ""; };
    set("food-edit-id",   editId);
    set("food-name",      food.name);
    set("food-name-urdu", food.nameUrdu);
    set("food-category",  food.category || "grain");
    set("food-cost",      food.cost     || "low");
    set("food-emoji",     food.emoji);
    set("food-cal",       food.per100g.calories);
    set("food-prot",      food.per100g.protein);
    set("food-carb",      food.per100g.carbs);
    set("food-fat",       food.per100g.fat);
    set("food-tips",      food.tips);
  }

  /* ── Save food ───────────────────────────────────────────────── */

  async function saveFood() {
    const v = id => (document.getElementById(id)?.value || "").trim();

    const name = v("food-name");
    if (!name) { AppController.showToast("Food name is required", "error"); return; }

    const cal  = parseFloat(v("food-cal"));
    const prot = parseFloat(v("food-prot"));
    const carb = parseFloat(v("food-carb"));
    const fat  = parseFloat(v("food-fat"));

    if ([cal, prot, carb, fat].some(isNaN)) {
      AppController.showToast("All nutrition values must be valid numbers", "error"); return;
    }

    const food = {
      name,
      nameUrdu: v("food-name-urdu"),
      category: v("food-category") || "grain",
      cost:     v("food-cost")     || "low",
      emoji:    v("food-emoji")    || "🍽️",
      per100g:  { calories: cal, protein: prot, carbs: carb, fat },
      tips:     v("food-tips"),
      isLocal:  false
    };

    try {
      const editId = v("food-edit-id");
      if (editId) {
        await dbUpdate("foods", editId, food);
        const idx = firebaseFoods.findIndex(f => f.id === editId);
        if (idx !== -1) firebaseFoods[idx] = { ...firebaseFoods[idx], ...food };
        AppController.showToast("Food updated successfully", "success");
      } else {
        const newId = await dbSave("foods", food);
        firebaseFoods.unshift({ id: newId, ...food });
        AppController.showToast("Food added to database", "success");
      }
      renderFirebaseFoods();
      DietPlanner.refreshFoodLibrary();
      updateCounts();
      closeModal();
    } catch (err) {
      AppController.showToast("Error saving: " + err.message, "error");
    }
  }

  /* ── Edit food ───────────────────────────────────────────────── */

  function editFood(id) {
    if (!firebaseFoods.find(f => f.id === id)) {
      AppController.showToast("Only custom (non built-in) foods can be edited", "warning"); return;
    }
    openModal(id);
  }

  /* ── Delete food ─────────────────────────────────────────────── */

  async function deleteFood(id) {
    if (!confirm("Delete this food item? This cannot be undone.")) return;
    try {
      await dbDelete("foods", id);
      firebaseFoods = firebaseFoods.filter(f => f.id !== id);
      renderFirebaseFoods();
      DietPlanner.refreshFoodLibrary();
      updateCounts();
      AppController.showToast("Food item deleted", "info");
    } catch (err) {
      AppController.showToast("Error deleting: " + err.message, "error");
    }
  }

  /* ── Public API ─────────────────────────────────────────────── */
  return {
    init,
    getAllFoods,
    getFoodById,
    search,
    openModal,
    closeModal,
    overlayClose,
    saveFood,
    editFood,
    deleteFood
  };

})();
