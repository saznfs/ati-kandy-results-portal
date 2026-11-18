/**
 * ATI SLIATE Unofficial Results Portal - Social Share Card Generator
 * High-resolution HTML5 Canvas rendering for 9:16 Story (1080x1920) and 1:1 Post (1080x1080)
 * with custom aesthetic themes, privacy controls, and Web Share API integration.
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
      cardBg: "rgba(17, 34, 64, 0.75)",
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
      cardBg: "rgba(6, 78, 59, 0.6)",
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
      cardBg: "rgba(24, 24, 27, 0.8)",
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
      cardBg: "rgba(76, 5, 25, 0.6)",
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
   * Updates student and renders canvas
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

    // 1. Background Gradient
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, theme.bgStart);
    bgGrad.addColorStop(0.5, theme.bgMid);
    bgGrad.addColorStop(1, theme.bgEnd);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Subtle background mesh glow circles
    drawGlowCircle(width * 0.2, height * 0.15, 300, theme.accentGlow);
    drawGlowCircle(width * 0.8, height * 0.85, 350, "rgba(251, 191, 36, 0.15)");

    // Outer Decorative Border
    ctx.strokeStyle = theme.cardBorder;
    ctx.lineWidth = 4;
    ctx.strokeRect(36, 36, width - 72, height - 72);

    ctx.strokeStyle = theme.gold;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(46, 46, width - 92, height - 92);

    let currentY = isStory ? 130 : 85;

    // 2. Header Emblem & Brand Title
    ctx.textAlign = "center";

    // Academic Emblem Icon
    drawEmblemBadge(width / 2, currentY, theme);
    currentY += 85;

    ctx.fillStyle = theme.gold;
    ctx.font = "bold 24px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.letterSpacing = "6px";
    ctx.fillText("SRI LANKA INSTITUTE OF ADVANCED TECHNOLOGICAL EDUCATION", width / 2, currentY);

    currentY += 34;
    ctx.fillStyle = theme.textSecondary;
    ctx.font = "600 20px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.letterSpacing = "3px";
    ctx.fillText("UNOFFICIAL STUDENT COMMUNITY PORTAL", width / 2, currentY);

    currentY += isStory ? 75 : 45;

    // 3. Student Identity Card Box
    const cardMargin = 80;
    const cardWidth = width - (cardMargin * 2);
    const idCardHeight = isStory ? 200 : 150;

    drawGlassCard(cardMargin, currentY, cardWidth, idCardHeight, 24, theme);

    ctx.fillStyle = theme.textPrimary;
    ctx.font = "900 44px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.letterSpacing = "-0.5px";
    ctx.fillText(currentStudent.name || "Student Name", width / 2, currentY + (isStory ? 65 : 55));

    ctx.fillStyle = theme.accent;
    ctx.font = "bold 26px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    const progText = currentStudent.program || CONFIG.programNames[currentStudent.programCode] || "HND in Information Technology";
    ctx.fillText(progText, width / 2, currentY + (isStory ? 110 : 92));

    ctx.fillStyle = theme.textSecondary;
    ctx.font = "500 22px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    const campus = currentStudent.campus || CONFIG.campusNames[currentStudent.campusCode] || "Hardy ATI, Ampara";
    const regPart = currentOptions.showRegNo ? ` • Reg: ${currentStudent.registrationNumber || currentStudent.regNo}` : "";
    ctx.fillText(`${campus} • Index: ${currentStudent.indexNumber}${regPart}`, width / 2, currentY + (isStory ? 155 : 128));

    currentY += idCardHeight + (isStory ? 70 : 40);

    // 4. Hero GPA Metric & Honours Badge
    const honours = PortalUI.getHonoursClassification(currentStudent.cgpa);

    // GPA Outer Circle Glow
    const circleRadius = isStory ? 130 : 95;
    const circleCenterY = currentY + circleRadius;

    ctx.save();
    ctx.beginPath();
    ctx.arc(width / 2, circleCenterY, circleRadius, 0, Math.PI * 2);
    ctx.fillStyle = theme.cardBg;
    ctx.fill();
    ctx.lineWidth = 6;
    ctx.strokeStyle = theme.gold;
    ctx.stroke();

    // Circle inner ring
    ctx.beginPath();
    ctx.arc(width / 2, circleCenterY, circleRadius - 12, 0, Math.PI * 2);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = theme.cardBorder;
    ctx.stroke();
    ctx.restore();

    // CGPA Text
    ctx.fillStyle = theme.gold;
    ctx.font = `900 ${isStory ? 84 : 64}px 'Courier New', monospace`;
    ctx.fillText(Number(currentStudent.cgpa).toFixed(2), width / 2, circleCenterY + (isStory ? 12 : 8));

    ctx.fillStyle = theme.textSecondary;
    ctx.font = "bold 18px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.letterSpacing = "4px";
    ctx.fillText("CUMULATIVE GPA", width / 2, circleCenterY + (isStory ? 48 : 36));

    currentY = circleCenterY + circleRadius + (isStory ? 45 : 25);

    // Honours Banner
    const bannerW = 540;
    const bannerH = 54;
    drawGlassCard((width - bannerW) / 2, currentY, bannerW, bannerH, 27, theme, true);

    ctx.fillStyle = theme.gold;
    ctx.font = "900 24px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.letterSpacing = "2px";
    ctx.fillText(`★  ${honours.title.toUpperCase()}  ★`, width / 2, currentY + 35);

    currentY += bannerH + (isStory ? 60 : 35);

    // 5. Subject Highlights (if showGrades option is enabled)
    if (isStory && currentOptions.showGrades) {
      const topCourses = extractTopCourses(currentStudent, 4);

      if (topCourses.length > 0) {
        ctx.fillStyle = theme.textSecondary;
        ctx.font = "bold 20px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
        ctx.letterSpacing = "3px";
        ctx.fillText("DISTINCTION MODULE HIGHLIGHTS", width / 2, currentY);
        currentY += 30;

        const gridY = currentY;
        const colW = (width - 160 - 24) / 2;
        const cardH = 90;

        topCourses.forEach((c, idx) => {
          const col = idx % 2;
          const row = Math.floor(idx / 2);
          const cx = 80 + (col * (colW + 24));
          const cy = gridY + (row * (cardH + 16));

          drawGlassCard(cx, cy, colW, cardH, 16, theme);

          ctx.textAlign = "left";
          ctx.fillStyle = theme.textPrimary;
          ctx.font = "bold 20px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
          const courseTitle = c.title || c.name || c.code;
          const truncated = courseTitle.length > 25 ? courseTitle.substring(0, 24) + "…" : courseTitle;
          ctx.fillText(truncated, cx + 20, cy + 38);

          ctx.fillStyle = theme.textSecondary;
          ctx.font = "500 16px 'Courier New', monospace";
          ctx.fillText(`${c.code} • ${c.credits || 3} Credits`, cx + 20, cy + 65);

          // Grade Badge on right
          ctx.textAlign = "right";
          ctx.fillStyle = theme.gold;
          ctx.font = "900 28px 'Courier New', monospace";
          ctx.fillText(c.grade, cx + colW - 20, cy + 54);
        });

        currentY += (Math.ceil(topCourses.length / 2) * (cardH + 16)) + 20;
      }
    } else if (!isStory && currentOptions.showGrades) {
      // 1:1 Square layout mini highlights
      const statsText = `Completed Semesters: 4  •  Earned Credits: ${currentStudent.totalCreditsEarned || currentStudent.totalCredits || 60}  •  Overall Status: Clear Pass`;
      ctx.textAlign = "center";
      ctx.fillStyle = theme.textSecondary;
      ctx.font = "600 20px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      ctx.fillText(statsText, width / 2, currentY + 15);
      currentY += 45;
    }

    // 6. Mandatory Non-Government Disclaimer Footer
    const footerY = height - (isStory ? 100 : 70);
    ctx.textAlign = "center";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(120, footerY - 25);
    ctx.lineTo(width - 120, footerY - 25);
    ctx.stroke();

    ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
    ctx.font = "italic 16px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillText("Unofficial student portal for viewing and social sharing only. Not affiliated with SLIATE or Government of Sri Lanka.", width / 2, footerY);

    ctx.fillStyle = theme.accent;
    ctx.font = "bold 15px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillText("Generated via ATI SLIATE Community Portal", width / 2, footerY + 28);
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
  function drawEmblemBadge(cx, cy, theme) {
    ctx.save();
    // Shield / Crest base
    ctx.beginPath();
    ctx.arc(cx, cy, 32, 0, Math.PI * 2);
    ctx.fillStyle = theme.cardBg;
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = theme.gold;
    ctx.stroke();

    // Cap icon inside badge
    ctx.fillStyle = theme.gold;
    ctx.beginPath();
    ctx.moveTo(cx, cy - 14);
    ctx.lineTo(cx + 20, cy - 3);
    ctx.lineTo(cx, cy + 8);
    ctx.lineTo(cx - 20, cy - 3);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.moveTo(cx - 12, cy);
    ctx.lineTo(cx - 12, cy + 9);
    ctx.quadraticCurveTo(cx, cy + 15, cx + 12, cy + 9);
    ctx.lineTo(cx + 12, cy);
    ctx.lineTo(cx, cy + 6);
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

    // Sort: A+ first, then A
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
          // Fallback: download the file
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
