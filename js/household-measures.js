/* ═══════════════════════════════════════════════════════════════
   household-measures.js  —  SehatMand Bachay
   Pakistani household measure → approximate grams lookup.
   Lets caregivers specify amounts in units they know at home
   rather than weighing food exactly.

   Gram values are rounded averages based on:
     • Pakistan Institute of Nutrition typical portion data
     • Standard kitchen measure conversions (ml ≈ g for water-based foods)
     • Commonly observed Pakistani serving customs
═══════════════════════════════════════════════════════════════ */

const HouseholdMeasures = (() => {

  /* ─────────────────────────────────────────────────────────────
     MEASURE DEFINITIONS
     Each entry: { label, labelUrdu, grams, icon }
     'grams' is the approximate weight of that measure of the food.
  ───────────────────────────────────────────────────────────── */

  /* ── Universal (always shown last as a fallback group) ─────── */
  const UNIVERSAL = [
    { label: "1 tsp",        labelUrdu: "1 چائے چمچ",      grams: 5,   icon: "🥄" },
    { label: "1 tbsp",       labelUrdu: "1 کھانے کا چمچ",  grams: 15,  icon: "🥄" },
    { label: "2 tbsp",       labelUrdu: "2 کھانے کے چمچ",  grams: 30,  icon: "🥄" },
    { label: "¼ cup",        labelUrdu: "پاؤ کپ",           grams: 60,  icon: "🫙" },
    { label: "½ cup",        labelUrdu: "آدھا کپ",          grams: 120, icon: "🫙" },
    { label: "1 cup",        labelUrdu: "1 کپ",             grams: 240, icon: "🫙" },
    { label: "100 g",        labelUrdu: "100 گرام",         grams: 100, icon: "⚖️" },
    { label: "150 g",        labelUrdu: "150 گرام",         grams: 150, icon: "⚖️" },
    { label: "200 g",        labelUrdu: "200 گرام",         grams: 200, icon: "⚖️" },
  ];

  /* ── Category-based measures ───────────────────────────────── */
  const BY_CATEGORY = {

    grain: [
      { label: "1 small roti",       labelUrdu: "1 چھوٹی روٹی",      grams: 40,  icon: "🫓" },
      { label: "1 medium roti",      labelUrdu: "1 درمیانی روٹی",    grams: 65,  icon: "🫓" },
      { label: "1 large roti",       labelUrdu: "1 بڑی روٹی",        grams: 90,  icon: "🫓" },
      { label: "1 naan",             labelUrdu: "1 نان",              grams: 120, icon: "🥙" },
      { label: "1 small katori rice",labelUrdu: "1 چھوٹی کٹوری چاول",grams: 130, icon: "🍚" },
      { label: "1 katori rice",      labelUrdu: "1 کٹوری چاول",      grams: 180, icon: "🍚" },
      { label: "1 small plate rice", labelUrdu: "1 چھوٹی پلیٹ چاول", grams: 280, icon: "🍽" },
      { label: "2 tbsp dry flour",   labelUrdu: "2 کھانے چمچ آٹا",   grams: 20,  icon: "🌾" },
      { label: "1 bowl porridge",    labelUrdu: "1 پیالہ دلیہ",       grams: 220, icon: "🥣" },
    ],

    legume: [
      { label: "1 tbsp dry daal",    labelUrdu: "1 چمچ خشک دال",     grams: 15,  icon: "🥄" },
      { label: "1 katori cooked",    labelUrdu: "1 کٹوری پکی دال",   grams: 180, icon: "🍲" },
      { label: "1½ katori cooked",   labelUrdu: "ڈیڑھ کٹوری دال",    grams: 270, icon: "🍲" },
      { label: "1 small cup",        labelUrdu: "1 چھوٹا پیالہ",      grams: 120, icon: "🥣" },
      { label: "1 tbsp besan",       labelUrdu: "1 چمچ بیسن",         grams: 12,  icon: "🥄" },
    ],

    dairy: [
      { label: "1 tsp",              labelUrdu: "1 چائے چمچ دودھ",   grams: 5,   icon: "🥄" },
      { label: "1 tbsp",             labelUrdu: "1 کھانے چمچ دودھ",  grams: 15,  icon: "🥄" },
      { label: "¼ glass",            labelUrdu: "پاؤ گلاس دودھ",     grams: 60,  icon: "🥛" },
      { label: "½ glass",            labelUrdu: "آدھا گلاس دودھ",    grams: 120, icon: "🥛" },
      { label: "1 glass",            labelUrdu: "1 گلاس دودھ",        grams: 240, icon: "🥛" },
      { label: "1 large glass",      labelUrdu: "1 بڑا گلاس دودھ",   grams: 320, icon: "🥛" },
      { label: "1 katori yogurt",    labelUrdu: "1 کٹوری دہی",        grams: 150, icon: "🥣" },
      { label: "1 tbsp malai/cream", labelUrdu: "1 چمچ بالائی",       grams: 14,  icon: "🥄" },
      { label: "1 tbsp milk powder", labelUrdu: "1 چمچ دودھ پاؤڈر",  grams: 12,  icon: "🥄" },
    ],

    protein: [
      { label: "1 small egg",        labelUrdu: "1 چھوٹا انڈہ",      grams: 40,  icon: "🥚" },
      { label: "1 medium egg",       labelUrdu: "1 درمیانہ انڈہ",    grams: 55,  icon: "🥚" },
      { label: "1 large egg",        labelUrdu: "1 بڑا انڈہ",        grams: 65,  icon: "🥚" },
      { label: "1 small piece meat", labelUrdu: "1 چھوٹا گوشت ٹکڑا", grams: 40,  icon: "🥩" },
      { label: "1 medium piece",     labelUrdu: "1 درمیانہ ٹکڑا",    grams: 75,  icon: "🥩" },
      { label: "1 katori keema",     labelUrdu: "1 کٹوری قیمہ",      grams: 150, icon: "🍲" },
      { label: "1 tbsp peanut butter",labelUrdu:"1 چمچ مونگ پھلی مکھن",grams:16, icon: "🥜" },
      { label: "1 small handful nuts",labelUrdu:"1 مٹھی مونگ پھلی",  grams: 28,  icon: "🥜" },
      { label: "1 matchbox fish",    labelUrdu: "1 ماچس ڈبہ مچھلی",  grams: 30,  icon: "🐟" },
      { label: "1 medium fish piece",labelUrdu: "1 درمیانی مچھلی",   grams: 90,  icon: "🐟" },
    ],

    vegetable: [
      { label: "1 tbsp cooked veg",  labelUrdu: "1 چمچ پکی سبزی",    grams: 20,  icon: "🥄" },
      { label: "1 katori cooked",    labelUrdu: "1 کٹوری پکی سبزی",  grams: 150, icon: "🍲" },
      { label: "1 small plate",      labelUrdu: "1 چھوٹی پلیٹ سبزی", grams: 250, icon: "🍽" },
      { label: "1 medium potato",    labelUrdu: "1 درمیانہ آلو",      grams: 100, icon: "🥔" },
      { label: "1 large potato",     labelUrdu: "1 بڑا آلو",          grams: 150, icon: "🥔" },
      { label: "1 medium carrot",    labelUrdu: "1 درمیانی گاجر",     grams: 70,  icon: "🥕" },
      { label: "1 medium tomato",    labelUrdu: "1 درمیانہ ٹماٹر",    grams: 90,  icon: "🍅" },
    ],

    fruit: [
      { label: "1 small banana",     labelUrdu: "1 چھوٹا کیلا",       grams: 70,  icon: "🍌" },
      { label: "1 medium banana",    labelUrdu: "1 درمیانہ کیلا",     grams: 100, icon: "🍌" },
      { label: "1 large banana",     labelUrdu: "1 بڑا کیلا",         grams: 130, icon: "🍌" },
      { label: "1 medium apple",     labelUrdu: "1 سیب",               grams: 130, icon: "🍎" },
      { label: "1 medium mango",     labelUrdu: "1 آم",                grams: 200, icon: "🥭" },
      { label: "1 slice mango",      labelUrdu: "1 آم کا ٹکڑا",       grams: 60,  icon: "🥭" },
      { label: "1 guava",            labelUrdu: "1 امرود",             grams: 80,  icon: "🍐" },
      { label: "1 medium papaya slice",labelUrdu:"1 ٹکڑا پپیتا",     grams: 100, icon: "🍑" },
      { label: "1 slice watermelon", labelUrdu: "1 ٹکڑا تربوز",       grams: 150, icon: "🍉" },
      { label: "1 katori fruit",     labelUrdu: "1 کٹوری پھل",        grams: 120, icon: "🍲" },
      { label: "2 dates",            labelUrdu: "2 کھجور",             grams: 20,  icon: "🟫" },
      { label: "5 dates",            labelUrdu: "5 کھجور",             grams: 50,  icon: "🟫" },
      { label: "1 tbsp lemon juice", labelUrdu: "1 چمچ لیموں رس",     grams: 15,  icon: "🍋" },
    ],

    fat: [
      { label: "1 tsp ghee/oil",     labelUrdu: "1 چائے چمچ گھی / تیل", grams: 5,  icon: "🧈" },
      { label: "1 tbsp ghee/oil",    labelUrdu: "1 کھانے چمچ گھی / تیل",grams: 14, icon: "🧈" },
      { label: "2 tbsp",             labelUrdu: "2 کھانے چمچ",           grams: 28, icon: "🧈" },
      { label: "¼ cup",              labelUrdu: "پاؤ کپ",                grams: 55, icon: "🫙" },
    ],

    carb: [
      { label: "1 tsp sugar",        labelUrdu: "1 چائے چمچ چینی",   grams: 4,   icon: "🥄" },
      { label: "1 tbsp sugar",       labelUrdu: "1 کھانے چمچ چینی",  grams: 12,  icon: "🥄" },
      { label: "¼ cup sugar",        labelUrdu: "پاؤ کپ چینی",        grams: 50,  icon: "🫙" },
      { label: "1 tbsp honey",       labelUrdu: "1 چمچ شہد",          grams: 21,  icon: "🍯" },
      { label: "1 small piece gur",  labelUrdu: "1 چھوٹا ٹکڑا گڑ",   grams: 20,  icon: "🟫" },
    ],

    mixed: [
      { label: "1 katori (small bowl)", labelUrdu: "1 کٹوری",          grams: 180, icon: "🥣" },
      { label: "1 medium bowl",         labelUrdu: "1 درمیانہ پیالہ",  grams: 250, icon: "🥣" },
      { label: "1 small plate",         labelUrdu: "1 چھوٹی پلیٹ",    grams: 300, icon: "🍽" },
      { label: "1 large plate",         labelUrdu: "1 بڑی پلیٹ",      grams: 450, icon: "🍽" },
      { label: "1 half glass",          labelUrdu: "آدھا گلاس",        grams: 120, icon: "🥛" },
      { label: "1 glass",               labelUrdu: "1 گلاس",           grams: 240, icon: "🥛" },
      { label: "1 small handful",       labelUrdu: "1 چھوٹی مٹھی",    grams: 30,  icon: "✊" },
      { label: "1 handful",             labelUrdu: "1 مٹھی",           grams: 50,  icon: "✊" },
      { label: "1 serving",             labelUrdu: "1 حصہ",            grams: 150, icon: "🍽" },
      { label: "1 roti + katori curry", labelUrdu: "1 روٹی + کٹوری سالن", grams: 245, icon: "🫓" },
    ],

    therapeutic: [
      { label: "1 sachet",           labelUrdu: "1 تھیلی",            grams: 92,  icon: "📦" },
      { label: "½ sachet",           labelUrdu: "آدھی تھیلی",         grams: 46,  icon: "📦" },
      { label: "1 tbsp powder",      labelUrdu: "1 چمچ پاؤڈر",        grams: 12,  icon: "🥄" },
      { label: "1 cup prepared",     labelUrdu: "1 کپ تیار مرکب",     grams: 240, icon: "🫙" },
    ],
  };

  /* ── Food-specific overrides for common items ──────────────── */
  const BY_FOOD_ID = {
    "pk_001": [ // Roti / Chapati
      { label: "1 small roti",    labelUrdu: "1 چھوٹی روٹی",   grams: 40,  icon: "🫓" },
      { label: "1 medium roti",   labelUrdu: "1 درمیانی روٹی", grams: 65,  icon: "🫓" },
      { label: "1 large roti",    labelUrdu: "1 بڑی روٹی",     grams: 90,  icon: "🫓" },
      { label: "2 rotis",         labelUrdu: "2 روٹیاں",        grams: 130, icon: "🫓" },
    ],
    "pk_002": [ // Cooked White Rice
      { label: "1 small katori",  labelUrdu: "1 چھوٹی کٹوری",  grams: 130, icon: "🍚" },
      { label: "1 katori",        labelUrdu: "1 کٹوری",         grams: 180, icon: "🍚" },
      { label: "1 small plate",   labelUrdu: "1 چھوٹی پلیٹ",   grams: 280, icon: "🍽" },
      { label: "1 full plate",    labelUrdu: "1 پوری پلیٹ",     grams: 400, icon: "🍽" },
    ],
    "pk_004": [ // Whole Cow's Milk
      { label: "¼ glass",         labelUrdu: "پاؤ گلاس دودھ",  grams: 60,  icon: "🥛" },
      { label: "½ glass",         labelUrdu: "آدھا گلاس دودھ", grams: 120, icon: "🥛" },
      { label: "1 glass",         labelUrdu: "1 گلاس دودھ",    grams: 240, icon: "🥛" },
      { label: "1 large glass",   labelUrdu: "1 بڑا گلاس",     grams: 320, icon: "🥛" },
      { label: "1 small cup",     labelUrdu: "1 چھوٹا کپ",      grams: 150, icon: "☕" },
    ],
    "pk_005": [ // Yogurt / Dahi
      { label: "1 tbsp",          labelUrdu: "1 چمچ دہی",       grams: 20,  icon: "🥄" },
      { label: "1 small katori",  labelUrdu: "1 چھوٹی کٹوری",   grams: 100, icon: "🥣" },
      { label: "1 katori",        labelUrdu: "1 کٹوری دہی",     grams: 150, icon: "🥣" },
      { label: "1 large katori",  labelUrdu: "1 بڑی کٹوری",    grams: 220, icon: "🥣" },
    ],
    "pk_006": [ // Egg
      { label: "1 small egg",     labelUrdu: "1 چھوٹا انڈہ",    grams: 40,  icon: "🥚" },
      { label: "1 medium egg",    labelUrdu: "1 درمیانہ انڈہ",  grams: 55,  icon: "🥚" },
      { label: "1 large egg",     labelUrdu: "1 بڑا انڈہ",      grams: 65,  icon: "🥚" },
      { label: "2 eggs",          labelUrdu: "2 انڈے",           grams: 110, icon: "🥚" },
    ],
    "pk_007": [ // Banana
      { label: "½ small banana",  labelUrdu: "آدھا کیلا",       grams: 40,  icon: "🍌" },
      { label: "1 small banana",  labelUrdu: "1 چھوٹا کیلا",    grams: 70,  icon: "🍌" },
      { label: "1 medium banana", labelUrdu: "1 درمیانہ کیلا",  grams: 100, icon: "🍌" },
      { label: "1 large banana",  labelUrdu: "1 بڑا کیلا",      grams: 130, icon: "🍌" },
    ],
    "pk_009": [ // Vegetable Oil
      { label: "1 tsp",           labelUrdu: "1 چائے چمچ تیل",  grams: 5,   icon: "🥄" },
      { label: "1 tbsp",          labelUrdu: "1 کھانے چمچ تیل", grams: 14,  icon: "🥄" },
      { label: "2 tbsp",          labelUrdu: "2 کھانے چمچ",     grams: 28,  icon: "🥄" },
    ],
    "pk_010": [ // Khichri
      { label: "1 small katori",  labelUrdu: "1 چھوٹی کٹوری",   grams: 150, icon: "🥣" },
      { label: "1 katori",        labelUrdu: "1 کٹوری کھچڑی",   grams: 220, icon: "🥣" },
      { label: "1 small plate",   labelUrdu: "1 چھوٹی پلیٹ",    grams: 320, icon: "🍽" },
    ],
    "pk_011": [ // Sugar
      { label: "1 tsp",           labelUrdu: "1 چائے چمچ چینی", grams: 4,   icon: "🥄" },
      { label: "1 tbsp",          labelUrdu: "1 کھانے چمچ",     grams: 12,  icon: "🥄" },
      { label: "¼ cup",           labelUrdu: "پاؤ کپ چینی",     grams: 50,  icon: "🫙" },
    ],
    "pk_016": [ // Dates
      { label: "1 date",          labelUrdu: "1 کھجور",          grams: 10,  icon: "🟫" },
      { label: "2 dates",         labelUrdu: "2 کھجور",          grams: 20,  icon: "🟫" },
      { label: "5 dates",         labelUrdu: "5 کھجور",          grams: 50,  icon: "🟫" },
      { label: "10 dates",        labelUrdu: "10 کھجور",         grams: 100, icon: "🟫" },
    ],
    "pk_025": [ // Naan
      { label: "½ naan",          labelUrdu: "آدھا نان",         grams: 60,  icon: "🥙" },
      { label: "1 naan",          labelUrdu: "1 نان",            grams: 120, icon: "🥙" },
      { label: "2 naans",         labelUrdu: "2 نان",            grams: 240, icon: "🥙" },
    ],
    "pk_061": [ // Desi Ghee
      { label: "1 tsp",           labelUrdu: "1 چائے چمچ گھی",  grams: 5,   icon: "🧈" },
      { label: "1 tbsp",          labelUrdu: "1 کھانے چمچ گھی", grams: 14,  icon: "🧈" },
      { label: "2 tbsp",          labelUrdu: "2 کھانے چمچ",     grams: 28,  icon: "🧈" },
    ],
    "pk_062": [ // Honey
      { label: "1 tsp",           labelUrdu: "1 چائے چمچ شہد",  grams: 7,   icon: "🍯" },
      { label: "1 tbsp",          labelUrdu: "1 کھانے چمچ شہد", grams: 21,  icon: "🍯" },
    ],
    "pk_063": [ // Peanut Butter
      { label: "1 tsp",           labelUrdu: "1 چمچ مکھن",      grams: 6,   icon: "🥜" },
      { label: "1 tbsp",          labelUrdu: "1 بڑا چمچ مکھن",  grams: 16,  icon: "🥜" },
      { label: "2 tbsp",          labelUrdu: "2 بڑے چمچ",       grams: 32,  icon: "🥜" },
    ],
    "pk_014": [ // Sooji Halwa
      { label: "1 small katori",  labelUrdu: "1 چھوٹی کٹوری",   grams: 120, icon: "🥣" },
      { label: "1 katori",        labelUrdu: "1 کٹوری حلوہ",    grams: 180, icon: "🥣" },
      { label: "1 small plate",   labelUrdu: "1 چھوٹی پلیٹ",    grams: 250, icon: "🍽" },
    ],
    "pk_066": [ // Kheer
      { label: "1 small katori",  labelUrdu: "1 چھوٹی کٹوری",   grams: 120, icon: "🥣" },
      { label: "1 katori",        labelUrdu: "1 کٹوری کھیر",    grams: 200, icon: "🥣" },
    ],
    "pk_067": [ // Banana Milk Shake
      { label: "½ glass",         labelUrdu: "آدھا گلاس",        grams: 120, icon: "🥛" },
      { label: "1 glass",         labelUrdu: "1 گلاس شیک",      grams: 240, icon: "🥛" },
      { label: "1 large glass",   labelUrdu: "1 بڑا گلاس",      grams: 350, icon: "🥛" },
    ],
    "pk_039": [ // Sweet Lassi
      { label: "½ glass",         labelUrdu: "آدھا گلاس لسی",   grams: 120, icon: "🥛" },
      { label: "1 glass",         labelUrdu: "1 گلاس لسی",      grams: 240, icon: "🥛" },
    ],
    "pk_094": [ // Peanut Laddu
      { label: "1 small laddu",   labelUrdu: "1 چھوٹا لڈو",     grams: 25,  icon: "🥜" },
      { label: "1 medium laddu",  labelUrdu: "1 درمیانہ لڈو",   grams: 40,  icon: "🥜" },
      { label: "2 laddus",        labelUrdu: "2 لڈو",            grams: 80,  icon: "🥜" },
    ],
    "pk_093": [ // Suji Laddu
      { label: "1 small laddu",   labelUrdu: "1 چھوٹا لڈو",     grams: 25,  icon: "🟡" },
      { label: "1 medium laddu",  labelUrdu: "1 درمیانہ لڈو",   grams: 40,  icon: "🟡" },
      { label: "2 laddus",        labelUrdu: "2 لڈو",            grams: 80,  icon: "🟡" },
    ],
    "pk_075": [ // ORS
      { label: "½ glass",         labelUrdu: "آدھا گلاس ORS",   grams: 120, icon: "🥛" },
      { label: "1 glass",         labelUrdu: "1 گلاس ORS",      grams: 240, icon: "🥛" },
      { label: "1 large glass",   labelUrdu: "1 بڑا گلاس",      grams: 350, icon: "🥛" },
    ],
    "pk_097": [ // Chicken Biryani
      { label: "1 small katori",  labelUrdu: "1 چھوٹی کٹوری",   grams: 150, icon: "🥣" },
      { label: "1 katori",        labelUrdu: "1 کٹوری بریانی",  grams: 220, icon: "🥣" },
      { label: "1 small plate",   labelUrdu: "1 چھوٹی پلیٹ",    grams: 320, icon: "🍽" },
      { label: "1 full plate",    labelUrdu: "1 پوری پلیٹ",     grams: 450, icon: "🍽" },
    ],
    "pk_106": [ // Daal Shorba
      { label: "½ glass",         labelUrdu: "آدھا گلاس شوربہ",  grams: 120, icon: "🥛" },
      { label: "1 glass",         labelUrdu: "1 گلاس شوربہ",    grams: 240, icon: "🥛" },
      { label: "1 katori",        labelUrdu: "1 کٹوری شوربہ",   grams: 200, icon: "🥣" },
    ],
    "pk_107": [ // Vegetable Soup
      { label: "½ glass",         labelUrdu: "آدھا گلاس سوپ",   grams: 120, icon: "🥛" },
      { label: "1 glass",         labelUrdu: "1 گلاس سوپ",      grams: 240, icon: "🥛" },
      { label: "1 katori",        labelUrdu: "1 کٹوری سوپ",     grams: 200, icon: "🥣" },
    ],
    "pk_108": [ // Chicken Yakhni
      { label: "½ glass",         labelUrdu: "آدھا گلاس یخنی",  grams: 120, icon: "🥛" },
      { label: "1 glass",         labelUrdu: "1 گلاس یخنی",     grams: 240, icon: "🥛" },
    ],
    "pk_118": [ // Mango Lassi
      { label: "½ glass",         labelUrdu: "آدھا گلاس",        grams: 120, icon: "🥛" },
      { label: "1 glass",         labelUrdu: "1 گلاس لسی",      grams: 240, icon: "🥛" },
    ],
    "pk_119": [ // Chicken Corn Soup
      { label: "1 cup",           labelUrdu: "1 پیالہ سوپ",      grams: 200, icon: "🥣" },
      { label: "1 glass",         labelUrdu: "1 گلاس سوپ",      grams: 240, icon: "🥛" },
    ],
  };

  /* ── Public: get measures for a food ──────────────────────── */

  /**
   * Returns an array of measure options for the given food.
   * Merges food-specific + category-based + universal options.
   * @param {object} food  Full food object from LOCAL_FOODS
   * @returns {Array<{ label, labelUrdu, grams, icon }>}
   */
  function getMeasures(food) {
    if (!food) return UNIVERSAL;

    const specific  = BY_FOOD_ID[food.id]           || [];
    const category  = BY_CATEGORY[food.category]    || [];

    // Deduplicate by label, food-specific takes precedence
    const seen = new Set();
    const merged = [...specific, ...category].filter(m => {
      const key = m.label;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Always append universal gram shortcuts at the end (deduplicated)
    UNIVERSAL.forEach(u => {
      if (!seen.has(u.label)) merged.push(u);
    });

    return merged;
  }

  /**
   * Given a gram amount, find the closest matching measure label
   * for display in the diet chart ("≈ 1 katori").
   */
  function getClosestLabel(food, grams) {
    const measures = getMeasures(food);
    if (!measures.length) return null;
    let best = null, bestDiff = Infinity;
    for (const m of measures) {
      const diff = Math.abs(m.grams - grams);
      if (diff < bestDiff) { bestDiff = diff; best = m; }
    }
    // Only show label if within 25% of target grams
    if (best && bestDiff <= grams * 0.25) return best;
    return null;
  }

  return { getMeasures, getClosestLabel };

})();
