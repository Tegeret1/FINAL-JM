(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  const list = $("#faqList");
  if (!list) return;

  const items = () => $$(".faq-item", list);
  const buttons = () => $$(".faq-q", list);

  const search = $("#faqSearch");
  const clearBtn = $("#faqClear");
  const empty = $("#faqEmpty");
  const resetBtn = $("#resetFaqs");

  const chips = $$(".f-chip");
  const openAll = $("#openAll");
  const closeAll = $("#closeAll");

  const qaChips = $$(".qa-chip");
  const toastHost = $("#fqToast");

  const STORAGE_KEY = "jm_faq_open_ids_v1";
  const FILTER_KEY = "jm_faq_filter_v1";
  const SEARCH_KEY = "jm_faq_search_v1";

  let activeFilter = localStorage.getItem(FILTER_KEY) || "all";

  // ---------- Toast ----------
  function toast(title, msg) {
    if (!toastHost) return;
    const t = document.createElement("div");
    t.className = "t";
    t.innerHTML = `
      <div>
        <strong>${escapeHtml(title)}</strong>
        <div class="jm-muted" style="margin-top:2px;">${escapeHtml(msg)}</div>
      </div>
      <button type="button" aria-label="Close">✕</button>
    `;
    const x = t.querySelector("button");
    x.addEventListener("click", () => t.remove());
    toastHost.appendChild(t);
    setTimeout(() => t.remove(), 3200);
  }

  function escapeHtml(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  // ---------- Smooth open/close height ----------
  function setOpen(item, open) {
    const btn = $(".faq-q", item);
    const panel = $(".faq-a", item);
    if (!btn || !panel) return;

    item.classList.toggle("is-open", open);
    btn.setAttribute("aria-expanded", String(open));

    // height animation
    panel.style.height = open ? panel.scrollHeight + "px" : "0px";

    // after transition, allow content to grow naturally while open
    const onEnd = (e) => {
      if (e.propertyName !== "height") return;
      panel.removeEventListener("transitionend", onEnd);
      if (item.classList.contains("is-open")) {
        panel.style.height = "auto";
      }
    };
    panel.addEventListener("transitionend", onEnd);
  }

  // If open and content changes, recompute height
  function normalizeHeights() {
    items().forEach((item) => {
      const panel = $(".faq-a", item);
      if (!panel) return;
      if (item.classList.contains("is-open")) {
        panel.style.height = "auto";
        const h = panel.scrollHeight;
        panel.style.height = h + "px";
        requestAnimationFrame(() => (panel.style.height = "auto"));
      }
    });
  }

  // ---------- Remember open items (B) ----------
  function saveOpenState() {
    const openIds = items()
      .filter((it) => it.classList.contains("is-open"))
      .map((it) => it.id)
      .filter(Boolean);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(openIds));
  }

  function restoreOpenState() {
    let openIds = [];
    try {
      openIds = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    } catch (_) {}

    // default: first item open if no saved state
    if (!openIds.length) {
      const first = items()[0];
      if (first) setOpen(first, true);
      return;
    }

    items().forEach((it) => setOpen(it, openIds.includes(it.id)));
  }

  // ---------- Filters + Search (A) ----------
  function norm(s) {
    return (s || "").toLowerCase().trim();
  }

  function matchItem(item, q, filter) {
    const tags = norm(item.getAttribute("data-tags"));
    const text = norm(item.textContent);

    const okFilter = filter === "all" ? true : tags.includes(filter);
    const okSearch = q ? (tags.includes(q) || text.includes(q)) : true;

    return okFilter && okSearch;
  }

  function apply() {
    const q = norm(search?.value);
    const filter = activeFilter;

    let visibleCount = 0;

    items().forEach((it) => {
      const show = matchItem(it, q, filter);
      it.style.display = show ? "" : "none";
      if (show) visibleCount++;
    });

    if (empty) empty.hidden = visibleCount !== 0;

    localStorage.setItem(FILTER_KEY, filter);
    localStorage.setItem(SEARCH_KEY, search?.value || "");

    normalizeHeights();
  }

  function setActiveFilter(filter) {
    activeFilter = filter;
    chips.forEach((c) => {
      const on = (c.getAttribute("data-filter") || "all") === filter;
      c.classList.toggle("is-active", on);
      c.setAttribute("aria-selected", String(on));
    });
    apply();
  }

  // ---------- Keyboard nav inside accordion (C) ----------
  function focusAt(i) {
    const btns = buttons().filter((b) => b.closest(".faq-item")?.style.display !== "none");
    const clamped = Math.max(0, Math.min(btns.length - 1, i));
    btns[clamped]?.focus();
  }

  function setupKeyboard(btn) {
    btn.addEventListener("keydown", (e) => {
      const btns = buttons().filter((b) => b.closest(".faq-item")?.style.display !== "none");
      const idx = btns.indexOf(btn);

      if (e.key === "ArrowDown") { e.preventDefault(); focusAt(idx + 1); }
      if (e.key === "ArrowUp")   { e.preventDefault(); focusAt(idx - 1); }
      if (e.key === "Home")      { e.preventDefault(); focusAt(0); }
      if (e.key === "End")       { e.preventDefault(); focusAt(btns.length - 1); }
      if (e.key === "Escape") {
        const item = btn.closest(".faq-item");
        if (item) setOpen(item, false);
        saveOpenState();
      }
    });
  }

  // ---------- Bind accordion click ----------
  buttons().forEach((btn) => {
    setupKeyboard(btn);

    btn.addEventListener("click", () => {
      const item = btn.closest(".faq-item");
      if (!item) return;

      const isOpen = item.classList.contains("is-open");
      setOpen(item, !isOpen);
      saveOpenState();
    });
  });

  // ---------- Helpful votes (D) ----------
  $$(".faq-helpful", list).forEach((wrap) => {
    const yes = wrap.querySelector('[data-vote="yes"]');
    const no  = wrap.querySelector('[data-vote="no"]');

    function pick(btn, other, label) {
      if (!btn || !other) return;
      btn.classList.add("is-picked");
      other.classList.remove("is-picked");
      toast("Thanks!", label);
    }

    yes?.addEventListener("click", () => pick(yes, no, "Glad it helped."));
    no?.addEventListener("click",  () => pick(no, yes, "Noted — we’ll improve this answer."));
  });

  // ---------- Open/Close all (B) ----------
  openAll?.addEventListener("click", () => {
    items().forEach((it) => {
      if (it.style.display !== "none") setOpen(it, true);
    });
    saveOpenState();
    toast("FAQs", "Opened all visible questions.");
  });

  closeAll?.addEventListener("click", () => {
    items().forEach((it) => {
      if (it.style.display !== "none") setOpen(it, false);
    });
    saveOpenState();
    toast("FAQs", "Closed all visible questions.");
  });

  // ---------- Search ----------
  search?.addEventListener("input", apply);

  clearBtn?.addEventListener("click", () => {
    if (search) search.value = "";
    apply();
    search?.focus();
  });

  resetBtn?.addEventListener("click", () => {
    if (search) search.value = "";
    setActiveFilter("all");
    // open first visible
    const first = items().find((it) => it.style.display !== "none");
    if (first) setOpen(first, true);
    saveOpenState();
  });

  // ---------- Filter chips ----------
  chips.forEach((c) => {
    c.addEventListener("click", () => {
      setActiveFilter(c.getAttribute("data-filter") || "all");
    });
  });

  // ---------- Quick answer chips (F) ----------
  qaChips.forEach((c) => {
    c.addEventListener("click", () => {
      const key = c.getAttribute("data-quick") || "all";
      // set filter if exists
      const found = chips.find((x) => (x.getAttribute("data-filter") || "") === key);
      if (found) setActiveFilter(key);
      else setActiveFilter("all");

      // scroll to first matching visible
      const target = items().find((it) => it.style.display !== "none" && norm(it.getAttribute("data-tags")).includes(key));
      if (target) {
        const btn = $(".faq-q", target);
        if (btn) {
          setOpen(target, true);
          saveOpenState();
          btn.scrollIntoView({ behavior: "smooth", block: "center" });
          setTimeout(() => btn.focus(), 350);
        }
      }
    });
  });

  // ---------- Restore saved filter/search/open ----------
  const savedSearch = localStorage.getItem(SEARCH_KEY);
  if (search && savedSearch != null) search.value = savedSearch;

  setActiveFilter(activeFilter);
  restoreOpenState();

  // ensure heights after images/fonts settle
  window.addEventListener("resize", normalizeHeights);
  setTimeout(normalizeHeights, 120);
})();