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

  function getLogoImage() {
    if (!logoImg) {
      logoImg = new Image();
      logoImg.crossOrigin = "anonymous";
      logoImg.src = CONFIG.logoPath;
    }
    return logoImg;
  }

  const currentOptions = {
    aspectRatio: "9:16", // "9:16" or "1:1"
    theme: "navy"        // "navy", "emerald", "onyx", "crimson"
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
   * Clean, elegant, minimalist academic result card
   */
  function render1x1Post(student, theme) {
    const width = 1080;
    const height = 1080;
    const maxContentWidth = 860;

    // 1. Header Emblem & Title
    drawEmblemBadge(width / 2, 85, theme, 26);

    drawFittedText(
      "SLIATE KANDY",
      width / 2,
      138,
      24,
      3,
      maxContentWidth,
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      "900",
      theme.gold
    );

    // 2. Student Identity Card Box
    const cardMargin = 80;
    const cardWidth = width - (cardMargin * 2); // 920px
    const cardY = 175;
    const cardHeight = 145;

    drawGlassCard(cardMargin, cardY, cardWidth, cardHeight, 20, theme);

    // Student Name
    drawFittedText(
      student.name || "Student Name",
      width / 2,
      cardY + 44,
      34,
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
      cardY + 80,
      19,
      0.5,
      cardWidth - 60,
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      "bold",
      theme.accent
    );

    // Index Number
    drawFittedText(
      `Index No: ${student.indexNumber}`,
      width / 2,
      cardY + 115,
      16,
      0.5,
      cardWidth - 60,
      "'Courier New', monospace",
      "bold",
      theme.textSecondary
    );

    // 3. Honours Classification Banner
    const honours = PortalUI.getHonoursClassification(student.cgpa);
    const bannerW = 540;
    const bannerH = 44;
    const bannerY = 345;
    drawGlassCard((width - bannerW) / 2, bannerY, bannerW, bannerH, 22, theme, true);

    drawFittedText(
      `★  ${honours.title.toUpperCase()}  ★`,
      width / 2,
      bannerY + 29,
      17,
      1.5,
      bannerW - 30,
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      "900",
      theme.gold
    );

    // 4. All Semester GPAs Showcase (2x2 Grid)
    drawFittedText(
      "ACADEMIC SEMESTER GPA",
      width / 2,
      425,
      14,
      3,
      maxContentWidth,
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      "bold",
      theme.textSecondary
    );

    const sems = student.semesters || [];
    const gridX = 80;
    const gridY = 448;
    const colW = (cardWidth - 20) / 2; // 450px
    const rowH = 160;

    for (let i = 0; i < 4; i++) {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const cx = gridX + col * (colW + 20);
      const cy = gridY + row * (rowH + 18);

      const s = sems[i];
      const semLabel = s ? `YEAR ${s.year} • SEMESTER ${s.semester}` : `SEMESTER ${i + 1}`;
      const semGpa = s ? Number(s.sgpa || 0).toFixed(2) : "-";

      drawGlassCard(cx, cy, colW, rowH, 18, theme);

      // Semester Name
      drawFittedText(
        semLabel,
        cx + colW / 2,
        cy + 36,
        14.5,
        1,
        colW - 30,
        "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        "700",
        theme.textSecondary
      );

      // Divider inside card
      ctx.save();
      ctx.strokeStyle = theme.cardBorder;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx + 40, cy + 50);
      ctx.lineTo(cx + colW - 40, cy + 50);
      ctx.stroke();
      ctx.restore();

      // Large GPA value
      ctx.textAlign = "center";
      ctx.fillStyle = theme.gold;
      ctx.font = "900 52px 'Courier New', monospace";
      ctx.fillText(semGpa, cx + colW / 2, cy + 110);

      // Semester GPA Label
      ctx.fillStyle = theme.textSecondary;
      ctx.font = "600 12px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      ctx.fillText("Semester GPA", cx + colW / 2, cy + 138);
    }

    // 5. Milestone Pill
    const semCount = sems.length > 0 ? sems.length : 4;
    const statPillY = 825;
    const statPillW = 460;
    drawGlassCard((width - statPillW) / 2, statPillY, statPillW, 44, 22, theme);
    drawFittedText(
      `Completed Semesters: ${semCount}`,
      width / 2,
      statPillY + 28,
      16,
      1,
      statPillW - 40,
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      "700",
      theme.gold
    );

    // 6. Clean Footer
    drawFittedText(
      "SLIATE KANDY",
      width / 2,
      975,
      15,
      3,
      maxContentWidth,
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      "bold",
      theme.gold
    );
  }

  /**
   * Dedicated 9:16 Story Renderer (1080 x 1920)
   * Perfectly fills the vertical space, clean, elegant, all semester GPAs prominent
   */
  function render9x16Story(student, theme) {
    const width = 1080;
    const height = 1920;
    const maxContentWidth = 860;

    // 1. Header Emblem & Title
    drawEmblemBadge(width / 2, 130, theme, 34);

    drawFittedText(
      "SLIATE KANDY",
      width / 2,
      195,
      32,
      4,
      maxContentWidth,
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      "900",
      theme.gold
    );

    // 2. Student Identity Card Box
    const cardMargin = 80;
    const cardWidth = width - (cardMargin * 2); // 920px
    const cardY = 255;
    const cardHeight = 175;
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

    // Short form program: HNDIT
    const progText = "HNDIT";
    const campusText = "SLIATE Kandy";
    drawFittedText(
      `${progText}  •  ${campusText}`,
      width / 2,
      cardY + 92,
      22,
      0.5,
      cardWidth - 60,
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      "bold",
      theme.accent
    );

    // Index Number
    drawFittedText(
      `Index No: ${student.indexNumber}`,
      width / 2,
      cardY + 135,
      18,
      0.5,
      cardWidth - 60,
      "'Courier New', monospace",
      "bold",
      theme.textSecondary
    );

    // 3. Honours Banner
    const honours = PortalUI.getHonoursClassification(student.cgpa);
    const bannerW = 580;
    const bannerH = 52;
    const bannerY = 465;
    drawGlassCard((width - bannerW) / 2, bannerY, bannerW, bannerH, 26, theme, true);

    drawFittedText(
      `★  ${honours.title.toUpperCase()}  ★`,
      width / 2,
      bannerY + 34,
      20,
      2,
      bannerW - 30,
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      "900",
      theme.gold
    );

    // 4. All Semester GPAs Section Title
    drawFittedText(
      "SEMESTER GPA PROGRESSION",
      width / 2,
      575,
      17,
      3,
      maxContentWidth,
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      "bold",
      theme.textSecondary
    );

    // 5. Four Stacked Full-Width Semester Cards
    const sems = student.semesters || [];
    const semCardH = 145;
    const semGap = 24;
    const yStart = 615;

    for (let i = 0; i < 4; i++) {
      const cardY = yStart + i * (semCardH + semGap);
      const s = sems[i];
      const semTitle = s ? `Year ${s.year} • Semester ${s.semester}` : `Semester ${i + 1}`;
      const semCode = s ? `Y${s.year}S${s.semester}` : `SEM ${i + 1}`;
      const semGpa = s ? Number(s.sgpa || 0).toFixed(2) : "-";

      drawGlassCard(cardMargin, cardY, cardWidth, semCardH, 20, theme);

      // Left: Semester Title and Academic Record Tag
      ctx.textAlign = "left";
      drawFittedText(
        semTitle,
        cardMargin + 35,
        cardY + 58,
        24,
        0,
        cardWidth - 280,
        "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        "800",
        theme.textPrimary,
        "left"
      );

      ctx.fillStyle = theme.accent;
      ctx.font = "bold 14px 'Courier New', monospace";
      ctx.fillText(`${semCode} • ACADEMIC RECORD`, cardMargin + 35, cardY + 98);

      // Right: Large GPA and SGPA label
      ctx.textAlign = "right";
      ctx.fillStyle = theme.gold;
      ctx.font = "900 56px 'Courier New', monospace";
      ctx.fillText(semGpa, cardMargin + cardWidth - 35, cardY + 70);

      ctx.fillStyle = theme.textSecondary;
      ctx.font = "bold 12px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      ctx.fillText("SEMESTER GPA", cardMargin + cardWidth - 35, cardY + 102);
    }

    // 6. Milestone Pill
    const semCount = sems.length > 0 ? sems.length : 4;
    const statPillY = yStart + 4 * (semCardH + semGap) + 20;
    const statPillW = 540;
    drawGlassCard((width - statPillW) / 2, statPillY, statPillW, 54, 27, theme);
    drawFittedText(
      `Completed Semesters: ${semCount}`,
      width / 2,
      statPillY + 34,
      18,
      1.5,
      statPillW - 40,
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      "700",
      theme.gold
    );

    // 7. Verified Credential Badge
    const badgeY = statPillY + 80;
    const badgeW = 640;
    drawGlassCard((width - badgeW) / 2, badgeY, badgeW, 48, 24, theme);
    drawFittedText(
      "🎓 SLIATE KANDY • HNDIT",
      width / 2,
      badgeY + 31,
      16,
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
      16,
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
   * Helper: Draw top academic emblem badge with official SLIATE logo
   */
  function drawEmblemBadge(cx, cy, theme, radius = 30) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff"; // Clean white background
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = theme.gold;
    ctx.stroke();

    const img = getLogoImage();
    if (img && img.complete && img.naturalWidth > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, radius - 2, 0, Math.PI * 2);
      ctx.clip();
      const drawSize = radius * 1.7;
      ctx.drawImage(img, cx - drawSize / 2, cy - drawSize / 2, drawSize, drawSize);
      ctx.restore();
    } else {
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
    }
    ctx.restore();
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
    const shareTitle = "SLIATE KANDY Examination Result";
    const shareText = currentStudent
      ? `SLIATE Kandy Examination Results - ${currentStudent.name} (HNDIT)`
      : "SLIATE KANDY Examination Results";

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

    try {
      canvas.toBlob(async (blob) => {
        if (!blob) {
          alert("Failed to export card image.");
          return;
        }

        const file = new File([blob], fileName, { type: "image/png" });

        // Level 1: Full file sharing via Web Share API (Mobile Chrome / Safari)
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: shareTitle,
              text: `${shareText}\n${shareUrl}`,
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
                text: `${shareText}\n${shareUrl}`
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

        // Level 3: Fallback for browsers without Web Share API (Desktop Firefox / older browsers)
        downloadCard();
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
            alert("Card image downloaded and result link copied to clipboard! You can now paste and share it directly.");
          } else {
            alert("Card image downloaded so you can share it directly!");
          }
        } catch (clipErr) {
          alert("Card image downloaded so you can share it directly!");
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
