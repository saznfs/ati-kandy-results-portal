/**
 * ATI SLIATE Unofficial Results Portal - PDF Certificate Generator
 * Generates an A4 Vector PDF Statement of Results with clean academic styling,
 * explicit unofficial watermarks, student profile details, and multi-semester tables.
 */

const PortalPdfGenerator = (() => {

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

    // --- 1. Academic Header & Border ---
    // Outer decorative border
    doc.setDrawColor(15, 43, 92); // Academic Navy #0f2b5c
    doc.setLineWidth(0.8);
    doc.rect(8, 8, pageWidth - 16, pageHeight - 16);
    doc.setDrawColor(217, 119, 6); // Gold #d97706
    doc.setLineWidth(0.3);
    doc.rect(9.5, 9.5, pageWidth - 19, pageHeight - 19);

    // Diagonal Background Watermark
    doc.saveGraphicsState();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(38);
    doc.setTextColor(230, 235, 245);
    doc.setGState(new doc.GState({ opacity: 0.12 }));
    doc.text("SLIATE KANDY", pageWidth / 2, pageHeight / 2, {
      align: "center",
      angle: 45
    });
    doc.restoreGraphicsState();

    y = 18;

    // Academic Logo Emblem
    const logoImg = document.getElementById("siteLogo");
    if (logoImg && logoImg.complete && logoImg.naturalWidth > 0) {
      try {
        doc.addImage(logoImg, "PNG", margin + 2, 14, 15, 15);
      } catch (e) {
        // Fallback gracefully
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
    const infoBoxHeight = 28;
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin, infoBoxTop, pageWidth - (margin * 2), infoBoxHeight, 2, 2, "F");
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, infoBoxTop, pageWidth - (margin * 2), infoBoxHeight, 2, 2, "S");

    const col1X = margin + 4;
    const col2X = margin + 100;
    let infoY = infoBoxTop + 5.5;

    // Student Name
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text("STUDENT FULL NAME:", col1X, infoY);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text(String(student.name || "N/A"), col1X + 38, infoY);

    // Academic Program
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text("PROGRAM:", col2X, infoY);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(37, 99, 235);
    const progText = (student.programCode === "IT" || (student.program && student.program.includes("Information Technology")))
      ? "HNDIT"
      : (CONFIG.programNames[student.programCode] || student.program || "HNDIT");
    doc.text(doc.splitTextToSize(progText, 70), col2X + 22, infoY);

    infoY += 6.5;
    // Index No
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text("INDEX NUMBER:", col1X, infoY);
    doc.setFont("courier", "bold");
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(String(student.indexNumber || "N/A"), col1X + 38, infoY);

    // Campus
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text("CAMPUS:", col2X, infoY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    const campusText = (student.campusCode === "KAN" || (student.campus && student.campus.includes("Kandy")))
      ? "SLIATE Kandy"
      : (CONFIG.campusNames[student.campusCode] || student.campus || "SLIATE Kandy");
    doc.text(campusText, col2X + 26, infoY);

    infoY += 6.5;
    // Academic Year
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text("ACADEMIC YEAR:", col1X, infoY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(String(student.academicYear || "2023/2024"), col1X + 38, infoY);

    // Total Semesters
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text("TOTAL SEMESTERS:", col2X, infoY);
    doc.setFont("courier", "bold");
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(String(student.semesters ? student.semesters.length : 4), col2X + 34, infoY);

    y = infoBoxTop + infoBoxHeight + 5;

    // --- 3. Multi-Semester Results Tables ---
    const semesters = student.semesters || [];

    semesters.forEach((sem, sIdx) => {
      // Semester Header
      doc.setFillColor(15, 43, 92);
      doc.roundedRect(margin, y, pageWidth - (margin * 2), 6, 1, 1, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(255, 255, 255);
      const semTitle = sem.semesterTitle || `Year ${sem.year} Semester ${sem.semester}`;
      doc.text(semTitle.toUpperCase(), margin + 3, y + 4.2);

      const semStats = `SGPA: ${Number(sem.sgpa || 0).toFixed(2)}`;
      doc.text(semStats, pageWidth - margin - 3, y + 4.2, { align: "right" });

      y += 6.5;

      // Table rows
      const tableData = (sem.courses || []).map(c => [
        c.code || "-",
        c.title || c.name || "-",
        c.grade || "-",
        c.gradePoint !== undefined ? Number(c.gradePoint).toFixed(2) : "-"
      ]);

      doc.autoTable({
        startY: y,
        margin: { left: margin, right: margin },
        head: [["Course Code", "Course Title", "Grade", "Points"]],
        body: tableData,
        theme: "plain",
        styles: {
          fontSize: 7.5,
          cellPadding: 1.5,
          textColor: [15, 23, 42]
        },
        headStyles: {
          fillColor: [241, 245, 249],
          textColor: [71, 85, 105],
          fontStyle: "bold",
          fontSize: 7.5
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252]
        },
        columnStyles: {
          0: { cellWidth: 28, font: "courier", fontStyle: "bold" },
          1: { cellWidth: "auto" },
          2: { cellWidth: 22, halign: "center", fontStyle: "bold" },
          3: { cellWidth: 22, halign: "center" }
        }
      });

      y = doc.lastAutoTable.finalY + 4;
    });

    // --- 4. Overall Academic Standing & Semester GPAs Box ---
    const honours = PortalUI.getHonoursClassification(student.cgpa);
    const sems = student.semesters || [];
    const semGpaSummary = sems.map(s => `Y${s.year}S${s.semester}: ${Number(s.sgpa || 0).toFixed(2)}`).join("   |   ");

    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(37, 99, 235);
    doc.setLineWidth(0.4);
    doc.roundedRect(margin, y, pageWidth - (margin * 2), 16, 2, 2, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text("SEMESTER GPAS", margin + 6, y + 5.5);
    doc.setFont("courier", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(37, 99, 235);
    doc.text(semGpaSummary, margin + 6, y + 11.5);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text("ACADEMIC HONOURS", margin + 115, y + 5.5);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(217, 119, 6);
    doc.text(honours.title.toUpperCase(), margin + 115, y + 11.5);

    y += 20;

    // --- 5. Clean Footer ---
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 16, pageWidth - margin, pageHeight - 16);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    const dateStr = new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
    doc.text(`SLIATE KANDY • Generated: ${dateStr} • Ref: ${student.indexNumber.replace(/\//g, "-")}`, margin, pageHeight - 10);
    doc.text("Page 1 of 1", pageWidth - margin, pageHeight - 10, { align: "right" });

    // Save PDF
    const filename = `ATI_Result_${student.indexNumber.replace(/[\/\\]/g, "_")}.pdf`;
    doc.save(filename);
  }

  return {
    generateCertificate
  };
})();
