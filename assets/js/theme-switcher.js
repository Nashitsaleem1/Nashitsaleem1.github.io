(function () {
  if (window.NashitThemeScriptLoaded) {
    if (window.NashitTheme) {
      window.NashitTheme.mount();
    }
    return;
  }

  window.NashitThemeScriptLoaded = true;

  const STORAGE_KEY = "nashit-theme";
  const EMAIL_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyTOJUs12QHmj0MuIu9cVLiXgydxTxOfDmNv8rfEa7-G9JIC_WiQBbxPQTpm_GiJwCg/exec";
  const THEMES = new Set(["dark", "light"]);
  const root = document.documentElement;
  const themeStyleHref = (() => {
    const script = document.currentScript;
    if (!script || !script.src) {
      return null;
    }

    const href = new URL("../css/theme-switcher.css", script.src);
    href.searchParams.set("v", "blog-mobile-menu-1");
    return href.href;
  })();

  function ensureThemeStyles() {
    if (document.querySelector('link[data-theme-switcher-styles="true"]')) {
      return;
    }

    if (!themeStyleHref) {
      return;
    }

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = themeStyleHref;
    link.dataset.themeSwitcherStyles = "true";
    document.head.appendChild(link);
  }

  function scheduleThemeStyles() {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", ensureThemeStyles, { once: true });
    } else {
      ensureThemeStyles();
    }
  }

  function readStoredTheme() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch (error) {
      return null;
    }
  }

  function writeStoredTheme(theme) {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (error) {
      // Theme still changes for this page even when storage is unavailable.
    }
  }

  function normalizeTheme(theme) {
    return THEMES.has(theme) ? theme : "dark";
  }

  function currentTheme() {
    return normalizeTheme(root.dataset.theme || readStoredTheme());
  }

  function syncButtons() {
    const theme = currentTheme();
    const nextTheme = theme === "light" ? "dark" : "light";
    const nextLabel = nextTheme.charAt(0).toUpperCase() + nextTheme.slice(1);

    document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
      const label = button.querySelector("[data-theme-toggle-label]");
      const ariaLabel = `Switch to ${nextTheme} theme`;
      const ariaPressed = theme === "light" ? "true" : "false";

      if (button.getAttribute("aria-label") !== ariaLabel) {
        button.setAttribute("aria-label", ariaLabel);
      }

      if (button.getAttribute("aria-pressed") !== ariaPressed) {
        button.setAttribute("aria-pressed", ariaPressed);
      }

      if (button.title !== ariaLabel) {
        button.title = ariaLabel;
      }

      if (label && label.textContent !== nextLabel) {
        label.textContent = nextLabel;
      }
    });
  }

  function applyTheme(theme, persist) {
    const nextTheme = normalizeTheme(theme);

    if (root.dataset.theme !== nextTheme) {
      root.dataset.theme = nextTheme;
    }

    if (root.style.colorScheme !== nextTheme) {
      root.style.colorScheme = nextTheme;
    }

    if (persist) {
      writeStoredTheme(nextTheme);
    }

    syncButtons();
  }

  function createToggle(extraClass) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = ["theme-toggle", extraClass].filter(Boolean).join(" ");
    button.dataset.themeToggle = "";
    button.innerHTML = [
      '<span class="theme-toggle-icon" aria-hidden="true">',
      '<svg class="theme-toggle-sun" viewBox="0 0 24 24" focusable="false" aria-hidden="true">',
      '<circle cx="12" cy="12" r="4"></circle>',
      '<path d="M12 2v2.5M12 19.5V22M4.93 4.93 6.7 6.7M17.3 17.3l1.77 1.77M2 12h2.5M19.5 12H22M4.93 19.07 6.7 17.3M17.3 6.7l1.77-1.77"></path>',
      "</svg>",
      '<svg class="theme-toggle-moon" viewBox="0 0 24 24" focusable="false" aria-hidden="true">',
      '<path d="M21 14.8A8.6 8.6 0 0 1 9.2 3a7.2 7.2 0 1 0 11.8 11.8Z"></path>',
      "</svg>",
      "</span>",
      '<span class="theme-toggle-label" data-theme-toggle-label>Light</span>',
    ].join("");

    return button;
  }

  function directChild(parent, selector) {
    return Array.from(parent.children).find((child) => child.matches(selector));
  }

  function replaceBookCopy(element) {
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    let node = walker.nextNode();

    while (node) {
      node.nodeValue = node.nodeValue.replace(/Book\s+A\s+Call/gi, "Email Me");
      node = walker.nextNode();
    }
  }

  function ensureEmailTriggers() {
    document.querySelectorAll('a[href*="calendly.com/nashitsaleem"], a[href="#email-me"]').forEach((link) => {
      link.href = "#email-me";
      link.dataset.emailTrigger = "";
      link.removeAttribute("target");
      link.removeAttribute("rel");
      replaceBookCopy(link);
    });

    document.querySelectorAll(".book-a-call3, .book-a-call, .nashit-book-btn, .writing-book-btn").forEach((button) => {
      replaceBookCopy(button);
    });
  }

  function setEmailStatus(message, type) {
    const status = document.querySelector("[data-email-status]");

    if (!status) {
      return;
    }

    status.textContent = message;
    status.dataset.type = type || "";
  }

  function isEmailScriptReady() {
    return /^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec$/i.test(EMAIL_SCRIPT_URL);
  }

  function createSubmissionId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  function ensureEmailModal() {
    if (document.querySelector("[data-email-modal]") || !document.body) {
      return;
    }

    const modal = document.createElement("div");
    modal.className = "email-modal";
    modal.dataset.emailModal = "";
    modal.hidden = true;
    modal.innerHTML = [
      '<div class="email-modal__backdrop" data-email-close></div>',
      '<section class="email-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="email-modal-title">',
      '<button type="button" class="email-modal__close" data-email-close aria-label="Close email form">&times;</button>',
      '<p class="email-modal__eyebrow">Direct email</p>',
      '<h2 id="email-modal-title">Email Me</h2>',
      '<p class="email-modal__intro">Share a few details and the message will be sent directly.</p>',
      `<form class="email-modal__form" data-email-form action="${EMAIL_SCRIPT_URL || "#"}" method="POST">`,
      '<input type="hidden" name="submissionId" data-email-submission-id>',
      '<label class="email-modal__field">Name<input type="text" name="name" autocomplete="name" required></label>',
      '<label class="email-modal__field">Email<input type="email" name="email" autocomplete="email" required></label>',
      '<label class="email-modal__field">Message<textarea name="message" rows="5" required></textarea></label>',
      '<button type="submit" class="email-modal__submit">Send Email</button>',
      '<p class="email-modal__status" data-email-status aria-live="polite"></p>',
      "</form>",
      "</section>",
    ].join("");

    document.body.appendChild(modal);
  }

  function openEmailModal(trigger) {
    ensureEmailModal();

    const modal = document.querySelector("[data-email-modal]");

    if (!modal) {
      return;
    }

    const firstInput = modal.querySelector('input[name="name"]');
    const submissionInput = modal.querySelector("[data-email-submission-id]");

    if (submissionInput) {
      submissionInput.value = createSubmissionId();
    }

    setEmailStatus("", "");
    modal.hidden = false;
    document.body.classList.add("email-modal-open");

    if (firstInput) {
      firstInput.focus();
    }
  }

  function closeEmailModal() {
    const modal = document.querySelector("[data-email-modal]");

    if (!modal) {
      return;
    }

    modal.hidden = true;
    document.body.classList.remove("email-modal-open");
  }

  async function submitEmailForm(form) {
    if (form.dataset.emailSending === "true") {
      return;
    }

    const submitButton = form.querySelector('button[type="submit"]');
    const submissionInput = form.querySelector("[data-email-submission-id]");
    const formData = new FormData(form);

    if (!isEmailScriptReady()) {
      setEmailStatus("Email is ready for Apps Script. Add the deployed web app URL in assets/js/theme-switcher.js.", "error");
      return;
    }

    form.action = EMAIL_SCRIPT_URL;
    form.dataset.emailSending = "true";

    if (submissionInput && !submissionInput.value) {
      submissionInput.value = createSubmissionId();
      formData.set("submissionId", submissionInput.value);
    }

    if (submitButton) {
      submitButton.disabled = true;
    }

    setEmailStatus("Sending your message...", "pending");

    try {
      await fetch(EMAIL_SCRIPT_URL, {
        method: "POST",
        body: formData,
        mode: "no-cors",
      });

      form.reset();
      setEmailStatus("Thanks. Your message was submitted. Please check the receiving inbox.", "success");
    } catch (error) {
      setEmailStatus("The email could not be sent. Please try again in a moment.", "error");
    } finally {
      delete form.dataset.emailSending;

      if (submitButton) {
        submitButton.disabled = false;
      }
    }
  }

  function ensureLegacyNavToggle() {
    document.querySelectorAll(".nav-large .content4").forEach((nav) => {
      if (nav.querySelector("[data-theme-toggle]")) {
        return;
      }

      const bookLink = directChild(nav, "a");
      let actions = directChild(nav, ".nav-actions");

      if (!actions) {
        actions = document.createElement("div");
        actions.className = "nav-actions";

        if (bookLink) {
          nav.insertBefore(actions, bookLink);
          actions.appendChild(bookLink);
        } else {
          nav.appendChild(actions);
        }
      }

      actions.appendChild(createToggle());
    });

    document.querySelectorAll(".nav-small").forEach((nav) => {
      if (nav.querySelector("[data-theme-toggle]")) {
        return;
      }

      const bookLink = directChild(nav, "a");
      let actions = directChild(nav, ".nav-small-actions");
      const toggle = createToggle("theme-toggle--compact");

      if (!actions) {
        actions = document.createElement("div");
        actions.className = "nav-small-actions";

        if (bookLink) {
          nav.insertBefore(actions, bookLink);
          actions.appendChild(bookLink);
        } else {
          nav.appendChild(actions);
        }
      }

      if (actions) {
        actions.appendChild(toggle);
      } else {
        nav.appendChild(toggle);
      }
    });
  }

  function ensureSharedProjectNavToggle() {
    document.querySelectorAll(".nashit-nav-inner").forEach((nav) => {
      if (nav.querySelector("[data-theme-toggle]")) {
        return;
      }

      const bookLink = directChild(nav, ".nashit-book-btn");
      const hamburger = directChild(nav, ".nashit-hamburger");
      let actions = directChild(nav, ".nashit-nav-actions");

      if (!actions) {
        actions = document.createElement("div");
        actions.className = "nashit-nav-actions";

        if (hamburger) {
          nav.insertBefore(actions, hamburger);
        } else {
          nav.appendChild(actions);
        }

        if (bookLink) {
          actions.appendChild(bookLink);
        }
      }

      actions.appendChild(createToggle("nashit-theme-toggle"));
    });
  }

  function ensureWritingNavMenu() {
    document.querySelectorAll(".writing-site-nav-inner").forEach((nav) => {
      const menuButton = directChild(nav, ".writing-menu-btn");
      const links = directChild(nav, ".writing-site-links");

      if (!menuButton || !links || menuButton.dataset.writingMenuReady === "true") {
        return;
      }

      const closeMenu = () => {
        links.classList.remove("open");
        menuButton.setAttribute("aria-expanded", "false");
      };

      menuButton.dataset.writingMenuReady = "true";
      menuButton.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();

        const isOpen = links.classList.toggle("open");
        menuButton.setAttribute("aria-expanded", isOpen ? "true" : "false");
      });

      links.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", closeMenu);
      });

      document.addEventListener("click", (event) => {
        if (!nav.contains(event.target)) {
          closeMenu();
        }
      });

      window.addEventListener("resize", () => {
        if (window.matchMedia("(min-width: 821px)").matches) {
          closeMenu();
        }
      });
    });
  }

  function ensureWritingNavToggle() {
    document.querySelectorAll(".writing-site-nav-inner").forEach((nav) => {
      if (nav.querySelector("[data-theme-toggle]")) {
        return;
      }

      const bookLink = directChild(nav, ".writing-book-btn");
      let actions = directChild(nav, ".writing-nav-actions");

      if (!actions) {
        actions = document.createElement("div");
        actions.className = "writing-nav-actions";

        if (bookLink) {
          nav.insertBefore(actions, bookLink);
          actions.appendChild(bookLink);
        } else {
          nav.appendChild(actions);
        }
      }

      actions.appendChild(createToggle("writing-theme-toggle"));
    });
  }

  function mount() {
    ensureLegacyNavToggle();
    ensureSharedProjectNavToggle();
    ensureWritingNavMenu();
    ensureWritingNavToggle();
    ensureEmailModal();
    ensureEmailTriggers();
    syncButtons();
  }

  scheduleThemeStyles();
  applyTheme(readStoredTheme(), false);

  document.addEventListener("click", (event) => {
    const emailTrigger = event.target.closest("[data-email-trigger]");

    if (emailTrigger) {
      event.preventDefault();
      openEmailModal(emailTrigger);
      return;
    }

    if (event.target.closest("[data-email-close]")) {
      event.preventDefault();
      closeEmailModal();
      return;
    }

    const toggle = event.target.closest("[data-theme-toggle]");

    if (!toggle) {
      return;
    }

    event.preventDefault();
    applyTheme(currentTheme() === "light" ? "dark" : "light", true);
  });

  document.addEventListener("submit", (event) => {
    const form = event.target.closest("[data-email-form]");

    if (!form) {
      return;
    }

    event.preventDefault();
    submitEmailForm(form);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeEmailModal();
    }
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }

  window.NashitTheme = {
    apply: (theme) => applyTheme(theme, true),
    mount,
    toggle: () => applyTheme(currentTheme() === "light" ? "dark" : "light", true),
  };
})();
