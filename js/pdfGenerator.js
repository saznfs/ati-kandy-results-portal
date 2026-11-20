/**
 * ATI SLIATE Unofficial Results Portal - PDF Certificate Generator
 * Generates an A4 Vector PDF Statement of Results with clean academic styling,
 * multi-page support, balanced per-year pagination, zero orphan headers,
 * and high-contrast typography.
 */

const PortalPdfGenerator = (() => {

  /**
   * Draws decorative academic borders and background watermark on the given page
   */
  function drawPageBackground(doc) {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // 1. Outer decorative navy border
    doc.setDrawColor(15, 43, 92); // Academic Navy #0f2b5c
    doc.setLineWidth(0.8);
    doc.rect(8, 8, pageWidth - 16, pageHeight - 16);

    // 2. Inner decorative gold border
    doc.setDrawColor(217, 119, 6); // Gold #d97706
    doc.setLineWidth(0.3);
    doc.rect(9.5, 9.5, pageWidth - 19, pageHeight - 19);

    // 3. Diagonal background watermark
    doc.saveGraphicsState();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(36);
    doc.setTextColor(230, 235, 245);
    doc.setGState(new doc.GState({ opacity: 0.10 }));
    doc.text("SLIATE KANDY", pageWidth / 2, pageHeight / 2, {
      align: "center",
      angle: 45
    });
    doc.restoreGraphicsState();
  }

  /**
   * Generates and downloads the A4 PDF Certificate for a student
   */
  async function generateCertificate(student) {
    if (!window.jspdf || !window.jspdf.jsPDF) {
      alert("PDF generation library is still loading. Please try again in a moment.");
      return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;
    let y = margin;

    // --- Page 1 Background & Header ---
    drawPageBackground(doc);

    y = 18;

    // Academic Logo Emblem
    const logoImg = document.getElementById("siteLogo");
    if (logoImg && logoImg.complete && logoImg.naturalWidth > 0) {
      try {
        doc.addImage(logoImg, "PNG", margin + 2, 14, 15, 15);
      } catch (e) {
        // Fallback gracefully if CORS prevents direct canvas read
      }
    }

    // Title & Institute Name
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(15, 43, 92);
    doc.text("SLIATE KANDY", pageWidth / 2, y, { align: "center" });

    y += 6;
    doc.setFontSize(10.5);
    doc.setTextColor(37, 99, 235);
    doc.text("EXAMINATION RESULTS RECORD", pageWidth / 2, y, { align: "center" });

    // Decorative divider line
    y += 4;
    doc.setDrawColor(217, 119, 6);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);

    // --- 2. Candidate Information Box ---
    y += 4;
    const infoBoxTop = y;
    const infoBoxHeight = 32;
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin, infoBoxTop, pageWidth - (margin * 2), infoBoxHeight, 2, 2, "F");
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, infoBoxTop, pageWidth - (margin * 2), infoBoxHeight, 2, 2, "S");

    const col1X = margin + 4;
    const col2X = margin + 100;
    let infoY = infoBoxTop + 6;

    // Student Name
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text("STUDENT FULL NAME:", col1X, infoY);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(String(student.name || "N/A"), col1X + 44, infoY);

    // Academic Program
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text("PROGRAM:", col2X, infoY);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(29, 78, 216);
    const progText = (student.programCode === "IT" || (student.program && student.program.includes("Information Technology")))
      ? "HNDIT"
      : (CONFIG.programNames[student.programCode] || student.program || "HNDIT");
    doc.text(doc.splitTextToSize(progText, 70), col2X + 24, infoY);

    infoY += 7.5;
    // Index No
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text("INDEX NUMBER:", col1X, infoY);
    doc.setFont("courier", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(String(student.indexNumber || "N/A"), col1X + 44, infoY);

    // Campus
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text("CAMPUS:", col2X, infoY);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    const campusText = (student.campusCode === "KAN" || (student.campus && student.campus.includes("Kandy")))
      ? "SLIATE Kandy"
      : (CONFIG.campusNames[student.campusCode] || student.campus || "SLIATE Kandy");
    doc.text(campusText, col2X + 24, infoY);

    infoY += 7.5;
    // Academic Year
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text("ACADEMIC YEAR:", col1X, infoY);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(String(student.academicYear || "2023/2024"), col1X + 44, infoY);

    // Total Semesters
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text("TOTAL SEMESTERS:", col2X, infoY);
    doc.setFont("courier", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text(String(student.semesters ? student.semesters.length : 4), col2X + 38, infoY);

    y = infoBoxTop + infoBoxHeight + 5;

    // --- 3. Multi-Semester Results Tables (Balanced Pagination) ---
    const semesters = student.semesters || [];

    semesters.forEach((sem, sIdx) => {
      // Check if we need to advance to Page 2:
      // A) Transition to Year 2 when there are 3+ semesters total (clean Year 1 vs Year 2 split)
      // B) Or insufficient vertical space on current page to hold banner + courses without orphaning
      const isYearBreak = (sIdx > 0 && sem.year > semesters[sIdx - 1].year && semesters.length >= 3);
      const coursesCount = (sem.courses || []).length;
      const estimatedSemesterHeight = 8 + 7 + (coursesCount * 6.2) + 6;
      const spaceRemaining = pageHeight - 24 - y;
      const shouldBreakPage = isYearBreak || (estimatedSemesterHeight > spaceRemaining);

      if (shouldBreakPage && y > 70) {
        doc.addPage();
        drawPageBackground(doc);
        y = 20;

        // Continuation Academic Header
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor(15, 43, 92);
        doc.text("SLIATE KANDY", margin, y);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(37, 99, 235);
        doc.text("STATEMENT OF RESULTS (CONTINUED)", margin + 35, y);

        y += 3.5;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        const continuationMeta = `Student: ${student.name}   |   Index: ${student.indexNumber}   |   Program: HNDIT`;
        doc.text(continuationMeta, margin, y + 2);

        y += 5;
        doc.setDrawColor(217, 119, 6);
        doc.setLineWidth(0.4);
        doc.line(margin, y, pageWidth - margin, y);
        y += 6;
      }

      // Semester Header Bar
      doc.setFillColor(15, 43, 92);
      doc.roundedRect(margin, y, pageWidth - (margin * 2), 7, 1, 1, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(255, 255, 255);
      const semTitle = sem.semesterTitle || `Year ${sem.year} Semester ${sem.semester}`;
      const hasRepeatsInSem = (sem.courses || []).some(c => c.repeatCleared || c.attempt === 2 || c.isRepeat);
      const semHeaderTitle = hasRepeatsInSem ? `${semTitle} (POST-REPEAT / 2ND ATTEMPT)` : semTitle.toUpperCase();
      doc.text(semHeaderTitle, margin + 4, y + 4.8);

      const semStats = `SGPA: ${Number(sem.sgpa || 0).toFixed(2)}`;
      doc.text(semStats, pageWidth - margin - 4, y + 4.8, { align: "right" });

      y += 7.5;

      // Table rows with explicit Attempt indicators
      const tableData = (sem.courses || []).map(c => {
        let attemptText = "1st Attempt";
        if (c.repeatCleared || c.attempt === 2 || c.isRepeat) {
          attemptText = "2nd Attempt";
        } else if (["I(SE)", "I(CA)", "E", "DFR", "AB", "INC"].includes(c.grade)) {
          attemptText = "Repeat Req.";
        }

        return [
          c.code || "-",
          c.title || c.name || "-",
          c.grade || "-",
          c.gradePoint !== undefined ? Number(c.gradePoint).toFixed(2) : "-",
          attemptText
        ];
      });

      doc.autoTable({
        startY: y,
        margin: { left: margin, right: margin, bottom: 20 },
        head: [["Course Code", "Course Title", "Grade", "Points", "Attempt"]],
        body: tableData,
        theme: "plain",
        styles: {
          fontSize: 8.5,
          cellPadding: 2,
          textColor: [15, 23, 42]
        },
        headStyles: {
          fillColor: [241, 245, 249],
          textColor: [51, 65, 85],
          fontStyle: "bold",
          fontSize: 8.5
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252]
        },
        columnStyles: {
          0: { cellWidth: 28, font: "courier", fontStyle: "bold", fontSize: 8.5 },
          1: { cellWidth: "auto", fontSize: 8.5 },
          2: { cellWidth: 18, halign: "center", fontStyle: "bold", fontSize: 9 },
          3: { cellWidth: 18, halign: "center", fontSize: 8.5 },
          4: { cellWidth: 26, halign: "center", fontStyle: "bold", fontSize: 8 }
        },
        didParseCell: function (data) {
          if (data.section === "body" && data.column.index === 4) {
            if (data.cell.raw === "2nd Attempt") {
              data.cell.styles.textColor = [180, 83, 9]; // Amber #b45309
              data.cell.styles.fontStyle = "bold";
            } else if (data.cell.raw === "Repeat Req.") {
              data.cell.styles.textColor = [220, 38, 38]; // Red #dc2626
              data.cell.styles.fontStyle = "bold";
            } else {
              data.cell.styles.textColor = [100, 116, 139]; // Muted slate #64748b
            }
          }
        }
      });

      y = doc.lastAutoTable.finalY + 4;
    });

    // --- 4. Overall Academic Standing & Semester GPAs Box ---
    // Ensure sufficient room for summary box (requires ~34mm)
    if ((pageHeight - 22 - y) < 34) {
      doc.addPage();
      drawPageBackground(doc);
      y = 22;
    }

    const boxWidth = pageWidth - (margin * 2);
    const boxHeight = 31;
    const honours = PortalUI.getHonoursClassification(student.cgpa);
    const sems = student.semesters || [];

    // Summary Card Container
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(37, 99, 235);
    doc.setLineWidth(0.4);
    doc.roundedRect(margin, y, boxWidth, boxHeight, 2, 2, "FD");

    // Title: Semester Grade Point Averages
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text("SEMESTER GRADE POINT AVERAGES (SGPA)", margin + 6, y + 5);

    // Individual Semester Stat Cards (Pills)
    const numSems = Math.max(sems.length, 1);
    const cardGap = 3;
    const totalGaps = cardGap * (numSems - 1);
    const cardWidth = (boxWidth - 12 - totalGaps) / numSems;

    sems.forEach((s, idx) => {
      const cardX = margin + 6 + (idx * (cardWidth + cardGap));
      const cardY = y + 7.5;
      const cardH = 12;

      // Card Background
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.25);
      doc.roundedRect(cardX, cardY, cardWidth, cardH, 1.5, 1.5, "FD");

      // Card Label
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(`YEAR ${s.year} SEM ${s.semester}`, cardX + (cardWidth / 2), cardY + 4.2, { align: "center" });

      // SGPA Value
      doc.setFont("courier", "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(37, 99, 235);
      doc.text(Number(s.sgpa || 0).toFixed(2), cardX + (cardWidth / 2), cardY + 9.8, { align: "center" });
    });

    // Divider Line inside Summary Box
    const honoursY = y + 21.5;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin + 6, honoursY, margin + boxWidth - 6, honoursY);

    // Honours Classification Row (Distinct, high-contrast, zero overlap)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text("ACADEMIC HONOURS:", margin + 8, honoursY + 6.2);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(217, 119, 6); // Academic Gold
    doc.text(`★  ${honours.title.toUpperCase()}  ★`, margin + 54, honoursY + 6.2);

    y += boxHeight + 4;

    // --- 5. Clean Multi-Page Footers (Dynamic "Page X of Y") ---
    const totalPages = doc.internal.getNumberOfPages();
    const dateStr = new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
    const cleanRef = student.indexNumber.replace(/[\/\\]/g, "-");

    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);

      // Footer divider line
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(margin, pageHeight - 14, pageWidth - margin, pageHeight - 14);

      // Footer Metadata (Left)
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(`SLIATE KANDY • Generated: ${dateStr} • Ref: ${cleanRef}`, margin, pageHeight - 9);

      // Accurate Page Count (Right)
      doc.setFont("helvetica", "bold");
      doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 9, { align: "right" });
    }

    // Save PDF
    const filename = `SLIATE_KANDY_${student.indexNumber.replace(/[\/\\]/g, "_")}.pdf`;
    doc.save(filename);
  }

  return {
    generateCertificate
  };
})();
