/**
 * ATI SLIATE Unofficial Results Portal - UI Renderer
 * Safe, modular DOM rendering for student profiles, semester tabs, and grade tables.
 * Strictly adheres to DOM element creation without innerHTML injection of untrusted data.
 */

const PortalUI = (() => {
  const el = PortalSecurity.el;

  // DOM Elements cache
  let resultsContainer = null;
  let searchInput = null;
  let searchBtn = null;
  let alertBox = null;
  let clearBtn = null;

  function init() {
    resultsContainer = document.getElementById("resultsContainer");
    searchInput = document.getElementById("indexInput");
    searchBtn = document.getElementById("searchBtn");
    alertBox = document.getElementById("alertBox");
    clearBtn = document.getElementById("searchClearBtn");
  }

  /**
   * Calculates or retrieves honours classification from CGPA
   */
  function getHonoursClassification(cgpa) {
    const val = parseFloat(cgpa) || 0;
    for (const h of CONFIG.honoursClass) {
      if (val >= h.minCgpa) {
        return h;
      }
    }
    return { title: "General Pass", badgeClass: "standing-general-pass" };
  }

  /**
   * Returns grade badge CSS class based on grade letter and official SLIATE 5.9 rules
   */
  function getGradeClass(grade) {
    if (!grade) return "grade-E";
    const g = grade.trim().toUpperCase();

    // Check special grades from SLIATE 5.9 first to avoid false-prefix matching (e.g. AB != A, DFR != D)
    if (g === "AB") return "grade-absent";
    if (g === "DFR") return "grade-deferred";
    if (g.startsWith("I(") || g === "INC") return "grade-incomplete";

    if (g.startsWith("A")) return "grade-A";
    if (g.startsWith("B")) return "grade-B";
    if (g.startsWith("C")) return "grade-C";
    if (g.startsWith("D")) return "grade-D";
    return "grade-E";
  }

  /**
   * Generates initials from a full name (e.g. "K. L. Kasun Perera" -> "KP")
   */
  function getInitials(name) {
    if (!name) return "ST";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    const first = parts[0].replace(/[^A-Za-z]/g, "").charAt(0);
    const last = parts[parts.length - 1].replace(/[^A-Za-z]/g, "").charAt(0);
    return (first + last).toUpperCase() || "ST";
  }

  /**
   * Renders the complete student result view
   */
  function renderResults(student) {
    if (!resultsContainer) init();

    // Clear previous results
    resultsContainer.textContent = "";
    resultsContainer.classList.add("active");

    // 1. Student Profile Card
    const profileCard = renderStudentProfileCard(student);
    resultsContainer.appendChild(profileCard);

    // 2. Action Toolbar (PDF & Social Card)
    const toolbar = renderActionToolbar(student);
    resultsContainer.appendChild(toolbar);

    // 3. Multi-Semester Tabs & Content
    const tabsContainer = renderSemesterSection(student);
    resultsContainer.appendChild(tabsContainer);

    // Scroll into view smoothly
    resultsContainer.scrollIntoView({ behavior: "smooth", block: "start" });

    // Celebrate with confetti if high achiever (CGPA >= 3.0)
    if (student.cgpa && parseFloat(student.cgpa) >= 3.0 && typeof confetti === "function") {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {
        // Confetti optional
      }
    }
  }

  /**
   * Renders Student Overview & CGPA Card
   */
  function renderStudentProfileCard(student) {
    const honours = getHonoursClassification(student.cgpa);
    const initials = getInitials(student.name);

    const campusDisplay = (student.campusCode === "KAN" || (student.campus && student.campus.includes("Kandy")))
      ? "SLIATE Kandy"
      : (CONFIG.campusNames[student.campusCode] || student.campus || "SLIATE Kandy");
    const programDisplay = (student.programCode === "IT" || (student.program && student.program.includes("Information Technology")))
      ? "HNDIT"
      : (CONFIG.programNames[student.programCode] || student.program || "HNDIT");

    return el("div", { class: "student-card" },
      // Header: Avatar, Name, Program
      el("div", { class: "student-header" },
        el("div", { class: "student-identity" },
          el("div", { class: "student-avatar", "aria-hidden": "true" }, initials),
          el("div", { class: "student-names" },
            el("h2", { class: "student-name" }, student.name || "Student"),
            el("div", { class: "student-program" }, programDisplay),
            el("div", { class: "student-campus" }, campusDisplay)
          )
        )
      ),

      // Metadata Grid
      el("div", { class: "student-meta-grid" },
        el("div", { class: "meta-item" },
          el("span", { class: "meta-label" }, "Index Number"),
          el("span", { class: "meta-value" }, student.indexNumber || "-")
        ),
        el("div", { class: "meta-item" },
          el("span", { class: "meta-label" }, "Academic Year"),
          el("span", { class: "meta-value" }, student.academicYear || "2023/2024")
        ),
        el("div", { class: "meta-item" },
          el("span", { class: "meta-label" }, "Total Semesters"),
          el("span", { class: "meta-value" }, String(student.semesters ? student.semesters.length : 4))
        )
      ),

      // All Semester GPAs Showcase Grid Row
      el("div", { class: "semester-gpa-summary-grid" },
        ...(student.semesters || []).map(sem =>
          el("div", { class: "semester-gpa-stat-card" },
            el("span", { class: "meta-label", style: { fontSize: "0.75rem", display: "block", marginBottom: "4px" } }, `Year ${sem.year} Sem ${sem.semester}`),
            el("span", { style: { fontSize: "1.35rem", fontWeight: "900", color: "var(--brand-accent)", fontFamily: "var(--font-mono)", display: "block" } }, Number(sem.sgpa || 0).toFixed(2)),
            el("span", { style: { fontSize: "0.7rem", color: "var(--color-text-muted)", display: "block", marginTop: "2px" } }, "Semester GPA")
          )
        )
      ),

      // Standing Badge Row
      el("div", { class: "standing-badge-wrapper" },
        el("span", { class: `standing-badge ${honours.badgeClass}` }, honours.title)
      )
    );
  }

  /**
   * Action buttons (PDF download, Social Card, Copy summary) and honours toggle
   */
  function renderActionToolbar(student) {
    const pdfBtn = el("button", {
      type: "button",
      class: "btn-action btn-action-primary",
      id: "btnDownloadPdf"
    },
      el("span", { "aria-hidden": "true" }, "📄"),
      " Download PDF Certificate"
    );

    const socialBtn = el("button", {
      type: "button",
      class: "btn-action btn-action-gold",
      id: "btnOpenSocialModal"
    },
      el("span", { "aria-hidden": "true" }, "✨"),
      " Create Social Share Card"
    );

    const copyBtn = el("button", {
      type: "button",
      class: "btn-action",
      id: "btnCopySummary",
      onClick: () => copyResultSummary(student, copyBtn)
    },
      el("span", { "aria-hidden": "true" }, "📋"),
      " Copy Result Summary"
    );

    const honoursToggle = el("div", { class: "honours-toggle-bar" },
      el("label", { class: "honours-toggle-container", for: "chkIncludeHonours" },
        el("input", {
          type: "checkbox",
          id: "chkIncludeHonours",
          checked: true
        }),
        el("span", { class: "toggle-label-text" }, "Show Academic Honours (in PDF & Image Share)")
      )
    );

    return el("div", { style: { marginBottom: "var(--space-6)" } },
      el("div", { class: "action-toolbar", style: { marginBottom: "0" } },
        pdfBtn,
        socialBtn,
        copyBtn
      ),
      honoursToggle
    );
  }

  /**
   * Multi-Semester Navigation & Tables (Accessible WAI-ARIA Tabs)
   */
  function renderSemesterSection(student) {
    const semesters = student.semesters || [];
    const container = el("div", { class: "semester-section-container" });

    // Tab buttons nav
    const nav = el("div", { class: "semester-tabs-nav", role: "tablist", "aria-label": "Semester Results" });
    const panelsContainer = el("div", { class: "semester-panels-wrapper" });

    // "All Semesters" Tab
    const allTabBtn = el("button", {
      type: "button",
      id: "tab-btn-all",
      class: "tab-btn active",
      role: "tab",
      "aria-selected": "true",
      "aria-controls": "panel-all",
      tabindex: "0",
      dataset: { tabTarget: "panel-all" }
    }, "All Semesters Overview");

    nav.appendChild(allTabBtn);

    // Individual semester tab buttons
    semesters.forEach((sem, idx) => {
      const semTabBtn = el("button", {
        type: "button",
        id: `tab-btn-sem-${idx}`,
        class: "tab-btn",
        role: "tab",
        "aria-selected": "false",
        "aria-controls": `panel-sem-${idx}`,
        tabindex: "-1",
        dataset: { tabTarget: `panel-sem-${idx}` }
      }, sem.semesterTitle || `Year ${sem.year} Sem ${sem.semester}`);
      nav.appendChild(semTabBtn);
    });

    // Panel 1: All Semesters
    const allPanel = el("div", {
      class: "semester-panel active",
      id: "panel-all",
      role: "tabpanel",
      "aria-labelledby": "tab-btn-all",
      tabindex: "0"
    });
    semesters.forEach(sem => {
      allPanel.appendChild(renderSingleSemesterBlock(sem));
    });
    panelsContainer.appendChild(allPanel);

    // Panels for individual semesters
    semesters.forEach((sem, idx) => {
      const singlePanel = el("div", {
        class: "semester-panel",
        id: `panel-sem-${idx}`,
        role: "tabpanel",
        "aria-labelledby": `tab-btn-sem-${idx}`,
        tabindex: "0"
      });
      singlePanel.appendChild(renderSingleSemesterBlock(sem));
      panelsContainer.appendChild(singlePanel);
    });

    function activateTab(btn) {
      if (!btn) return;
      nav.querySelectorAll(".tab-btn").forEach(b => {
        b.classList.remove("active");
        b.setAttribute("aria-selected", "false");
        b.setAttribute("tabindex", "-1");
      });
      btn.classList.add("active");
      btn.setAttribute("aria-selected", "true");
      btn.setAttribute("tabindex", "0");

      const targetId = btn.dataset.tabTarget;
      panelsContainer.querySelectorAll(".semester-panel").forEach(p => {
        p.classList.remove("active");
      });

      const activePanel = document.getElementById(targetId);
      if (activePanel) {
        activePanel.classList.add("active");
      }
    }

    // Tab switching click event delegation
    nav.addEventListener("click", (e) => {
      const btn = e.target.closest(".tab-btn");
      if (btn) activateTab(btn);
    });

    // WAI-ARIA Keyboard navigation: ArrowLeft, ArrowRight, Home, End
    nav.addEventListener("keydown", (e) => {
      const tabs = Array.from(nav.querySelectorAll('.tab-btn[role="tab"]'));
      const activeIdx = tabs.indexOf(document.activeElement);
      if (activeIdx === -1) return;

      let nextIdx = activeIdx;
      if (e.key === "ArrowRight") {
        nextIdx = (activeIdx + 1) % tabs.length;
        e.preventDefault();
      } else if (e.key === "ArrowLeft") {
        nextIdx = (activeIdx - 1 + tabs.length) % tabs.length;
        e.preventDefault();
      } else if (e.key === "Home") {
        nextIdx = 0;
        e.preventDefault();
      } else if (e.key === "End") {
        nextIdx = tabs.length - 1;
        e.preventDefault();
      }

      if (nextIdx !== activeIdx) {
        tabs[nextIdx].focus();
        activateTab(tabs[nextIdx]);
      }
    });

    container.appendChild(nav);
    container.appendChild(panelsContainer);
    return container;
  }

  /**
   * Helper to determine attempt badge status (1st Attempt vs 2nd Attempt / Repeat)
   */
  function getAttemptInfo(course) {
    if (course.repeatCleared || Number(course.attempt) === 2 || course.attempt === 2 || course.isRepeat) {
      return {
        text: "2nd Attempt",
        badgeClass: "badge-attempt-2nd",
        isRepeat: true
      };
    }
    if (["I(SE)", "I(CA)", "E", "DFR", "AB", "INC"].includes(course.grade)) {
      return {
        text: "Repeat Pending",
        badgeClass: "badge-attempt-pending",
        isRepeat: false
      };
    }
    return {
      text: "1st Attempt",
      badgeClass: "badge-attempt-1st",
      isRepeat: false
    };
  }

  /**
   * Renders a single semester block (header + table of subjects)
   */
  function renderSingleSemesterBlock(sem) {
    const courses = sem.courses || sem.subjects || [];
    const hasRepeats = courses.some(c => c.repeatCleared || Number(c.attempt) === 2 || c.attempt === 2 || c.isRepeat);

    const headerActions = [
      el("span", { class: "semester-sgpa-pill" }, `SGPA: ${Number(sem.sgpa || 0).toFixed(2)}`)
    ];

    if (hasRepeats) {
      headerActions.unshift(
        el("span", { class: "semester-repeat-tag" }, "🔁 Includes 2nd Attempt")
      );
    }

    const header = el("div", { class: "semester-summary-header" },
      el("h3", { class: "semester-title" }, sem.semesterTitle || `Year ${sem.year} Semester ${sem.semester}`),
      el("div", { style: { display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" } },
        ...headerActions
      )
    );

    // Subject Table
    const tableBody = el("tbody");
    courses.forEach(course => {
      const gradeClass = getGradeClass(course.grade);
      const attempt = getAttemptInfo(course);
      const gradeTooltip = (CONFIG.specialGradeDescriptions && CONFIG.specialGradeDescriptions[course.grade])
        ? CONFIG.specialGradeDescriptions[course.grade]
        : `Grade: ${course.grade}`;

      const row = el("tr", {},
        el("td", { class: "col-code", "data-label": "Code" },
          el("span", { class: "course-code" }, course.code || "-")
        ),
        el("td", { class: "col-title", "data-label": "Subject Name" },
          el("span", { class: "course-name" }, course.title || course.name || "-")
        ),
        el("td", { "data-label": "Grade" },
          el("span", {
            class: `grade-pill ${gradeClass}`,
            title: gradeTooltip
          }, course.grade || "-")
        ),
        el("td", { "data-label": "Grade Point" },
          course.gradePoint !== undefined ? Number(course.gradePoint).toFixed(2) : "-"
        ),
        el("td", { "data-label": "Attempt" },
          el("span", { class: `attempt-badge ${attempt.badgeClass}` }, attempt.text)
        )
      );
      tableBody.appendChild(row);
    });

    const table = el("div", { class: "grade-table-wrapper" },
      el("table", { class: "grade-table" },
        el("thead", {},
          el("tr", {},
            el("th", {}, "Course Code"),
            el("th", {}, "Course Title"),
            el("th", {}, "Grade"),
            el("th", {}, "Grade Point"),
            el("th", {}, "Attempt")
          )
        ),
        tableBody
      )
    );

    return el("div", { style: { marginBottom: "1.5rem" } }, header, table);
  }

  /**
   * Copies formatted result summary to clipboard
   */
  async function copyResultSummary(student, btn) {
    const originalText = btn.textContent;
    const chkMain = document.getElementById("chkIncludeHonours");
    const showHonours = chkMain ? chkMain.checked : true;
    const honours = (showHonours && typeof getHonoursClassification === "function")
      ? getHonoursClassification(student.cgpa)
      : null;
    let shareUrl = window.location.href;
    try {
      const urlObj = new URL(window.location.href);
      urlObj.searchParams.set("index", student.indexNumber);
      shareUrl = urlObj.toString();
    } catch (e) {
      shareUrl = `${window.location.origin}${window.location.pathname}?index=${encodeURIComponent(student.indexNumber)}`;
    }

    const semGpas = (student.semesters || []).map(s => `Y${s.year}S${s.semester}: ${Number(s.sgpa || 0).toFixed(2)}`).join(" | ");
    const honoursLine = (showHonours && honours && honours.title && honours.minCgpa >= 2.0)
      ? `\n🏆 Academic Standing: ${honours.title}${student.cgpa && Number(student.cgpa) > 0 ? ` (CGPA: ${Number(student.cgpa).toFixed(2)})` : ""}`
      : "";

    const summary = [
      `🎓 I am proud to share that I have successfully completed my HNDIT examination results at SLIATE Kandy!`,
      ``,
      `👤 Student Name: ${student.name}`,
      `📋 Index Number: ${student.indexNumber}`,
      `📚 Program: Higher National Diploma in Information Technology (HNDIT)`,
      `🏛️ Campus: SLIATE Kandy`,
      `📊 Semester GPAs: ${semGpas}${honoursLine}`,
      `\n🔗 View official results record:\n${shareUrl}`
    ].join("\n");

    try {
      await navigator.clipboard.writeText(summary);
      btn.textContent = "✅ Copied to Clipboard!";
      setTimeout(() => {
        btn.textContent = originalText;
      }, 2500);
    } catch (e) {
      showError("Failed to copy automatically. Please copy the summary manually:\n\n" + summary, true);
    }
  }

  /**
   * Displays loading state
   */
  function setLoading(isLoading) {
    if (!searchBtn) init();
    if (isLoading) {
      searchBtn.disabled = true;
      searchBtn.innerHTML = '<span class="spinner" aria-hidden="true"></span> Searching...';
      hideError();
    } else {
      searchBtn.disabled = false;
      searchBtn.innerHTML = '<span>Search Results</span>';
    }
  }

  /**
   * Displays error banner
   */
  function showError(message, isWarning = false) {
    if (!alertBox) init();
    alertBox.textContent = "";
    alertBox.className = `alert-box ${isWarning ? "alert-warning" : "alert-error"}`;

    const icon = el("span", { style: { fontSize: "1.125rem", flexShrink: "0" } }, isWarning ? "⚠️" : "❌");
    const textSpan = el("span", {}, message);

    alertBox.appendChild(icon);
    alertBox.appendChild(textSpan);
    alertBox.style.display = "flex";
  }

  /**
   * Hides error banner
   */
  function hideError() {
    if (!alertBox) init();
    alertBox.style.display = "none";
    alertBox.textContent = "";
  }

  /**
   * Clears results view
   */
  function clearResults() {
    if (!resultsContainer) init();
    resultsContainer.textContent = "";
    resultsContainer.classList.remove("active");
    hideError();
  }

  return {
    init,
    renderResults,
    setLoading,
    showError,
    hideError,
    clearResults,
    getHonoursClassification
  };
})();
