const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function initReveal() {
  const revealNodes = document.querySelectorAll(".reveal");

  if (!revealNodes.length) {
    return;
  }

  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealNodes.forEach((node) => node.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.18,
      rootMargin: "0px 0px -32px 0px"
    }
  );

  revealNodes.forEach((node) => observer.observe(node));
}

function initProgress() {
  const progressValue = document.querySelector(".progress-value");

  if (!progressValue) {
    return;
  }

  const updateProgress = () => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = scrollable > 0 ? window.scrollY / scrollable : 0;
    progressValue.style.transform = `scaleX(${Math.max(0, Math.min(ratio, 1))})`;
  };

  updateProgress();
  window.addEventListener("scroll", updateProgress, { passive: true });
  window.addEventListener("resize", updateProgress);
}

function initTilt() {
  if (reduceMotion) {
    return;
  }

  const tiltNodes = document.querySelectorAll("[data-tilt]");

  tiltNodes.forEach((node) => {
    const maxTilt = 9;

    node.addEventListener("pointermove", (event) => {
      const rect = node.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      const rotateY = (x - 0.5) * maxTilt * 2;
      const rotateX = (0.5 - y) * maxTilt * 2;

      node.style.transform = `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });

    node.addEventListener("pointerleave", () => {
      node.style.transform = "perspective(1200px) rotateX(0deg) rotateY(0deg)";
    });
  });
}

function initAudienceTabs() {
  const buttons = document.querySelectorAll("[data-audience-target]");
  const panels = document.querySelectorAll("[data-audience-panel]");

  if (!buttons.length || !panels.length) {
    return;
  }

  const activateAudience = (target) => {
    buttons.forEach((button) => {
      const active = button.dataset.audienceTarget === target;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-selected", String(active));
    });

    panels.forEach((panel) => {
      const active = panel.dataset.audiencePanel === target;
      panel.classList.toggle("is-active", active);
    });
  };

  buttons.forEach((button) => {
    button.addEventListener("click", () => activateAudience(button.dataset.audienceTarget));
  });

  const defaultTarget =
    document.querySelector("[data-audience-target].is-active")?.dataset.audienceTarget ||
    buttons[0].dataset.audienceTarget;

  activateAudience(defaultTarget);
}

function initPaperTabs() {
  const buttons = document.querySelectorAll("[data-paper-target]");
  const panels = document.querySelectorAll("[data-paper-panel]");

  if (!buttons.length || !panels.length) {
    return;
  }

  const activatePanel = (target, syncHash = true) => {
    let matched = false;

    buttons.forEach((button) => {
      const active = button.dataset.paperTarget === target;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-selected", String(active));
      matched = matched || active;
    });

    panels.forEach((panel) => {
      const active = panel.dataset.paperPanel === target;
      panel.classList.toggle("is-active", active);
      panel.toggleAttribute("hidden", !active);
    });

    if (matched && syncHash) {
      history.replaceState(null, "", `#${target}`);
    }
  };

  buttons.forEach((button) => {
    button.addEventListener("click", () => activatePanel(button.dataset.paperTarget));
  });

  const hashTarget = window.location.hash.replace("#", "");
  const defaultTarget = buttons[0].dataset.paperTarget;
  const startTarget = [...buttons].some((button) => button.dataset.paperTarget === hashTarget)
    ? hashTarget
    : defaultTarget;

  activatePanel(startTarget, Boolean(hashTarget));

  window.addEventListener("hashchange", () => {
    const nextTarget = window.location.hash.replace("#", "");
    if ([...buttons].some((button) => button.dataset.paperTarget === nextTarget)) {
      activatePanel(nextTarget, false);
    }
  });
}

function initDocsPages() {
  const triggers = document.querySelectorAll("[data-doc-page-trigger]");
  const jumpLinks = document.querySelectorAll("[data-doc-page-target]");
  const topicLinks = document.querySelectorAll("[data-doc-section-target]");
  const panels = document.querySelectorAll("[data-doc-page-panel]");
  const navSections = document.querySelectorAll("[data-doc-nav-section]");
  const contentRoot = document.querySelector(".paper-docs-content");

  if (!triggers.length || !panels.length) {
    return;
  }

  const validTargets = [...triggers].map((trigger) => trigger.dataset.docPageTrigger);

  const setActiveTopic = (sectionId, pageTarget) => {
    topicLinks.forEach((link) => {
      const active =
        link.dataset.docPageTarget === pageTarget &&
        (!sectionId ? false : link.dataset.docSectionTarget === sectionId);
      link.classList.toggle("is-active", active);
    });
  };

  const firstTopicForPage = (pageTarget) =>
    [...topicLinks].find((link) => link.dataset.docPageTarget === pageTarget)?.dataset.docSectionTarget || "";

  const scrollToSection = (sectionId) => {
    if (!sectionId) {
      return;
    }

    const section = document.getElementById(sectionId);

    if (!section) {
      return;
    }

    const topbarHeight =
      document.querySelector(".paper-docs-topbar")?.getBoundingClientRect().height || 0;
    const top = section.getBoundingClientRect().top + window.scrollY - topbarHeight - 18;

    window.scrollTo({
      top: Math.max(0, top),
      behavior: reduceMotion ? "auto" : "smooth"
    });
  };

  const activatePage = (target, syncHash = true, shouldScroll = true, sectionId = "") => {
    if (!validTargets.includes(target)) {
      return;
    }

    triggers.forEach((trigger) => {
      const active = trigger.dataset.docPageTrigger === target;
      trigger.classList.toggle("is-active", active);
      trigger.setAttribute("aria-selected", String(active));
    });

    navSections.forEach((section) => {
      const active = section.dataset.docNavSection === target;
      section.classList.toggle("is-active", active);
    });

    panels.forEach((panel) => {
      const active = panel.dataset.docPagePanel === target;
      panel.classList.toggle("is-active", active);
      panel.toggleAttribute("hidden", !active);
    });

    const activeSection = sectionId || firstTopicForPage(target);
    setActiveTopic(activeSection, target);

    if (syncHash) {
      history.replaceState(null, "", `#${sectionId || target}`);
    }

    if (shouldScroll && contentRoot) {
      if (sectionId) {
        scrollToSection(sectionId);
      } else {
        const top = contentRoot.getBoundingClientRect().top + window.scrollY - 12;
        window.scrollTo({
          top: Math.max(0, top),
          behavior: reduceMotion ? "auto" : "smooth"
        });
      }
    }
  };

  triggers.forEach((trigger) => {
    trigger.addEventListener("click", () => activatePage(trigger.dataset.docPageTrigger));
  });

  jumpLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      activatePage(link.dataset.docPageTarget);
    });
  });

  topicLinks.forEach((link) => {
    link.addEventListener("click", () => {
      activatePage(link.dataset.docPageTarget, true, true, link.dataset.docSectionTarget);
    });
  });

  const hashTarget = window.location.hash.replace("#", "");
  const targetSection = hashTarget ? document.getElementById(hashTarget) : null;
  const targetPanel = targetSection?.closest("[data-doc-page-panel]")?.dataset.docPagePanel;

  if (targetPanel) {
    activatePage(targetPanel, false, false, hashTarget);
  } else {
    const startTarget = validTargets.includes(hashTarget) ? hashTarget : validTargets[0];
    activatePage(startTarget, Boolean(hashTarget), false);
  }

  window.addEventListener("hashchange", () => {
    const nextTarget = window.location.hash.replace("#", "");

    if (validTargets.includes(nextTarget)) {
      activatePage(nextTarget, false, false);
      return;
    }

    const nextSection = document.getElementById(nextTarget);
    const nextPanel = nextSection?.closest("[data-doc-page-panel]")?.dataset.docPagePanel;

    if (nextPanel) {
      activatePage(nextPanel, false, false, nextTarget);
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initReveal();
  initProgress();
  initTilt();
  initAudienceTabs();
  initPaperTabs();
  initDocsPages();
});
