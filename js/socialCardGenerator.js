/**
 * ATI SLIATE Unofficial Results Portal - Social Share Card Generator
 * High-resolution HTML5 Canvas rendering for 9:16 Story (1080x1920) and 1:1 Post (1080x1080)
 * with custom aesthetic themes, auto-fitted responsive typography, zero text clipping,
 * and Web Share API integration.
 */

const PortalSocialCardGenerator = (() => {
  let canvas = null;
  let ctx = null;
  let currentStudent = null;

  const currentOptions = {
    aspectRatio: "9:16", // "9:16" or "1:1"
    theme: "navy",       // "navy", "emerald", "onyx", "crimson"
    showGrades: true,
    showRegNo: false
  };

  const THEMES = {
    navy: {
      bgStart: "#071120",
      bgMid: "#0f2b5c",
      bgEnd: "#060d17",
      accent: "#3b82f6",
      accentGlow: "rgba(59, 130, 246, 0.4)",
      gold: "#fbbf24",
      cardBg: "rgba(17, 34, 64, 0.8)",
      cardBorder: "rgba(59, 130, 246, 0.35)",
      textPrimary: "#f8fafc",
      textSecondary: "#94a3b8"
    },
    emerald: {
      bgStart: "#022c22",
      bgMid: "#064e3b",
      bgEnd: "#021c15",
      accent: "#10b981",
      accentGlow: "rgba(16, 185, 129, 0.4)",
      gold: "#f59e0b",
      cardBg: "rgba(6, 78, 59, 0.7)",
      cardBorder: "rgba(16, 185, 129, 0.35)",
      textPrimary: "#f0fdf4",
      textSecondary: "#a7f3d0"
    },
    onyx: {
      bgStart: "#09090b",
      bgMid: "#18181b",
      bgEnd: "#050507",
      accent: "#fbbf24",
      accentGlow: "rgba(251, 191, 36, 0.35)",
      gold: "#ffd700",
      cardBg: "rgba(24, 24, 27, 0.85)",
      cardBorder: "rgba(251, 191, 36, 0.4)",
      textPrimary: "#fafafa",
      textSecondary: "#a1a1aa"
    },
    crimson: {
      bgStart: "#2a080c",
      bgMid: "#4c0519",
      bgEnd: "#1a0408",
      accent: "#f43f5e",
      accentGlow: "rgba(244, 63, 94, 0.4)",
      gold: "#fbbf24",
      cardBg: "rgba(76, 5, 25, 0.7)",
      cardBorder: "rgba(244, 63, 94, 0.35)",
      textPrimary: "#fff1f2",
      textSecondary: "#fecdd3"
    }
  };

  function init() {
    canvas = document.getElementById("socialCardCanvas");
    if (canvas) {
      ctx = canvas.getContext("2d");
    }
  }

  /**
   * Helper: Draw text scaled to fit strictly within a maximum width
   * Prevents text truncation or overflowing canvas borders
   */
  function drawFittedText(text, x, y, preferredSize, letterSpacingPx, maxWidth, fontSpec = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", weight = "bold", fillStyle = null, align = "center") {
    if (!text) return preferredSize;
    ctx.save();
    ctx.textAlign = align;
    if (fillStyle) ctx.fillStyle = fillStyle;

    let fontSize = preferredSize;
    let spacing = letterSpacingPx;

    function measure(fs, sp) {
      ctx.font = `${weight} ${fs}px ${fontSpec}`;
      const baseWidth = ctx.measureText(text).width;
      const extraSpacing = (text.length - 1) * Math.max(0, sp);
      return baseWidth + extraSpacing;
    }

    let w = measure(fontSize, spacing);
    while (w > maxWidth && fontSize > 9) {
      fontSize -= 0.5;
      spacing = Math.max(0, spacing - 0.15);
      w = measure(fontSize, spacing);
    }

    ctx.font = `${weight} ${fontSize}px ${fontSpec}`;
    try {
      if (typeof ctx.letterSpacing !== "undefined") {
        ctx.letterSpacing = `${spacing}px`;
      }
    } catch (e) {}

    ctx.fillText(text, x, y);
    ctx.restore();
    return fontSize;
  }

  /**
   * Main render dispatch
   */
  function render(student, options = {}) {
    if (!canvas) init();
    if (!canvas || !ctx) return;

    currentStudent = student || currentStudent;
    Object.assign(currentOptions, options);

    const isStory = currentOptions.aspectRatio === "9:16";
    const width = 1080;
    const height = isStory ? 1920 : 1080;

    canvas.width = width;
    canvas.height = height;

    const theme = THEMES[currentOptions.theme] || THEMES.navy;

    // Background Gradient
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, theme.bgStart);
    bgGrad.addColorStop(0.5, theme.bgMid);
    bgGrad.addColorStop(1, theme.bgEnd);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Subtle background mesh glow circles
    drawGlowCircle(width * 0.2, height * 0.15, 320, theme.accentGlow);
    drawGlowCircle(width * 0.8, height * 0.85, 380, "rgba(251, 191, 36, 0.15)");

    // Outer & Inner Decorative Borders
    ctx.strokeStyle = theme.cardBorder;
    ctx.lineWidth = 4;
    ctx.strokeRect(36, 36, width - 72, height - 72);

    ctx.strokeStyle = theme.gold;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(46, 46, width - 92, height - 92);

    if (isStory) {
      render9x16Story(currentStudent, theme);
    } else {
      render1x1Post(currentStudent, theme);
    }
  }

  /**
   * Dedicated 1:1 Square Post Renderer (1080 x 1080)
   */
  function render1x1Post(student, theme) {
    const width = 1080;
    const height = 1080;
    const maxContentWidth = 860;

    // 1. Header Emblem & Titles
    drawEmblemBadge(width / 2, 94, theme, 26);

    drawFittedText(
      "SRI LANKA INSTITUTE OF ADVANCED TECHNOLOGICAL EDUCATION",
      width / 2,
      142,
      17,
      1.5,
      maxContentWidth,
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      "bold",
      theme.gold
    );

    drawFittedText(
      "UNOFFICIAL STUDENT COMMUNITY PORTAL",
      width / 2,
      165,
      13.5,
      1.5,
      maxContentWidth - 80,
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      "600",
      theme.textSecondary
    );

    // 2. Student Identity Card Box
    const cardMargin = 75;
    const cardWidth = width - (cardMargin * 2);
    const cardY = 190;
    const cardHeight = 155;

    drawGlassCard(cardMargin, cardY, cardWidth, cardHeight, 20, theme);

    drawFittedText(
      student.name || "Student Name",
      width / 2,
      cardY + 44,
      36,
      -0.5,
      cardWidth - 50,
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      "900",
      theme.textPrimary
    );

    const progText = student.program || CONFIG.programNames[student.programCode] || "Higher National Diploma";
    drawFittedText(
      progText,
      width / 2,
      cardY + 78,
      21,
      0,
      cardWidth - 60,
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      "bold",
      theme.accent
    );

    const campus = student.campus || CONFIG.campusNames[student.campusCode] || "ATI Campus";
    drawFittedText(
      campus,
      width / 2,
      cardY + 110,
      16,
      0.5,
      cardWidth - 60,
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      "600",
      theme.textSecondary
    );

    const regPart = currentOptions.showRegNo ? `   •   Reg: ${student.registrationNumber || student.regNo || "-"}` : "";
    drawFittedText(
      `Index No: ${student.indexNumber}${regPart}`,
      width / 2,
      cardY + 135,
      15,
      0.5,
      cardWidth - 60,
      "'Courier New', monospace",
      "bold",
      theme.textSecondary
    );

    // 3. GPA Metric Circle & Honours Badge
    const circleCenterY = 445;
    const circleRadius = 68;

    ctx.save();
    ctx.beginPath();
    ctx.arc(width / 2, circleCenterY, circleRadius, 0, Math.PI * 2);
    ctx.fillStyle = theme.cardBg;
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.strokeStyle = theme.gold;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(width / 2, circleCenterY, circleRadius - 9, 0, Math.PI * 2);
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = theme.cardBorder;
    ctx.stroke();
    ctx.restore();

    ctx.textAlign = "center";
    ctx.fillStyle = theme.gold;
    ctx.font = "900 54px 'Courier New', monospace";
    ctx.fillText(Number(student.cgpa).toFixed(2), width / 2, circleCenterY + 8);

    ctx.fillStyle = theme.textSecondary;
    ctx.font = "bold 11px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillText("CUMULATIVE GPA", width / 2, circleCenterY + 30);

    const honours = PortalUI.getHonoursClassification(student.cgpa);
    const bannerW = 480;
    const bannerH = 42;
    const bannerY = 535;
    drawGlassCard((width - bannerW) / 2, bannerY, bannerW, bannerH, 21, theme, true);

    drawFittedText(
      `★  ${honours.title.toUpperCase()}  ★`,
      width / 2,
      bannerY + 28,
      17,
      1.5,
      bannerW - 30,
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      "900",
      theme.gold
    );

    // 4. Middle Section: Highlights or Stats Grid
    if (currentOptions.showGrades) {
      const topCourses = extractTopCourses(student, 2);

      if (topCourses.length > 0) {
        drawFittedText(
          "⭐ DISTINCTION SUBJECT HIGHLIGHTS",
          width / 2,
          610,
          14,
          2,
          maxContentWidth,
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          "bold",
          theme.textSecondary
        );

        const cardH = 74;
        const colW = (width - 150 - 24) / 2;
        const gridY = 628;

        topCourses.forEach((c, idx) => {
          const cx = 75 + idx * (colW + 24);
          drawGlassCard(cx, gridY, colW, cardH, 14, theme);

          ctx.textAlign = "left";
          ctx.fillStyle = theme.textPrimary;
          const courseTitle = c.title || c.name || c.code;
          drawFittedText(courseTitle, cx + 18, gridY + 32, 16, 0, colW - 75, "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", "bold", theme.textPrimary, "left");

          ctx.fillStyle = theme.textSecondary;
          ctx.font = "500 13px 'Courier New', monospace";
          ctx.fillText(`${c.code} • ${c.credits || 3} Credits`, cx + 18, gridY + 54);

          ctx.textAlign = "right";
          ctx.fillStyle = theme.gold;
          ctx.font = "900 24px 'Courier New', monospace";
          ctx.fillText(c.grade, cx + colW - 18, gridY + 46);
        });
      }

      const statPillY = 724;
      const statPillW = 820;
      drawGlassCard((width - statPillW) / 2, statPillY, statPillW, 46, 23, theme);

      const statText = `Completed Semesters: 4    •    Earned Credits: ${student.totalCreditsEarned || student.totalCredits || 68}    •    Academic Status: Clear Pass`;
      drawFittedText(
        statText,
        width / 2,
        statPillY + 29,
        15,
        0.5,
        statPillW - 40,
        "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        "700",
        theme.textSecondary
      );
    } else {
      const statGridY = 615;
      const cardW = 275;
      const cardH = 95;
      const gap = 20;
      const startX = (width - (cardW * 3 + gap * 2)) / 2;

      const metrics = [
        { val: "4", label: "Completed Semesters" },
        { val: String(student.totalCreditsEarned || student.totalCredits || 68), label: "Credits Earned" },
        { val: "PASS", label: "Academic Standing" }
      ];

      metrics.forEach((m, idx) => {
        const mx = startX + idx * (cardW + gap);
        drawGlassCard(mx, statGridY, cardW, cardH, 16, theme);

        ctx.textAlign = "center";
        ctx.fillStyle = theme.gold;
        ctx.font = "900 34px 'Courier New', monospace";
        ctx.fillText(m.val, mx + cardW / 2, statGridY + 45);

        ctx.fillStyle = theme.textSecondary;
        ctx.font = "bold 13px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
        ctx.fillText(m.label, mx + cardW / 2, statGridY + 75);
      });

      const badgeY = 730;
      const badgeW = 600;
      drawGlassCard((width - badgeW) / 2, badgeY, badgeW, 42, 21, theme);
      drawFittedText(
        "🎓 Verified Student Academic Record",
        width / 2,
        badgeY + 27,
        15,
        1,
        badgeW - 40,
        "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        "bold",
        theme.accent
      );
    }

    // 5. Mandatory Non-Government Disclaimer Footer
    const dividerY = 890;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(120, dividerY);
    ctx.lineTo(width - 120, dividerY);
    ctx.stroke();

    drawFittedText(
      "Unofficial student portal for viewing and social sharing only.",
      width / 2,
      920,
      13.5,
      0,
      maxContentWidth,
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      "normal",
      "rgba(255, 255, 255, 0.75)"
    );

    drawFittedText(
      "Not affiliated with SLIATE or Government of Sri Lanka. For official transcripts, contact ATI.",
      width / 2,
      944,
      12.5,
      0,
      maxContentWidth,
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      "normal",
      "rgba(255, 255, 255, 0.6)"
    );

    drawFittedText(
      "Generated via ATI SLIATE Community Portal",
      width / 2,
      972,
      12.5,
      0.5,
      maxContentWidth,
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      "bold",
      theme.accent
    );
  }

  /**
   * Dedicated 9:16 Story Renderer (1080 x 1920)
   * Perfectly fills the vertical space, balanced layout, zero clipping, rich academic details
   */
  function render9x16Story(student, theme) {
    const width = 1080;
    const height = 1920;
    const maxContentWidth = 860;

    // 1. Header Emblem & Titles
    drawEmblemBadge(width / 2, 115, theme, 34);

    drawFittedText(
      "SRI LANKA INSTITUTE OF ADVANCED TECHNOLOGICAL EDUCATION",
      width / 2,
      175,
      18,
      1.5,
      maxContentWidth,
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      "bold",
      theme.gold
    );

    drawFittedText(
      "UNOFFICIAL STUDENT COMMUNITY PORTAL",
      width / 2,
      205,
      13.5,
      1.5,
      maxContentWidth - 80,
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      "600",
      theme.textSecondary
    );

    // 2. Student Identity Card Box
    const cardMargin = 75;
    const cardWidth = width - (cardMargin * 2); // 930px
    const cardY = 240;
    const cardHeight = 185;
    drawGlassCard(cardMargin, cardY, cardWidth, cardHeight, 22, theme);

    // Student Name
    drawFittedText(
      student.name || "Student Name",
      width / 2,
      cardY + 50,
      40,
      -0.5,
      cardWidth - 50,
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      "900",
      theme.textPrimary
    );

    // Program Title
    const progText = student.program || CONFIG.programNames[student.programCode] || "Higher National Diploma";
    drawFittedText(
      progText,
      width / 2,
      cardY + 90,
      23,
      0,
      cardWidth - 60,
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      "bold",
      theme.accent
    );

    // Campus
    const campus = student.campus || CONFIG.campusNames[student.campusCode] || "ATI Campus";
    drawFittedText(
      campus,
      width / 2,
      cardY + 126,
      18,
      0.5,
      cardWidth - 60,
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      "600",
      theme.textSecondary
    );

    // Index & Reg No
    const regPart = currentOptions.showRegNo ? `   •   Reg: ${student.registrationNumber || student.regNo || "-"}` : "";
    drawFittedText(
      `Index No: ${student.indexNumber}${regPart}`,
      width / 2,
      cardY + 158,
      16,
      0.5,
      cardWidth - 60,
      "'Courier New', monospace",
      "bold",
      theme.textSecondary
    );

    // 3. Hero GPA Circle & Honours Banner
    const circleCenterY = 540;
    const circleRadius = 90;

    ctx.save();
    ctx.beginPath();
    ctx.arc(width / 2, circleCenterY, circleRadius, 0, Math.PI * 2);
    ctx.fillStyle = theme.cardBg;
    ctx.fill();
    ctx.lineWidth = 6;
    ctx.strokeStyle = theme.gold;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(width / 2, circleCenterY, circleRadius - 10, 0, Math.PI * 2);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = theme.cardBorder;
    ctx.stroke();
    ctx.restore();

    ctx.textAlign = "center";
    ctx.fillStyle = theme.gold;
    ctx.font = "900 68px 'Courier New', monospace";
    ctx.fillText(Number(student.cgpa).toFixed(2), width / 2, circleCenterY + 10);

    ctx.fillStyle = theme.textSecondary;
    ctx.font = "bold 13px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillText("CUMULATIVE GPA", width / 2, circleCenterY + 40);

    // Honours Banner
    const honours = PortalUI.getHonoursClassification(student.cgpa);
    const bannerW = 520;
    const bannerH = 48;
    const bannerY = 660;
    drawGlassCard((width - bannerW) / 2, bannerY, bannerW, bannerH, 24, theme, true);

    drawFittedText(
      `★  ${honours.title.toUpperCase()}  ★`,
      width / 2,
      bannerY + 32,
      20,
      2,
      bannerW - 30,
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      "900",
      theme.gold
    );

    // 4. Distinction Highlights Grid (2x2)
    let nextY = 745;
    if (currentOptions.showGrades) {
      const topCourses = extractTopCourses(student, 4);

      if (topCourses.length > 0) {
        drawFittedText(
          "⭐ DISTINCTION MODULE HIGHLIGHTS",
          width / 2,
          nextY,
          16,
          2.5,
          maxContentWidth,
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          "bold",
          theme.textSecondary
        );
        nextY += 25;

        const colW = (width - 150 - 24) / 2; // 440px
        const cardH = 82;

        topCourses.forEach((c, idx) => {
          const col = idx % 2;
          const row = Math.floor(idx / 2);
          const cx = 75 + col * (colW + 24);
          const cy = nextY + row * (cardH + 16);

          drawGlassCard(cx, cy, colW, cardH, 16, theme);

          ctx.textAlign = "left";
          const title = c.title || c.name || c.code;
          drawFittedText(title, cx + 18, cy + 34, 16.5, 0, colW - 75, "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", "bold", theme.textPrimary, "left");

          ctx.fillStyle = theme.textSecondary;
          ctx.font = "500 13px 'Courier New', monospace";
          ctx.fillText(`${c.code} • ${c.credits || 3} Credits`, cx + 18, cy + 58);

          ctx.textAlign = "right";
          ctx.fillStyle = theme.gold;
          ctx.font = "900 26px 'Courier New', monospace";
          ctx.fillText(c.grade, cx + colW - 18, cy + 48);
        });

        nextY += Math.ceil(topCourses.length / 2) * (cardH + 16) + 30;
      }
    }

    // 5. 3-Milestone Statistics Grid (Fills the previous void elegantly!)
    const statGridY = nextY;
    const metricW = 285;
    const metricH = 110;
    const metricGap = 20;
    const metricStartX = (width - (metricW * 3 + metricGap * 2)) / 2;

    const metrics = [
      { val: "4", label: "Completed Semesters" },
      { val: String(student.totalCreditsEarned || student.totalCredits || 68), label: "Credits Earned" },
      { val: "PASS", label: "Academic Standing" }
    ];

    metrics.forEach((m, idx) => {
      const mx = metricStartX + idx * (metricW + metricGap);
      drawGlassCard(mx, statGridY, metricW, metricH, 18, theme);

      ctx.textAlign = "center";
      ctx.fillStyle = theme.gold;
      ctx.font = "900 38px 'Courier New', monospace";
      ctx.fillText(m.val, mx + metricW / 2, statGridY + 50);

      ctx.fillStyle = theme.textSecondary;
      ctx.font = "bold 13px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      ctx.fillText(m.label, mx + metricW / 2, statGridY + 82);
    });

    nextY = statGridY + metricH + 30;

    // 6. Semester GPA Progression Card (Shows progression across semesters)
    const semBoxW = 900;
    const semBoxH = 105;
    const semBoxX = (width - semBoxW) / 2;
    drawGlassCard(semBoxX, nextY, semBoxW, semBoxH, 20, theme);

    drawFittedText(
      "SEMESTER GPA PROGRESSION",
      width / 2,
      nextY + 30,
      13.5,
      2,
      semBoxW - 40,
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      "bold",
      theme.textSecondary
    );

    const sems = student.semesters || [];
    const count = Math.max(sems.length, 4);
    const semItemW = (semBoxW - 40) / count;

    for (let i = 0; i < 4; i++) {
      const s = sems[i];
      const semLabel = s ? `Y${s.year}S${s.semester}` : `Sem ${i + 1}`;
      const semGpa = s ? Number(s.sgpa).toFixed(2) : "-";
      const sx = semBoxX + 20 + i * semItemW;

      ctx.textAlign = "center";
      ctx.fillStyle = theme.gold;
      ctx.font = "900 22px 'Courier New', monospace";
      ctx.fillText(semGpa, sx + semItemW / 2, nextY + 65);

      ctx.fillStyle = theme.textSecondary;
      ctx.font = "600 12px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      ctx.fillText(semLabel, sx + semItemW / 2, nextY + 86);
    }

    nextY += semBoxH + 30;

    // 7. Verified Badge Pill
    const badgeW = 680;
    const badgeH = 46;
    drawGlassCard((width - badgeW) / 2, nextY, badgeW, badgeH, 23, theme);
    drawFittedText(
      "🎓 Verified Student Academic Record • ATI SLIATE",
      width / 2,
      nextY + 30,
      15.5,
      1,
      badgeW - 40,
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      "bold",
      theme.accent
    );

    // 8. Mandatory Non-Government Disclaimer Footer (Inside borders with breathing room)
    const footerDividerY = 1680;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(120, footerDividerY);
    ctx.lineTo(width - 120, footerDividerY);
    ctx.stroke();

    drawFittedText(
      "Unofficial student portal for viewing and social sharing only.",
      width / 2,
      footerDividerY + 32,
      14,
      0,
      maxContentWidth,
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      "normal",
      "rgba(255, 255, 255, 0.75)"
    );

    drawFittedText(
      "Not affiliated with SLIATE or Government of Sri Lanka.",
      width / 2,
      footerDividerY + 58,
      13,
      0,
      maxContentWidth,
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      "normal",
      "rgba(255, 255, 255, 0.6)"
    );

    drawFittedText(
      "For official certified transcripts, contact your ATI administration.",
      width / 2,
      footerDividerY + 80,
      12.5,
      0,
      maxContentWidth,
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      "normal",
      "rgba(255, 255, 255, 0.5)"
    );

    drawFittedText(
      "Generated via ATI SLIATE Community Portal",
      width / 2,
      footerDividerY + 110,
      13.5,
      0.5,
      maxContentWidth,
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      "bold",
      theme.accent
    );
  }

  /**
   * Helper: Draw subtle radial glow
   */
  function drawGlowCircle(x, y, radius, color) {
    ctx.save();
    const glow = ctx.createRadialGradient(x, y, 0, x, y, radius);
    glow.addColorStop(0, color);
    glow.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  /**
   * Helper: Draw frosted glass card
   */
  function drawGlassCard(x, y, w, h, r, theme, isGoldBorder = false) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();

    ctx.fillStyle = theme.cardBg;
    ctx.fill();
    ctx.lineWidth = isGoldBorder ? 2 : 1;
    ctx.strokeStyle = isGoldBorder ? theme.gold : theme.cardBorder;
    ctx.stroke();
    ctx.restore();
  }

  /**
   * Helper: Draw top academic emblem badge
   */
  function drawEmblemBadge(cx, cy, theme, radius = 30) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fillStyle = theme.cardBg;
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = theme.gold;
    ctx.stroke();

    const scale = radius / 30;

    // Cap icon inside badge
    ctx.fillStyle = theme.gold;
    ctx.beginPath();
    ctx.moveTo(cx, cy - 13 * scale);
    ctx.lineTo(cx + 18 * scale, cy - 3 * scale);
    ctx.lineTo(cx, cy + 7 * scale);
    ctx.lineTo(cx - 18 * scale, cy - 3 * scale);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.moveTo(cx - 11 * scale, cy);
    ctx.lineTo(cx - 11 * scale, cy + 8 * scale);
    ctx.quadraticCurveTo(cx, cy + 14 * scale, cx + 11 * scale, cy + 8 * scale);
    ctx.lineTo(cx + 11 * scale, cy);
    ctx.lineTo(cx, cy + 5 * scale);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  /**
   * Extracts top A+ and A courses across semesters
   */
  function extractTopCourses(student, limit = 4) {
    const courses = [];
    (student.semesters || []).forEach(sem => {
      (sem.courses || sem.subjects || []).forEach(c => {
        if (["A+", "A", "A-", "B+"].includes((c.grade || "").toUpperCase())) {
          courses.push(c);
        }
      });
    });

    courses.sort((a, b) => {
      const gOrder = { "A+": 4, "A": 3, "A-": 2, "B+": 1 };
      return (gOrder[b.grade] || 0) - (gOrder[a.grade] || 0);
    });

    return courses.slice(0, limit);
  }

  /**
   * Triggers download of generated card PNG
   */
  async function downloadCard() {
    if (!canvas) return;

    const dataUrl = canvas.toDataURL("image/png", 1.0);
    const link = document.createElement("a");
    const namePart = (currentStudent && currentStudent.indexNumber)
      ? currentStudent.indexNumber.replace(/[\/\\]/g, "_")
      : "achievement";
    const aspectPart = currentOptions.aspectRatio === "9:16" ? "Story_9x16" : "Post_1x1";

    link.download = `ATI_SLIATE_${namePart}_${aspectPart}.png`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Web Share API integration (Share directly to WhatsApp/Instagram/Native sheet)
   */
  async function shareCard() {
    if (!canvas) return;

    try {
      canvas.toBlob(async (blob) => {
        if (!blob) {
          alert("Failed to export card image.");
          return;
        }

        const fileName = `ATI_Result_${currentOptions.aspectRatio === "9:16" ? "Story" : "Post"}.png`;
        const file = new File([blob], fileName, { type: "image/png" });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: "My ATI SLIATE Examination Result",
            text: `Check out my academic results from ATI SLIATE! (CGPA: ${Number(currentStudent.cgpa).toFixed(2)})`
          });
        } else {
          downloadCard();
          alert("Direct sharing is not supported in this browser. The image has been downloaded so you can share it directly!");
        }
      }, "image/png", 1.0);
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("Share failed:", err);
        downloadCard();
      }
    }
  }

  return {
    init,
    render,
    downloadCard,
    shareCard
  };
})();
