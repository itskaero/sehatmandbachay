/* ═══════════════════════════════════════════════════════════════
   pdf-export.js
   PDF generation using jsPDF + print-friendly HTML for Urdu output.
   English PDF via jsPDF autoTable.
   Urdu printout via browser print with styled HTML.
═══════════════════════════════════════════════════════════════ */

const PDFExport = (() => {

  /* ── English PDF via jsPDF ────────────────────────────────── */

  function generate(ctx, dietItems, totals, targets, phase, classification) {
    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

      const pageW  = doc.internal.pageSize.getWidth();
      const margin = 14;
      let y = margin;

      /* ── Header ── */
      doc.setFillColor(26, 127, 90);
      doc.rect(0, 0, pageW, 22, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("SehatMand Bachay — Pediatric Diet Plan", margin, 10);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text("Pediatric SAM Diet Planner | Pakistan", margin, 17);
      doc.text(new Date().toLocaleDateString("en-PK"), pageW - margin, 17, { align: "right" });

      y = 30;

      /* ── Patient Info ── */
      const patientName  = ctx?.name || "Unnamed Patient";
      const ageMonths    = ctx?.ageMonths ? NutritionCalc.formatAge(ctx.ageMonths) : "—";
      const weight       = ctx?.weight ? ctx.weight + " kg" : "—";
      const muac         = ctx?.muac ? ctx.muac + " cm" : "—";

      doc.setTextColor(30, 41, 59);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("Patient Information", margin, y);
      y += 6;

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      const infoRows = [
        ["Patient Name", patientName,      "Classification", classification || "—"],
        ["Age",          ageMonths,         "Phase",          phase],
        ["Weight",       weight,            "MUAC",           muac],
        ["Date",         new Date().toLocaleDateString("en-PK"), "Target Calories", targets.kcalTarget ? targets.kcalTarget + " kcal/day" : "—"]
      ];

      infoRows.forEach(row => {
        doc.setFont("helvetica", "bold");
        doc.setTextColor(71, 85, 105);
        doc.text(row[0] + ":", margin, y);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(30, 41, 59);
        doc.text(row[1], margin + 30, y);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(71, 85, 105);
        doc.text(row[2] + ":", pageW / 2, y);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(30, 41, 59);
        doc.text(row[3], pageW / 2 + 30, y);
        y += 6;
      });

      /* ── Classification Alert ── */
      y += 3;
      const badgeColor = classification === "SAM" ? [220, 38, 38]
                       : classification === "MAM" ? [217, 119, 6]
                       : [22, 163, 74];
      doc.setFillColor(...badgeColor);
      doc.roundedRect(margin, y, pageW - margin * 2, 10, 2, 2, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      const alertText = classification === "SAM"
        ? "⚠ SEVERE ACUTE MALNUTRITION — Monitor closely. Use F-75 in stabilization phase."
        : classification === "MAM"
        ? "⚠ MODERATE ACUTE MALNUTRITION — Nutritional support required."
        : "✓ Normal nutritional status — Continue preventive nutrition.";
      doc.text(alertText, pageW / 2, y + 6.5, { align: "center" });
      y += 16;

      /* ── Nutritional Requirements ── */
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("Daily Nutritional Requirements", margin, y);
      y += 6;

      const reqData = [
        ["Calories", `${targets.kcalMin || "—"}–${targets.kcalMax || "—"} kcal/day (Target: ${targets.kcalTarget || "—"} kcal)`],
        ["Protein",  `${targets.protMin || "—"}–${targets.protMax || "—"} g/day`],
        ["Fat",      `${targets.fatMin  || "—"}–${targets.fatMax  || "—"} g/day`],
        ["Formula",  targets.formula || "Local foods"]
      ];

      reqData.forEach(([label, value]) => {
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(71, 85, 105);
        doc.text(label + ":", margin, y);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(30, 41, 59);
        doc.text(value, margin + 25, y);
        y += 5.5;
      });

      /* ── Diet Chart Table ── */
      y += 4;
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 41, 59);
      doc.text("Diet Chart", margin, y);
      y += 6;

      if (typeof doc.autoTable === "function") {
        const rows = dietItems.map(item => {
          const f = item.food.per100g;
          const x = item.amount / 100;
          return [
            item.meal,
            item.food.name,
            item.amount + "g",
            Math.round(f.calories * x),
            (f.protein * x).toFixed(1) + "g",
            (f.fat     * x).toFixed(1) + "g"
          ];
        });

        doc.autoTable({
          startY: y,
          head: [["Meal Time", "Food Item", "Amount", "Calories", "Protein", "Fat"]],
          body: rows,
          margin: { left: margin, right: margin },
          headStyles: {
            fillColor: [26, 127, 90],
            textColor: 255,
            fontStyle: "bold",
            fontSize: 9
          },
          bodyStyles: { fontSize: 8.5, textColor: [30, 41, 59] },
          alternateRowStyles: { fillColor: [240, 247, 244] },
          columnStyles: {
            0: { cellWidth: 38 },
            1: { cellWidth: 55 },
            2: { cellWidth: 20 },
            3: { cellWidth: 22 },
            4: { cellWidth: 22 },
            5: { cellWidth: 22 }
          }
        });
        y = doc.lastAutoTable.finalY + 8;
      } else {
        // Fallback: manual table rendering
        const colX = [margin, margin + 50, margin + 100, margin + 125, margin + 148, margin + 167];
        const headers = ["Meal", "Food", "Amount", "kcal", "Prot", "Fat"];
        doc.setFillColor(26, 127, 90);
        doc.rect(margin, y, pageW - margin * 2, 7, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        headers.forEach((h, i) => doc.text(h, colX[i] + 1, y + 5));
        y += 9;
        doc.setTextColor(30, 41, 59);
        doc.setFont("helvetica", "normal");
        dietItems.forEach((item, idx) => {
          if (idx % 2 === 0) { doc.setFillColor(240, 247, 244); doc.rect(margin, y - 1, pageW - margin * 2, 6.5, "F"); }
          const f = item.food.per100g, x = item.amount / 100;
          const row = [item.meal.substring(0, 15), item.food.name.substring(0, 22), item.amount + "g",
            Math.round(f.calories * x), (f.protein * x).toFixed(1), (f.fat * x).toFixed(1)];
          row.forEach((v, i) => doc.text(String(v), colX[i] + 1, y + 4));
          y += 6.5;
        });
        y += 4;
      }

      /* ── Totals Row ── */
      doc.setFillColor(26, 127, 90);
      doc.rect(margin, y, pageW - margin * 2, 10, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text(`TOTAL: ${Math.round(totals.calories)} kcal | Protein: ${totals.protein.toFixed(1)}g | Fat: ${totals.fat.toFixed(1)}g | Carbs: ${totals.carbs.toFixed(1)}g`, pageW / 2, y + 6.5, { align: "center" });
      y += 16;

      /* ── Instructions ── */
      const calPct = targets.kcalTarget ? Math.round((totals.calories / targets.kcalTarget) * 100) : 0;
      const statusNote = calPct >= 90 && calPct <= 115
        ? "✓ Calorie intake is within target range."
        : calPct < 70
        ? "⚠ Calorie intake is below target. Consider increasing portions or adding high-energy foods."
        : "⚠ Calorie intake may be too high for SAM stabilization phase. Review plan.";

      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 41, 59);
      doc.text("Clinical Notes:", margin, y);
      y += 5;
      doc.setFont("helvetica", "normal");
      const notes = [
        statusNote,
        "• Give small frequent meals — 6–8 times per day for SAM patients.",
        "• Add 1–2 tsp of oil/ghee to increase calorie density without increasing volume.",
        "• Ensure food is soft, mashed, or pureed for children under 12 months.",
        "• Monitor weight every 1–2 days during stabilization phase.",
        "• Report any vomiting, diarrhea, or respiratory distress to the medical team immediately."
      ];
      notes.forEach(note => {
        const lines = doc.splitTextToSize(note, pageW - margin * 2);
        doc.text(lines, margin, y);
        y += lines.length * 5;
      });

      /* ── Footer ── */
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(7.5);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(148, 163, 184);
        doc.text("SehatMand Bachay — Pediatric Diet Planner | For clinical use only | Not a substitute for medical judgment", pageW / 2, 290, { align: "center" });
        doc.text(`Page ${i} of ${pageCount}`, pageW - margin, 290, { align: "right" });
      }

      const fileName = `DietPlan_${(ctx?.name || "Patient").replace(/\s/g, "_")}_${Date.now()}.pdf`;
      doc.save(fileName);
      AppController.showToast("PDF exported successfully!", "success");

    } catch (err) {
      console.error("[PDF Export]", err);
      AppController.showToast("PDF export failed: " + err.message, "error");
    }
  }

  /* ── Urdu Print HTML ──────────────────────────────────────── */

  function buildPrintSection(ctx, dietItems, totals, targets, phase, classification) {
    const el = document.getElementById("print-section");
    if (!el) return;

    const name   = ctx?.name || "نامعلوم مریض";
    const weight = ctx?.weight ? ctx.weight + " کلوگرام" : "—";
    const age    = ctx?.ageMonths ? NutritionCalc.formatAge(ctx.ageMonths) : "—";
    const date   = new Date().toLocaleDateString("ur-PK");

    const classUrdu = classification === "SAM" ? "شدید غذائی قلت (SAM)"
                    : classification === "MAM" ? "اعتدال یافتہ غذائی قلت (MAM)"
                    : "معمول";

    const phaseUrdu = phase === "Stabilization" ? "استحکام کا مرحلہ"
                    : phase === "Transition"     ? "منتقلی کا مرحلہ"
                    : "بحالی کا مرحلہ";

    const dietRows = dietItems.map(item => {
      const kcal = Math.round(item.food.per100g.calories * item.amount / 100);
      const urduName = item.food.nameUrdu || item.food.name;
      return `<tr>
        <td style="text-align:right;">${escHtml(item.meal)}</td>
        <td style="text-align:right;">${item.food.emoji || ""} ${escHtml(urduName)}</td>
        <td style="text-align:center;">${item.amount} گرام</td>
        <td style="text-align:center;">${kcal} کیلوری</td>
      </tr>`;
    }).join("");

    el.innerHTML = `
      <div class="print-doc" dir="rtl" style="font-family: 'Noto Nastaliq Urdu', serif; padding: 15mm; color: #000;">
        <div class="print-header" style="text-align:center; border-bottom: 3px solid #1a7f5a; padding-bottom: 12px; margin-bottom: 16px;">
          <h1 style="color: #1a7f5a; font-size: 1.4rem; margin: 0;">سیہت مند بچے</h1>
          <p style="font-size: .9rem; color: #555; margin-top: 4px;">خوراک کا منصوبہ — پیڈیاٹرک غذائی قلت علاج</p>
        </div>

        <table style="width:100%; border-collapse:collapse; margin-bottom:16px; font-size:.9rem;">
          <tr>
            <td style="padding:6px; border:1px solid #ddd; font-weight:bold;">بچے کا نام</td>
            <td style="padding:6px; border:1px solid #ddd;">${escHtml(name)}</td>
            <td style="padding:6px; border:1px solid #ddd; font-weight:bold;">تشخیص</td>
            <td style="padding:6px; border:1px solid #ddd;">${classUrdu}</td>
          </tr>
          <tr>
            <td style="padding:6px; border:1px solid #ddd; font-weight:bold;">عمر</td>
            <td style="padding:6px; border:1px solid #ddd;">${escHtml(age)}</td>
            <td style="padding:6px; border:1px solid #ddd; font-weight:bold;">علاج کا مرحلہ</td>
            <td style="padding:6px; border:1px solid #ddd;">${phaseUrdu}</td>
          </tr>
          <tr>
            <td style="padding:6px; border:1px solid #ddd; font-weight:bold;">وزن</td>
            <td style="padding:6px; border:1px solid #ddd;">${escHtml(weight)}</td>
            <td style="padding:6px; border:1px solid #ddd; font-weight:bold;">تاریخ</td>
            <td style="padding:6px; border:1px solid #ddd;">${date}</td>
          </tr>
        </table>

        <h3 style="color:#1a7f5a; margin-bottom:8px;">روزانہ ضروری خوراک</h3>
        <table style="width:100%; border-collapse:collapse; font-size:.9rem;">
          <thead>
            <tr style="background:#1a7f5a; color:#fff;">
              <th style="padding:8px; text-align:right;">وقت</th>
              <th style="padding:8px; text-align:right;">خوراک</th>
              <th style="padding:8px; text-align:center;">مقدار</th>
              <th style="padding:8px; text-align:center;">کیلوری</th>
            </tr>
          </thead>
          <tbody>${dietRows}</tbody>
          <tfoot>
            <tr style="background:#e8f5ef; font-weight:bold;">
              <td colspan="2" style="padding:8px; text-align:right;">کل</td>
              <td style="padding:8px; text-align:center;">—</td>
              <td style="padding:8px; text-align:center;">${Math.round(totals.calories)} کیلوری</td>
            </tr>
          </tfoot>
        </table>

        <div style="margin-top:20px; padding:12px; background:#fffbeb; border-right:4px solid #d97706; font-size:.85rem; line-height:2;">
          <strong>⚠ اہم ہدایات:</strong><br/>
          • دن میں ۶ سے ۸ بار تھوڑی تھوڑی مقدار میں خوراک دیں<br/>
          • کھانے میں ایک سے دو چمچ تیل یا گھی ضرور ملائیں<br/>
          • چھوٹے بچوں کے لئے خوراک نرم یا میشڈ ہونی چاہیے<br/>
          • الٹی، دست یا سانس میں تکلیف ہو تو فوری ڈاکٹر سے ملیں<br/>
          • F-75 فارمولا استحکام کے مرحلے میں استعمال کریں<br/>
          • وزن ہر یا دو دن بعد چیک کریں<br/>
        </div>

        <div style="margin-top:16px; padding:12px; background:#f0f7f4; border-right:4px solid #1a7f5a; font-size:.85rem; line-height:1.8;">
          <strong>کل غذائیت:</strong>
          کیلوری: ${Math.round(totals.calories)} |
          پروٹین: ${totals.protein.toFixed(1)}گ |
          چکنائی: ${totals.fat.toFixed(1)}گ |
          کاربوہائیڈریٹ: ${totals.carbs.toFixed(1)}گ
        </div>

        <p style="text-align:center; font-size:.75rem; color:#999; margin-top:24px;">
          سیہت مند بچے — طبی امداد کا ذریعہ | صرف ڈاکٹر کی نگرانی میں استعمال کریں
        </p>
      </div>`;
  }

  /* ── Public API ────────────────────────────────────────────── */
  return { generate, buildPrintSection };

})();
