/**
 * ATI SLIATE Unofficial Results Portal - Main Application Controller
 * Handles search workflow, state management, theme switching, and event binding.
 */

document.addEventListener("DOMContentLoaded", () => {
  // App State
  let currentStudentData = null;
  let activeSearchController = null;
  let lastActiveTrigger = null;
  let activeModalTrapCleanup = null;

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
  function syncClearButton() {
    if (searchClearBtn && indexInput) {
      searchClearBtn.style.display = indexInput.value.trim().length > 0 ? "flex" : "none";
    }
  }

  // Sync on initial DOMContentLoaded and pageshow (for bfcache / autofill restoration)
  syncClearButton();
  window.addEventListener("pageshow", syncClearButton);

  if (indexInput) {
    indexInput.addEventListener("input", () => {
      // Auto uppercase & trim spaces
      const val = indexInput.value.toUpperCase();
      indexInput.value = val;
      syncClearButton();
    });

    if (searchClearBtn) {
      searchClearBtn.addEventListener("click", () => {
        if (activeSearchController) {
          activeSearchController.abort();
        }
        indexInput.value = "";
        syncClearButton();
        PortalUI.clearResults();
        currentStudentData = null;
        if (window.location.search) {
          window.history.pushState({}, "", window.location.pathname);
        }
        indexInput.focus();
      });
    }
  }

  // 6. Browser Back/Forward navigation support (popstate)
  window.addEventListener("popstate", () => {
    const params = new URLSearchParams(window.location.search);
    const idx = params.get("index");
    if (idx) {
      const upper = idx.toUpperCase();
      if (indexInput) {
        indexInput.value = upper;
        syncClearButton();
      }
      performSearch(upper, true);
    } else {
      if (activeSearchController) {
        activeSearchController.abort();
      }
      if (indexInput) {
        indexInput.value = "";
        syncClearButton();
      }
      currentStudentData = null;
      PortalUI.clearResults();
    }
  });

  // 6. Search Form Submission
  if (searchForm) {
    searchForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const query = indexInput.value;
      performSearch(query);
    });
  }

  // 8. Core Search Flow
  async function performSearch(rawIndex, fromPopstate = false) {
    // A. Offline network pre-check
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      PortalUI.showError("You appear to be offline. Please check your internet connection and try again.", true);
      return;
    }

    // B. Validate input
    const validation = PortalSecurity.validateIndex(rawIndex);
    if (!validation.isValid) {
      PortalUI.showError(validation.error);
      return;
    }

    const normalizedIndex = validation.normalized;

    // C. Check anti-abuse rate limit
    const rateCheck = PortalSecurity.checkRateLimit();
    if (!rateCheck.allowed) {
      PortalUI.showError(
        `Too many search attempts. For security and anti-scraping protection, please wait ${rateCheck.remainingSeconds} seconds before trying again.`,
        true
      );
      return;
    }

    // Cancel any previous in-flight fetch
    if (activeSearchController) {
      activeSearchController.abort();
    }
    activeSearchController = new AbortController();
    const { signal } = activeSearchController;

    // D. Set Loading State
    PortalUI.setLoading(true);

    try {
      // E. Compute SHA-256 hash for encrypted file lookup
      const fileHash = await PortalCrypto.computeIndexHash(normalizedIndex);
      const fileUrl = `data/encrypted/${fileHash}.json`;

      // F. Fetch the encrypted JSON blob
      const response = await fetch(fileUrl, { cache: "no-store", signal });
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

      // G. Decrypt the record client-side with AES-256-GCM
      const studentData = await PortalCrypto.decryptStudentData(encryptedBlob, normalizedIndex);

      // H. Render Result View
      currentStudentData = studentData;
      PortalSecurity.clearRateLimitCooldown();
      PortalUI.renderResults(studentData);

      // I. Bind Action Buttons inside the rendered view
      bindResultActionButtons();

      // J. Update URL search query cleanly without reload or carrying leftover params
      const targetQuery = `?index=${encodeURIComponent(normalizedIndex)}`;
      const cleanUrl = `${window.location.pathname}${targetQuery}`;
      if (!fromPopstate && window.location.search !== targetQuery) {
        window.history.pushState({ index: normalizedIndex }, "", cleanUrl);
      }

    } catch (err) {
      if (err.name === "AbortError") {
        return; // Stale fetch aborted by user action or rapid search
      }
      console.error("Search error:", err);
      if (err instanceof TypeError || (err.message && err.message.toLowerCase().includes("failed to fetch"))) {
        PortalUI.showError("Network connection error. Unable to retrieve result data. Please check your internet connection.", true);
      } else {
        PortalUI.showError(err.message || "An unexpected error occurred while processing the result.");
      }
    } finally {
      if (!signal.aborted) {
        PortalUI.setLoading(false);
      }
    }
  }

  // 9. Bind PDF & Social Card buttons when results are active
  function bindResultActionButtons() {
    const pdfBtn = document.getElementById("btnDownloadPdf");
    const socialBtn = document.getElementById("btnOpenSocialModal");
    const chkMainHonours = document.getElementById("chkIncludeHonours");

    if (chkMainHonours) {
      chkMainHonours.addEventListener("change", () => {
        const isChecked = chkMainHonours.checked;
        const standingBadge = document.querySelector(".standing-badge-wrapper");
        if (standingBadge) {
          standingBadge.style.display = isChecked ? "flex" : "none";
        }
        const chkModal = document.getElementById("chkModalHonours");
        if (chkModal) chkModal.checked = isChecked;
      });
    }

    if (pdfBtn && currentStudentData) {
      pdfBtn.addEventListener("click", () => {
        const chk = document.getElementById("chkIncludeHonours");
        const showHonours = chk ? chk.checked : true;
        PortalPdfGenerator.generateCertificate(currentStudentData, { showHonours });
      });
    }

    if (socialBtn && currentStudentData) {
      socialBtn.addEventListener("click", () => {
        openSocialModal();
      });
    }
  }

  // 10. Modal Focus Trapping & Accessibility Helpers
  function trapFocusInModal(modalEl, closeFn) {
    if (activeModalTrapCleanup) {
      activeModalTrapCleanup();
    }

    const focusableSelectors = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

    function handleKeyDown(e) {
      if (e.key === "Escape") {
        e.preventDefault();
        closeFn();
        return;
      }
      if (e.key === "Tab") {
        const focusableElements = Array.from(modalEl.querySelectorAll(focusableSelectors)).filter(
          el => !el.disabled && el.offsetParent !== null
        );
        if (focusableElements.length === 0) {
          e.preventDefault();
          return;
        }
        const firstFocusable = focusableElements[0];
        const lastFocusable = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstFocusable) {
            e.preventDefault();
            lastFocusable.focus();
          }
        } else {
          if (document.activeElement === lastFocusable) {
            e.preventDefault();
            firstFocusable.focus();
          }
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    // Initial focus on close button or first focusable element
    const closeBtn = modalEl.querySelector(".modal-close-btn");
    if (closeBtn) {
      closeBtn.focus();
    } else {
      const first = modalEl.querySelector(focusableSelectors);
      if (first) first.focus();
    }

    activeModalTrapCleanup = () => {
      document.removeEventListener("keydown", handleKeyDown);
      activeModalTrapCleanup = null;
      if (lastActiveTrigger && typeof lastActiveTrigger.focus === "function") {
        lastActiveTrigger.focus();
        lastActiveTrigger = null;
      }
    };
  }

  // Social Card Modal Controls
  function openSocialModal() {
    if (!currentStudentData || !socialModal) return;
    lastActiveTrigger = document.activeElement;
    socialModal.classList.add("active");
    socialModal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden"; // lock scroll
    trapFocusInModal(socialModal, closeSocialModal);

    const chkMain = document.getElementById("chkIncludeHonours");
    const showHonours = chkMain ? chkMain.checked : true;
    const chkModal = document.getElementById("chkModalHonours");
    if (chkModal) chkModal.checked = showHonours;

    const chkModalBlur = document.getElementById("chkModalBlurIndex");
    const blurIndex = chkModalBlur ? chkModalBlur.checked : false;

    // Render initial canvas
    PortalSocialCardGenerator.render(currentStudentData, { showHonours, blurIndex });
  }

  function closeSocialModal() {
    if (!socialModal) return;
    socialModal.classList.remove("active");
    socialModal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (activeModalTrapCleanup) {
      activeModalTrapCleanup();
    }
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
  }

  // 11. Official Grading Scheme Modal Controls (Section 5.9 & 5.10)
  const gradingModal = document.getElementById("gradingModal");
  const btnOpenGradingModal = document.getElementById("btnOpenGradingModal");
  const btnFooterGradingScheme = document.getElementById("btnFooterGradingScheme");
  const gradingModalCloseBtn = document.getElementById("gradingModalCloseBtn");

  function openGradingModal() {
    if (!gradingModal) return;
    lastActiveTrigger = document.activeElement;
    gradingModal.classList.add("active");
    gradingModal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    trapFocusInModal(gradingModal, closeGradingModal);
  }

  function closeGradingModal() {
    if (!gradingModal) return;
    gradingModal.classList.remove("active");
    gradingModal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (activeModalTrapCleanup) {
      activeModalTrapCleanup();
    }
  }

  if (btnOpenGradingModal) btnOpenGradingModal.addEventListener("click", openGradingModal);
  if (btnFooterGradingScheme) btnFooterGradingScheme.addEventListener("click", openGradingModal);
  if (gradingModalCloseBtn) gradingModalCloseBtn.addEventListener("click", closeGradingModal);

  if (gradingModal) {
    gradingModal.addEventListener("click", (e) => {
      if (e.target === gradingModal) closeGradingModal();
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

  // Honours Toggle inside Modal
  const chkModalHonours = document.getElementById("chkModalHonours");
  if (chkModalHonours) {
    chkModalHonours.addEventListener("change", () => {
      const showHonours = chkModalHonours.checked;
      const chkMain = document.getElementById("chkIncludeHonours");
      if (chkMain) {
        chkMain.checked = showHonours;
        const standingBadge = document.querySelector(".standing-badge-wrapper");
        if (standingBadge) {
          standingBadge.style.display = showHonours ? "flex" : "none";
        }
      }
      PortalSocialCardGenerator.render(currentStudentData, { showHonours });
    });
  }

  // Privacy Option: Blur Index Toggle inside Modal
  const chkModalBlurIndex = document.getElementById("chkModalBlurIndex");
  if (chkModalBlurIndex) {
    chkModalBlurIndex.addEventListener("change", () => {
      const blurIndex = chkModalBlurIndex.checked;
      PortalSocialCardGenerator.render(currentStudentData, { blurIndex });
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

  // 12. Auto-search on page load if ?index= query parameter exists
  const urlParams = new URLSearchParams(window.location.search);
  const initialIndex = urlParams.get("index");
  if (initialIndex && indexInput) {
    indexInput.value = initialIndex.toUpperCase();
    syncClearButton();
    performSearch(initialIndex, true);
  }
});
