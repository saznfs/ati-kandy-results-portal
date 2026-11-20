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
   * Returns grade badge CSS class based on grade letter
   */
  function getGradeClass(grade) {
    if (!grade) return "grade-E";
    const letter = grade.trim().charAt(0).toUpperCase();
    if (letter === "A") return "grade-A";
    if (letter === "B") return "grade-B";
    if (letter === "C") return "grade-C";
    if (letter === "D") return "grade-D";
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
      el("div", { style: { display: "flex", justifyContent: "center", marginTop: "14px" } },
        el("span", { class: `standing-badge ${honours.badgeClass}` }, honours.title)
      )
    );
  }

  /**
   * Action buttons (PDF download, Social Card, Copy summary)
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

    return el("div", { class: "action-toolbar" },
      pdfBtn,
      socialBtn,
      copyBtn
    );
  }

  /**
   * Multi-Semester Navigation & Tables
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
      class: "tab-btn active",
      role: "tab",
      "aria-selected": "true",
      dataset: { tabTarget: "tab-all" }
    }, "All Semesters Overview");

    nav.appendChild(allTabBtn);

    // Individual semester tab buttons
    semesters.forEach((sem, idx) => {
      const semTabBtn = el("button", {
        type: "button",
        class: "tab-btn",
        role: "tab",
        "aria-selected": "false",
        dataset: { tabTarget: `tab-sem-${idx}` }
      }, sem.semesterTitle || `Year ${sem.year} Sem ${sem.semester}`);
      nav.appendChild(semTabBtn);
    });

    // Panel 1: All Semesters
    const allPanel = el("div", { class: "semester-panel active", id: "tab-all", role: "tabpanel" });
    semesters.forEach(sem => {
      allPanel.appendChild(renderSingleSemesterBlock(sem));
    });
    panelsContainer.appendChild(allPanel);

    // Panels for individual semesters
    semesters.forEach((sem, idx) => {
      const singlePanel = el("div", { class: "semester-panel", id: `tab-sem-${idx}`, role: "tabpanel" });
      singlePanel.appendChild(renderSingleSemesterBlock(sem));
      panelsContainer.appendChild(singlePanel);
    });

    // Tab switching event delegation
    nav.addEventListener("click", (e) => {
      const btn = e.target.closest(".tab-btn");
      if (!btn) return;

      nav.querySelectorAll(".tab-btn").forEach(b => {
        b.classList.remove("active");
        b.setAttribute("aria-selected", "false");
      });
      btn.classList.add("active");
      btn.setAttribute("aria-selected", "true");

      const targetId = btn.dataset.tabTarget;
      panelsContainer.querySelectorAll(".semester-panel").forEach(p => {
        p.classList.remove("active");
      });

      const activePanel = document.getElementById(targetId);
      if (activePanel) {
        activePanel.classList.add("active");
      }
    });

    container.appendChild(nav);
    container.appendChild(panelsContainer);
    return container;
  }

  /**
   * Renders a single semester block (header + table of subjects)
   */
  function renderSingleSemesterBlock(sem) {
    const courses = sem.courses || sem.subjects || [];

    const header = el("div", { class: "semester-summary-header" },
      el("h3", { class: "semester-title" }, sem.semesterTitle || `Year ${sem.year} Semester ${sem.semester}`),
      el("div", { style: { display: "flex", gap: "8px", alignItems: "center" } },
        el("span", { class: "semester-sgpa-pill" }, `SGPA: ${Number(sem.sgpa || 0).toFixed(2)}`)
      )
    );

    // Subject Table
    const tableBody = el("tbody");
    courses.forEach(course => {
      const gradeClass = getGradeClass(course.grade);

      const row = el("tr", {},
        el("td", { class: "col-code", "data-label": "Code" },
          el("span", { class: "course-code" }, course.code || "-")
        ),
        el("td", { class: "col-title", "data-label": "Subject Name" },
          el("span", { class: "course-name" }, course.title || course.name || "-")
        ),
        el("td", { "data-label": "Grade" },
          el("span", { class: `grade-pill ${gradeClass}` }, course.grade || "-")
        ),
        el("td", { "data-label": "Grade Point" },
          course.gradePoint !== undefined ? Number(course.gradePoint).toFixed(2) : "-"
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
            el("th", {}, "Grade Point")
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
    const honours = getHonoursClassification(student.cgpa);
    let shareUrl = window.location.href;
    try {
      const urlObj = new URL(window.location.href);
      urlObj.searchParams.set("index", student.indexNumber);
      shareUrl = urlObj.toString();
    } catch (e) {
      shareUrl = `${window.location.origin}${window.location.pathname}?index=${encodeURIComponent(student.indexNumber)}`;
    }

    const semGpas = (student.semesters || []).map(s => `Y${s.year}S${s.semester}: ${Number(s.sgpa || 0).toFixed(2)}`).join(" | ");
    const summary = [
      `🎓 SLIATE KANDY Academic Results`,
      `Student: ${student.name}`,
      `Index No: ${student.indexNumber}`,
      `Program: HNDIT`,
      `Campus: SLIATE Kandy`,
      `Semester GPAs: ${semGpas}`,
      `Honours: ${honours.title}`,
      `\nView results at: ${shareUrl}`
    ].join("\n");

    try {
      await navigator.clipboard.writeText(summary);
      btn.textContent = "✅ Copied to Clipboard!";
      setTimeout(() => {
        btn.textContent = originalText;
      }, 2500);
    } catch (e) {
      alert("Failed to copy. Please manually copy:\n\n" + summary);
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
