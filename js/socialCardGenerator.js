/**
 * SLIATE KANDY Results Portal - Social Share Card Generator
 * High-resolution HTML5 Canvas rendering for 9:16 Story (1080x1920) and 1:1 Post (1080x1080)
 * with custom aesthetic themes, auto-fitted responsive typography, zero text clipping,
 * and Web Share API integration.
 */

const PortalSocialCardGenerator = (() => {
  let canvas = null;
  let ctx = null;
  let currentStudent = null;
  let logoImg = null;
  let useFallbackLogo = false;

  function getLogoImage() {
    if (useFallbackLogo) return null;
    if (!logoImg) {
      logoImg = new Image();
      logoImg.crossOrigin = "anonymous";
      logoImg.src = CONFIG.logoPath;
    }
    return logoImg;
  }

  const currentOptions = {
    aspectRatio: "9:16", // "9:16" or "1:1"
    theme: "navy",        // "navy", "emerald", "onyx", "crimson"
    showHonours: true    // true or false
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
    getLogoImage();
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
   * Clean, high-contrast, perfectly visible for mobile viewing
   */
  function render1x1Post(student, theme) {
    const width = 1080;
    const height = 1080;
    const maxContentWidth = 920;

    // 1. Header Emblem & Title (Enhanced logo size with clean clearance)
    drawEmblemBadge(width / 2, 92, theme, 40);

    drawFittedText(
      "SLIATE KANDY",
      width / 2,
      168,
      24,
      3.5,
      maxContentWidth,
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      "900",
      theme.gold
    );

    // 2. Student Identity Card Box
    const cardMargin = 60;
    const cardWidth = width - (cardMargin * 2); // 960px
    const cardY = 192;
    const cardHeight = 154;

    drawGlassCard(cardMargin, cardY, cardWidth, cardHeight, 20, theme);

    // Student Name (Prominent & bold)
    drawFittedText(
      student.name || "Student Name",
      width / 2,
      cardY + 44,
      38,
      -0.5,
      cardWidth - 50,
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      "900",
      theme.textPrimary
    );

    // Short form program: HNDIT
    const progText = "HNDIT";
    const campusText = "SLIATE Kandy";
    drawFittedText(
      `${progText}  •  ${campusText}`,
      width / 2,
      cardY + 82,
      22,
      0.5,
      cardWidth - 60,
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      "bold",
      theme.accent
    );

    // Index Number (Large, high-contrast monospace)
    drawFittedText(
      `Index No: ${student.indexNumber}`,
      width / 2,
      cardY + 122,
      22,
      0.5,
      cardWidth - 60,
      "'Courier New', monospace",
      "bold",
      theme.textPrimary
    );

    // 3. Honours Classification Banner (Conditional)
    const showHonours = currentOptions.showHonours !== false;
    let gridTitleY = 438;
    let gridY = 460;
    let rowH = 184;

    if (showHonours) {
      const honours = PortalUI.getHonoursClassification(student.cgpa);
      const bannerW = 640;
      const bannerH = 46;
      const bannerY = 364;
      drawGlassCard((width - bannerW) / 2, bannerY, bannerW, bannerH, 23, theme, true);

      drawFittedText(
        `★  ${honours.title.toUpperCase()}  ★`,
        width / 2,
        bannerY + 31,
        20,
        1.5,
        bannerW - 30,
        "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        "900",
        theme.gold
      );
    } else {
      // Re-balance grid coordinates when honours banner is hidden
      gridTitleY = 372;
      gridY = 398;
      rowH = 214;
    }

    // 4. All Semester GPAs Showcase (2x2 Grid)
    drawFittedText(
      "ACADEMIC SEMESTER GPA",
      width / 2,
      gridTitleY,
      18,
      3,
      maxContentWidth,
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      "800",
      theme.textSecondary
    );

    const sems = student.semesters || [];
    const gridX = 60;
    const colW = (cardWidth - 24) / 2; // 468px

    for (let i = 0; i < 4; i++) {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const cx = gridX + col * (colW + 24);
      const cy = gridY + row * (rowH + 16);

      const s = sems[i];
      const semLabel = s ? `YEAR ${s.year} • SEMESTER ${s.semester}` : `SEMESTER ${i + 1}`;
      const semGpa = s ? Number(s.sgpa || 0).toFixed(2) : "-";

      drawGlassCard(cx, cy, colW, rowH, 20, theme);

      // Semester Name (Large, crisp, high contrast)
      drawFittedText(
        semLabel,
        cx + colW / 2,
        cy + (showHonours ? 38 : 44),
        20,
        1,
        colW - 30,
        "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        "800",
        theme.textPrimary
      );

      // Clean divider inside card
      ctx.save();
      ctx.strokeStyle = theme.cardBorder;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx + 35, cy + (showHonours ? 52 : 60));
      ctx.lineTo(cx + colW - 35, cy + (showHonours ? 52 : 60));
      ctx.stroke();
      ctx.restore();

      // Large GPA value (Huge & bold)
      ctx.textAlign = "center";
      ctx.fillStyle = theme.gold;
      ctx.font = `900 ${showHonours ? "64px" : "70px"} 'Courier New', monospace`;
      ctx.fillText(semGpa, cx + colW / 2, cy + (showHonours ? 122 : 138));

      // Semester GPA Label
      ctx.fillStyle = theme.textSecondary;
      ctx.font = "bold 15px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      ctx.fillText("SEMESTER GPA", cx + colW / 2, cy + (showHonours ? 154 : 176));
    }

    // 5. Milestone Pill
    const semCount = sems.length > 0 ? sems.length : 4;
    const statPillY = 878;
    const statPillW = 540;
    drawGlassCard((width - statPillW) / 2, statPillY, statPillW, 46, 23, theme);
    drawFittedText(
      `Completed Semesters: ${semCount}`,
      width / 2,
      statPillY + 30,
      20,
      1,
      statPillW - 40,
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      "800",
      theme.gold
    );

    // 6. Clean Footer
    drawFittedText(
      "SLIATE KANDY",
      width / 2,
      975,
      19,
      3.5,
      maxContentWidth,
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      "bold",
      theme.gold
    );
  }

  /**
   * Dedicated 9:16 Story Renderer (1080 x 1920)
   * High-contrast, perfectly visible for mobile story viewing
   */
  function render9x16Story(student, theme) {
    const width = 1080;
    const height = 1920;
    const maxContentWidth = 920;

    // 1. Header Emblem & Title (Enhanced prominent logo with clean clearance)
    drawEmblemBadge(width / 2, 145, theme, 68);

    drawFittedText(
      "SLIATE KANDY",
      width / 2,
      268,
      36,
      4,
      maxContentWidth,
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      "900",
      theme.gold
    );

    // 2. Student Identity Card Box
    const cardMargin = 60;
    const cardWidth = width - (cardMargin * 2); // 960px
    const cardY = 312;
    const cardHeight = 195;
    drawGlassCard(cardMargin, cardY, cardWidth, cardHeight, 24, theme);

    // Student Name
    drawFittedText(
      student.name || "Student Name",
      width / 2,
      cardY + 54,
      46,
      -0.5,
      cardWidth - 50,
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      "900",
      theme.textPrimary
    );

    // Short form program: HNDIT
    const progText = "HNDIT";
    const campusText = "SLIATE Kandy";
    drawFittedText(
      `${progText}  •  ${campusText}`,
      width / 2,
      cardY + 102,
      26,
      0.5,
      cardWidth - 60,
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      "bold",
      theme.accent
    );

    // Index Number (High contrast)
    drawFittedText(
      `Index No: ${student.indexNumber}`,
      width / 2,
      cardY + 150,
      24,
      0.5,
      cardWidth - 60,
      "'Courier New', monospace",
      "bold",
      theme.textPrimary
    );

    // 3. Honours Banner (Conditional)
    const showHonours = currentOptions.showHonours !== false;
    let sectionTitleY = 636;
    let yStart = 668;
    let semCardH = 160;
    let semGap = 24;

    if (showHonours) {
      const honours = PortalUI.getHonoursClassification(student.cgpa);
      const bannerW = 660;
      const bannerH = 58;
      const bannerY = 532;
      drawGlassCard((width - bannerW) / 2, bannerY, bannerW, bannerH, 29, theme, true);

      drawFittedText(
        `★  ${honours.title.toUpperCase()}  ★`,
        width / 2,
        bannerY + 38,
        24,
        2,
        bannerW - 30,
        "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        "900",
        theme.gold
      );
    } else {
      // Re-balance vertical rhythm when honours banner is hidden
      sectionTitleY = 544;
      yStart = 576;
      semCardH = 180;
      semGap = 26;
    }

    // 4. All Semester GPAs Section Title
    drawFittedText(
      "SEMESTER GPA PROGRESSION",
      width / 2,
      sectionTitleY,
      22,
      3,
      maxContentWidth,
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      "800",
      theme.textSecondary
    );

    // 5. Four Stacked Full-Width Semester Cards
    const sems = student.semesters || [];

    for (let i = 0; i < 4; i++) {
      const cardY = yStart + i * (semCardH + semGap);
      const s = sems[i];
      const semTitle = s ? `Year ${s.year} • Semester ${s.semester}` : `Semester ${i + 1}`;
      const semCode = s ? `Y${s.year}S${s.semester}` : `SEM ${i + 1}`;
      const semGpa = s ? Number(s.sgpa || 0).toFixed(2) : "-";

      drawGlassCard(cardMargin, cardY, cardWidth, semCardH, 22, theme);

      // Left: Semester Title and Academic Record Tag
      ctx.textAlign = "left";
      drawFittedText(
        semTitle,
        cardMargin + 35,
        cardY + (showHonours ? 62 : 68),
        28,
        0,
        cardWidth - 280,
        "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        "800",
        theme.textPrimary,
        "left"
      );

      ctx.fillStyle = theme.accent;
      ctx.font = "bold 16px 'Courier New', monospace";
      ctx.fillText(`${semCode} • ACADEMIC RECORD`, cardMargin + 35, cardY + (showHonours ? 106 : 116));

      // Right: Large GPA and SGPA label
      ctx.textAlign = "right";
      ctx.fillStyle = theme.gold;
      ctx.font = `900 ${showHonours ? "64px" : "70px"} 'Courier New', monospace`;
      ctx.fillText(semGpa, cardMargin + cardWidth - 35, cardY + (showHonours ? 76 : 84));

      ctx.fillStyle = theme.textSecondary;
      ctx.font = "bold 15px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      ctx.fillText("SEMESTER GPA", cardMargin + cardWidth - 35, cardY + (showHonours ? 112 : 124));
    }

    // 6. Milestone Pill
    const semCount = sems.length > 0 ? sems.length : 4;
    const statPillY = 1420;
    const statPillW = 600;
    drawGlassCard((width - statPillW) / 2, statPillY, statPillW, 58, 29, theme);
    drawFittedText(
      `Completed Semesters: ${semCount}`,
      width / 2,
      statPillY + 37,
      22,
      1.5,
      statPillW - 40,
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      "700",
      theme.gold
    );

    // 7. Verified Credential Badge
    const badgeY = 1500;
    const badgeW = 680;
    drawGlassCard((width - badgeW) / 2, badgeY, badgeW, 52, 26, theme);
    drawFittedText(
      "🎓 SLIATE KANDY • HNDIT",
      width / 2,
      badgeY + 34,
      18,
      1.5,
      badgeW - 40,
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      "bold",
      theme.accent
    );

    // 8. Clean Footer
    drawFittedText(
      "SLIATE KANDY",
      width / 2,
      1780,
      20,
      4,
      maxContentWidth,
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      "bold",
      theme.gold
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
   * Helper: Draw vector cap emblem fallback when image logo is unavailable or tainted
   */
  function drawVectorEmblemFallback(cx, cy, theme, radius = 30) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = theme.gold;
    ctx.stroke();

    const scale = radius / 30;

    // Fallback Cap icon inside badge
    ctx.fillStyle = theme.gold;
    ctx.beginPath();
    ctx.moveTo(cx, cy - 13 * scale);
    ctx.lineTo(cx + 18 * scale, cy - 3 * scale);
    ctx.lineTo(cx, cy + 7 * scale);
    ctx.lineTo(cx - 18 * scale, cy - 3 * scale);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#2c1c73";
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
   * Helper: Draw top academic emblem badge with official SLIATE crest plaque
   */
  function drawEmblemBadge(cx, cy, theme, radius = 30) {
    ctx.save();

    const img = getLogoImage();
    if (!useFallbackLogo && img && img.complete && img.naturalWidth > 0) {
      try {
        const aspect = (img.naturalWidth && img.naturalHeight)
          ? (img.naturalWidth / img.naturalHeight)
          : (426 / 565);
        const cardH = radius * 2.1;
        const cardW = cardH * aspect;
        const rx = cx - cardW / 2;
        const ry = cy - cardH / 2;
        const cornerR = Math.max(4, Math.round(cardH * 0.06));

        // Subtle glow & card backing
        ctx.save();
        ctx.shadowColor = theme.accentGlow || "rgba(245, 158, 11, 0.35)";
        ctx.shadowBlur = 12;
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        if (typeof ctx.roundRect === "function") {
          ctx.roundRect(rx - 2, ry - 2, cardW + 4, cardH + 4, cornerR + 1);
        } else {
          ctx.rect(rx - 2, ry - 2, cardW + 4, cardH + 4);
        }
        ctx.fill();
        ctx.restore();

        // Draw the exact unedited logo with its original radiant background and border
        ctx.save();
        ctx.beginPath();
        if (typeof ctx.roundRect === "function") {
          ctx.roundRect(rx, ry, cardW, cardH, cornerR);
        } else {
          ctx.rect(rx, ry, cardW, cardH);
        }
        ctx.clip();
        ctx.drawImage(img, rx, ry, cardW, cardH);
        ctx.restore();

        // Elegant gold outer border matching theme
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = theme.gold;
        ctx.beginPath();
        if (typeof ctx.roundRect === "function") {
          ctx.roundRect(rx - 2, ry - 2, cardW + 4, cardH + 4, cornerR + 1);
        } else {
          ctx.rect(rx - 2, ry - 2, cardW + 4, cardH + 4);
        }
        ctx.stroke();

        ctx.restore();
        return;
      } catch (err) {
        useFallbackLogo = true;
        drawVectorEmblemFallback(cx, cy, theme, radius);
      }
    } else {
      drawVectorEmblemFallback(cx, cy, theme, radius);
    }
    ctx.restore();
  }

  /**
   * Triggers download of generated card PNG with CORS/tainted fallback protection
   */
  async function downloadCard() {
    if (!canvas) return;

    let dataUrl;
    try {
      dataUrl = canvas.toDataURL("image/png", 1.0);
    } catch (err) {
      console.warn("Canvas toDataURL failed (likely tainted). Retrying with clean vector emblem fallback...", err);
      useFallbackLogo = true;
      render();
      try {
        dataUrl = canvas.toDataURL("image/png", 1.0);
      } catch (retryErr) {
        console.error("Canvas export failed on retry:", retryErr);
        if (typeof PortalUI !== "undefined" && PortalUI.showError) {
          PortalUI.showError("Unable to export share card due to browser security restrictions.", true);
        }
        return;
      }
    }

    const link = document.createElement("a");
    const namePart = (currentStudent && currentStudent.indexNumber)
      ? currentStudent.indexNumber.replace(/[\/\\]/g, "_")
      : "result";
    const aspectPart = currentOptions.aspectRatio === "9:16" ? "Story_9x16" : "Post_1x1";

    link.download = `SLIATE_KANDY_${namePart}_${aspectPart}.png`;
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

    const namePart = (currentStudent && currentStudent.indexNumber)
      ? currentStudent.indexNumber.replace(/[\/\\]/g, "_")
      : "result";
    const aspectPart = currentOptions.aspectRatio === "9:16" ? "Story" : "Post";
    const fileName = `SLIATE_KANDY_${namePart}_${aspectPart}.png`;
    
    let shareTitle = "SLIATE KANDY Examination Results";
    let shareText = "SLIATE KANDY Examination Results";

    if (currentStudent) {
      const studentName = currentStudent.name || "Student";
      const indexNo = currentStudent.indexNumber || "";
      const showHonours = currentOptions.showHonours !== false;
      const honours = (showHonours && typeof PortalUI !== "undefined" && PortalUI.getHonoursClassification)
        ? PortalUI.getHonoursClassification(currentStudent.cgpa)
        : null;
      const honoursLine = (showHonours && honours && honours.title && honours.minCgpa >= 2.0)
        ? `\n🏆 Academic Standing: ${honours.title}${currentStudent.cgpa ? ` (CGPA: ${Number(currentStudent.cgpa).toFixed(2)})` : ""}`
        : "";

      shareTitle = `SLIATE Kandy Examination Results - ${studentName}`;
      shareText = [
        `🎓 I am proud to share that I have successfully completed my HNDIT examination results at SLIATE Kandy!`,
        ``,
        `👤 Student Name: ${studentName}`,
        `📋 Index Number: ${indexNo}`,
        `📚 Program: Higher National Diploma in Information Technology (HNDIT)`,
        `🏛️ Campus: SLIATE Kandy${honoursLine}`
      ].join("\n");
    }

    // Build absolute URL for the student's result
    let shareUrl = window.location.href;
    try {
      const urlObj = new URL(window.location.href);
      if (currentStudent && currentStudent.indexNumber) {
        urlObj.searchParams.set("index", currentStudent.indexNumber);
      }
      shareUrl = urlObj.toString();
    } catch (e) {
      // fallback
    }

    function getCanvasBlob() {
      return new Promise((resolve, reject) => {
        try {
          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error("Canvas toBlob returned null"));
          }, "image/png", 1.0);
        } catch (err) {
          reject(err);
        }
      });
    }

    let blob;
    try {
      blob = await getCanvasBlob();
    } catch (err) {
      console.warn("Canvas toBlob failed (likely tainted). Retrying with clean vector emblem fallback...", err);
      useFallbackLogo = true;
      render();
      try {
        blob = await getCanvasBlob();
      } catch (retryErr) {
        console.error("Canvas toBlob retry failed:", retryErr);
        downloadCard();
        return;
      }
    }

    const file = new File([blob], fileName, { type: "image/png" });

    // Level 1: Full file sharing via Web Share API (Mobile Chrome / Safari)
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: shareTitle,
          text: shareText,
          url: shareUrl
        });
        return;
      } catch (fileShareErr) {
        if (fileShareErr.name === "AbortError") return;
        // Retry sharing file without url parameter if combined payload is rejected
        try {
          await navigator.share({
            files: [file],
            title: shareTitle,
            text: `${shareText}\n\n🔗 View results:\n${shareUrl}`
          });
          return;
        } catch (retryErr) {
          if (retryErr.name === "AbortError") return;
        }
      }
    }

    // Level 2: Text/URL sharing via Web Share API (Desktop Chrome / Safari / Edge)
    if (navigator.share) {
      try {
        downloadCard();
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl
        });
        return;
      } catch (urlShareErr) {
        if (urlShareErr.name === "AbortError") return;
      }
    }

    // Level 3: Fallback for browsers without Web Share API
    downloadCard();
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(`${shareText}\n\n🔗 View results:\n${shareUrl}`);
        if (typeof PortalUI !== "undefined" && PortalUI.showError) {
          PortalUI.showError("Card image downloaded and result link copied to clipboard! You can paste and share it directly.", true);
        }
      } else {
        if (typeof PortalUI !== "undefined" && PortalUI.showError) {
          PortalUI.showError("Card image downloaded! You can now share it directly.", true);
        }
      }
    } catch (clipErr) {
      // Ignored
    }
  }

  return {
    init,
    render,
    downloadCard,
    shareCard
  };
})();
