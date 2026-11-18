/**
 * ATI SLIATE Unofficial Results Portal - Security & Validation
 * Safe DOM creation helpers, input validation, and anti-abuse client rate limiting.
 */

const PortalSecurity = (() => {
  const RATE_STORAGE_KEY = "ati_portal_rate_limit";

  /**
   * Validates index number structure.
   * SLIATE formats are typically:
   * CAMPUS/PROGRAM/YEAR/TYPE/NUMBER e.g. AMP/IT/2021/F/0001
   * Also permits minor variations like hyphens or slightly differing code lengths.
   */
  function validateIndex(rawInput) {
    if (!rawInput || typeof rawInput !== "string") {
      return { isValid: false, error: "Please enter an index number." };
    }

    const trimmed = rawInput.trim().toUpperCase();

    if (trimmed.length < 5 || trimmed.length > 30) {
      return { isValid: false, error: "Index number length should be between 5 and 30 characters." };
    }

    // Strict character whitelist: uppercase letters, digits, slashes, hyphens
    const whitelistRegex = /^[A-Z0-9\/\-]+$/;
    if (!whitelistRegex.test(trimmed)) {
      return {
        isValid: false,
        error: "Index number contains invalid characters. Use letters, numbers, slashes (/), and hyphens only."
      };
    }

    // Standard SLIATE format regex recommendation
    const sliateRegex = /^[A-Z]{2,5}[\/\-][A-Z]{2,5}[\/\-]\d{4}[\/\-][FP][\/\-]\d{2,6}$/;
    if (!sliateRegex.test(trimmed)) {
      // We allow standard alphanumeric codes too, but warn if format looks malformed
      if (trimmed.split(/[\/\-]/).length < 3) {
        return {
          isValid: false,
          error: "Format does not match ATI SLIATE standards (e.g. AMP/IT/2021/F/0001)."
        };
      }
    }

    return { isValid: true, normalized: trimmed };
  }

  /**
   * Client-side rate limiting tracker stored in sessionStorage
   * Returns { allowed: boolean, remainingSeconds: number }
   */
  function checkRateLimit() {
    const now = Date.now();
    let records = [];

    try {
      const stored = sessionStorage.getItem(RATE_STORAGE_KEY);
      if (stored) {
        records = JSON.parse(stored);
      }
    } catch (e) {
      records = [];
    }

    // Clean records older than windowMs
    const windowStart = now - CONFIG.rateLimit.windowMs;
    records = records.filter(ts => ts > windowStart);

    // Check if cooldown is active
    const lastAttempt = records[records.length - 1];
    if (records.length >= CONFIG.rateLimit.maxAttempts) {
      const lockUntil = (lastAttempt || now) + CONFIG.rateLimit.cooldownMs;
      if (now < lockUntil) {
        const remainingSeconds = Math.ceil((lockUntil - now) / 1000);
        return { allowed: false, remainingSeconds };
      } else {
        // Cooldown passed, reset half of attempts
        records = records.slice(records.length - 2);
      }
    }

    // Record this attempt
    records.push(now);
    try {
      sessionStorage.setItem(RATE_STORAGE_KEY, JSON.stringify(records));
    } catch (e) {
      // Session storage full or disabled
    }

    return { allowed: true, remainingSeconds: 0 };
  }

  /**
   * Resets rate limit upon successful search
   */
  function clearRateLimitCooldown() {
    try {
      sessionStorage.removeItem(RATE_STORAGE_KEY);
    } catch (e) {}
  }

  /**
   * Safe DOM Creation: Creates an element and appends children or sets safe text.
   * Completely avoids innerHTML for untrusted input.
   */
  function el(tagName, attributes = {}, ...children) {
    const element = document.createElement(tagName);

    for (const [key, value] of Object.entries(attributes)) {
      if (key === "className" || key === "class") {
        element.className = value;
      } else if (key === "dataset" && typeof value === "object") {
        for (const [dKey, dVal] of Object.entries(value)) {
          element.dataset[dKey] = dVal;
        }
      } else if (key.startsWith("on") && typeof value === "function") {
        const eventName = key.substring(2).toLowerCase();
        element.addEventListener(eventName, value);
      } else if (key === "style" && typeof value === "object") {
        Object.assign(element.style, value);
      } else if (value !== null && value !== undefined) {
        element.setAttribute(key, value);
      }
    }

    for (const child of children) {
      if (child === null || child === undefined) continue;
      if (typeof child === "string" || typeof child === "number") {
        element.appendChild(document.createTextNode(String(child)));
      } else if (child instanceof Node) {
        element.appendChild(child);
      } else if (Array.isArray(child)) {
        for (const nested of child) {
          if (nested instanceof Node) {
            element.appendChild(nested);
          } else if (typeof nested === "string" || typeof nested === "number") {
            element.appendChild(document.createTextNode(String(nested)));
          }
        }
      }
    }

    return element;
  }

  /**
   * Escapes HTML characters safely
   */
  function escapeHtml(str) {
    if (typeof str !== "string") return "";
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  return {
    validateIndex,
    checkRateLimit,
    clearRateLimitCooldown,
    el,
    escapeHtml
  };
})();
