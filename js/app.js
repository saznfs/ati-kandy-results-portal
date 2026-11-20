/**
 * ATI SLIATE Unofficial Results Portal - Main Application Controller
 * Handles search workflow, state management, theme switching, and event binding.
 */

document.addEventListener("DOMContentLoaded", () => {
  // App State
  let currentStudentData = null;

  // DOM Elements
  const searchForm = document.getElementById("searchForm");
  const indexInput = document.getElementById("indexInput");
  const searchClearBtn = document.getElementById("searchClearBtn");
  const themeToggleBtn = document.getElementById("themeToggleBtn");
  const logoImg = document.getElementById("siteLogo");
  const reportLink = document.getElementById("reportIssueLink");

  // Social Modal Elements
  const socialModal = document.getElementById("socialModal");
  const modalCloseBtn = document.getElementById("modalCloseBtn");
  const btnDownloadPng = document.getElementById("btnDownloadPng");
  const btnShareCard = document.getElementById("btnShareCard");
  const aspectBtns = document.querySelectorAll("[data-aspect]");
  const themeBtns = document.querySelectorAll("[data-theme-choice]");
  const toggleGrades = document.getElementById("toggleShowGrades");

  // 1. Initialize UI components
  PortalUI.init();
  PortalSocialCardGenerator.init();

  // 2. Setup Logo Fallback
  if (logoImg) {
    logoImg.src = CONFIG.logoPath;
    logoImg.addEventListener("error", () => {
      // Gracefully fall back to vector placeholder if sliate-logo.png is absent
      if (logoImg.src !== CONFIG.logoFallback) {
        logoImg.src = CONFIG.logoFallback;
      }
    });
  }

  // 3. Setup Report / Removal Link
  if (reportLink) {
    reportLink.href = CONFIG.reportIssueUrl || `mailto:${CONFIG.reportIssueEmail}`;
  }

  // 4. Initialize Theme (Light/Dark)
  initTheme();

  function initTheme() {
    const savedTheme = localStorage.getItem("ati_portal_theme");
    const systemPrefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialTheme = savedTheme || (systemPrefersDark ? "dark" : "light");

    document.documentElement.setAttribute("data-theme", initialTheme);

    if (themeToggleBtn) {
      themeToggleBtn.addEventListener("click", () => {
        const current = document.documentElement.getAttribute("data-theme");
        const next = current === "dark" ? "light" : "dark";
        document.documentElement.setAttribute("data-theme", next);
        localStorage.setItem("ati_portal_theme", next);
      });
    }
  }

  // 5. Input Auto-Formatting & Clear Button
  if (indexInput) {
    indexInput.addEventListener("input", () => {
      // Auto uppercase & trim spaces
      const val = indexInput.value.toUpperCase();
      indexInput.value = val;

      if (searchClearBtn) {
        searchClearBtn.style.display = val.length > 0 ? "block" : "none";
      }
    });

    if (searchClearBtn) {
      searchClearBtn.addEventListener("click", () => {
        indexInput.value = "";
        searchClearBtn.style.display = "none";
        PortalUI.clearResults();
        indexInput.focus();
      });
    }
  }

  // 6. Search Form Submission
  if (searchForm) {
    searchForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const query = indexInput.value;
      performSearch(query);
    });
  }

  // 8. Core Search Flow
  async function performSearch(rawIndex) {
    // A. Validate input
    const validation = PortalSecurity.validateIndex(rawIndex);
    if (!validation.isValid) {
      PortalUI.showError(validation.error);
      return;
    }

    const normalizedIndex = validation.normalized;

    // B. Check anti-abuse rate limit
    const rateCheck = PortalSecurity.checkRateLimit();
    if (!rateCheck.allowed) {
      PortalUI.showError(
        `Too many search attempts. For security and anti-scraping protection, please wait ${rateCheck.remainingSeconds} seconds before trying again.`,
        true
      );
      return;
    }

    // C. Set Loading State
    PortalUI.setLoading(true);

    try {
      // D. Compute SHA-256 hash for encrypted file lookup
      const fileHash = await PortalCrypto.computeIndexHash(normalizedIndex);
      const fileUrl = `data/encrypted/${fileHash}.json`;

      // E. Fetch the encrypted JSON blob
      const response = await fetch(fileUrl, { cache: "no-store" });
      if (!response.ok) {
        if (response.status === 404) {
          PortalUI.showError(
            `No result record found for index number "${normalizedIndex}". Please verify your index number or contact your ATI examination branch.`
          );
        } else {
          PortalUI.showError(`Error retrieving result data (HTTP ${response.status}). Please try again later.`);
        }
        PortalUI.setLoading(false);
        return;
      }

      const encryptedBlob = await response.json();

      // F. Decrypt the record client-side with AES-256-GCM
      const studentData = await PortalCrypto.decryptStudentData(encryptedBlob, normalizedIndex);

      // G. Render Result View
      currentStudentData = studentData;
      PortalSecurity.clearRateLimitCooldown();
      PortalUI.renderResults(studentData);

      // H. Bind Action Buttons inside the rendered view
      bindResultActionButtons();

      // I. Update URL search query without reload
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set("index", normalizedIndex);
      window.history.replaceState({}, "", newUrl.toString());

    } catch (err) {
      console.error("Search error:", err);
      PortalUI.showError(err.message || "An unexpected error occurred while processing the result.");
    } finally {
      PortalUI.setLoading(false);
    }
  }

  // 9. Bind PDF & Social Card buttons when results are active
  function bindResultActionButtons() {
    const pdfBtn = document.getElementById("btnDownloadPdf");
    const socialBtn = document.getElementById("btnOpenSocialModal");

    if (pdfBtn && currentStudentData) {
      pdfBtn.addEventListener("click", () => {
        PortalPdfGenerator.generateCertificate(currentStudentData);
      });
    }

    if (socialBtn && currentStudentData) {
      socialBtn.addEventListener("click", () => {
        openSocialModal();
      });
    }
  }

  // 10. Social Card Modal Controls
  function openSocialModal() {
    if (!currentStudentData || !socialModal) return;
    socialModal.classList.add("active");
    socialModal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden"; // lock scroll

    // Render initial canvas
    PortalSocialCardGenerator.render(currentStudentData);
  }

  function closeSocialModal() {
    if (!socialModal) return;
    socialModal.classList.remove("active");
    socialModal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  if (modalCloseBtn) {
    modalCloseBtn.addEventListener("click", closeSocialModal);
  }

  if (socialModal) {
    // Close on backdrop click
    socialModal.addEventListener("click", (e) => {
      if (e.target === socialModal) {
        closeSocialModal();
      }
    });

    // Close on Escape key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && socialModal.classList.contains("active")) {
        closeSocialModal();
      }
    });
  }

  // Aspect Ratio Buttons (9:16 vs 1:1)
  aspectBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      aspectBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const aspect = btn.dataset.aspect;
      PortalSocialCardGenerator.render(currentStudentData, { aspectRatio: aspect });
    });
  });

  // Card Theme Buttons (navy, emerald, onyx, crimson)
  themeBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      themeBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const themeChoice = btn.dataset.themeChoice;
      PortalSocialCardGenerator.render(currentStudentData, { theme: themeChoice });
    });
  });

  // Privacy Switches
  if (toggleGrades) {
    toggleGrades.addEventListener("change", () => {
      PortalSocialCardGenerator.render(currentStudentData, { showGrades: toggleGrades.checked });
    });
  }

  // Download & Share buttons
  if (btnDownloadPng) {
    btnDownloadPng.addEventListener("click", () => {
      PortalSocialCardGenerator.downloadCard();
    });
  }

  if (btnShareCard) {
    btnShareCard.addEventListener("click", () => {
      PortalSocialCardGenerator.shareCard();
    });
  }

  // 11. Auto-search on page load if ?index= query parameter exists
  const urlParams = new URLSearchParams(window.location.search);
  const initialIndex = urlParams.get("index");
  if (initialIndex && indexInput) {
    indexInput.value = initialIndex.toUpperCase();
    if (searchClearBtn) searchClearBtn.style.display = "block";
    performSearch(initialIndex);
  }
});
