(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  const gallery = $("#gallery");
  if (!gallery) return;

  // ---------- Reveal on scroll ----------
  const revealObs = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add("is-in");
          revealObs.unobserve(e.target);
        }
      }
    },
    { threshold: 0.12 }
  );
  $$(".reveal").forEach((el) => revealObs.observe(el));

  // ---------- Blur-up lazy loading ----------
  const imgObs = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const img = e.target;
        const src = img.getAttribute("data-src");
        if (!src) {
          img.classList.add("is-loaded");
          imgObs.unobserve(img);
          continue;
        }
        const preload = new Image();
        preload.onload = () => {
          img.src = src;
          img.classList.add("is-loaded");
          img.removeAttribute("data-src");
          imgObs.unobserve(img);
        };
        preload.src = src;
      }
    },
    { rootMargin: "250px 0px" }
  );
  $$(".g-img").forEach((img) => imgObs.observe(img));

  // ---------- Filters (chips + typing) ----------
  const search = $("#gallerySearch");
  const chips = $$(".chip");
  let activeFilter = "all";
  let query = "";

  function norm(str) {
    return (str || "").toLowerCase().trim();
  }

  function setActiveChip(filter) {
    activeFilter = filter;
    chips.forEach((c) => {
      const on = c.dataset.filter === filter;
      c.classList.toggle("is-active", on);
      c.setAttribute("aria-selected", on ? "true" : "false");
    });
  }

  function matches(card) {
    const tags = norm(card.getAttribute("data-tags"));
    const title = norm($("h3", card)?.textContent);
    const desc = norm($("p", card)?.textContent);

    const okFilter = activeFilter === "all" ? true : tags.includes(activeFilter);
    if (!okFilter) return false;

    if (!query) return true;

    const hay = `${tags} ${title} ${desc}`;
    return hay.includes(query);
  }

  function applyFilter() {
    const cards = $$(".g-card", gallery);

    let visibleCount = 0;
    for (const card of cards) {
      const show = matches(card);
      card.classList.toggle("is-hidden", !show);
      if (show) visibleCount++;
    }

    // Keep lightbox list accurate
    rebuildVisibleList();

    // Message for empty state
    const msg = $("#gLoadMsg");
    if (msg) {
      msg.textContent = visibleCount === 0 ? "No results found. Try a different keyword or filter." : "";
    }
  }

  chips.forEach((c) => {
    c.addEventListener("click", () => {
      setActiveChip(c.dataset.filter || "all");
      applyFilter();
    });
  });

  if (search) {
    let t;
    search.addEventListener("input", () => {
      window.clearTimeout(t);
      t = window.setTimeout(() => {
        query = norm(search.value);
        applyFilter();
      }, 80);
    });
  }

  // ---------- View toggle ----------
  const viewBtns = $$(".view-btn");
  function setView(view) {
    viewBtns.forEach((b) => b.classList.toggle("is-active", b.dataset.view === view));
    gallery.classList.toggle("masonry", view === "masonry");
    gallery.classList.toggle("grid", view === "grid");
  }
  viewBtns.forEach((b) => {
    b.addEventListener("click", () => setView(b.dataset.view || "masonry"));
  });
  setView("masonry");

  // ---------- Stats count-up ----------
  const statNums = $$(".stat-num");
  const statsObs = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const el = e.target;
        statsObs.unobserve(el);

        const target = Number(el.getAttribute("data-count") || "0");
        const start = 0;
        const dur = 900;
        const t0 = performance.now();

        function tick(now) {
          const p = Math.min(1, (now - t0) / dur);
          const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
          const val = Math.round(start + (target - start) * eased);
          el.textContent = String(val);
          if (p < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      }
    },
    { threshold: 0.25 }
  );
  statNums.forEach((n) => statsObs.observe(n));

  // ---------- Lightbox (keyboard + swipe + URL state) ----------
  const lb = $("#lightbox");
  const lbImg = $("#lbImg");
  const lbPrev = $("#lbPrev");
  const lbNext = $("#lbNext");
  const lbCaption = $("#lbCaption");

  let visibleCards = [];
  let activeIndex = -1;
  let lastFocus = null;

  function rebuildVisibleList() {
    visibleCards = $$(".g-card", gallery).filter((c) => !c.classList.contains("is-hidden"));
    // If current active is filtered away, close
    if (lb?.classList.contains("is-open") && (activeIndex < 0 || !visibleCards[activeIndex])) {
      closeLightbox(true);
    }
  }

  function setHashFor(id) {
    if (!id) return;
    history.replaceState(null, "", `#photo-${id}`);
  }

  function clearHash() {
    if (location.hash && location.hash.startsWith("#photo-")) {
      history.replaceState(null, "", location.pathname + location.search);
    }
  }

  function openLightboxByIndex(i, fromHash = false) {
    if (!lb || !lbImg) return;
    rebuildVisibleList();
    if (visibleCards.length === 0) return;

    activeIndex = Math.max(0, Math.min(i, visibleCards.length - 1));

    const card = visibleCards[activeIndex];
    const btn = $(".g-media", card);
    const full = btn?.getAttribute("data-full");
    const title = $("h3", card)?.textContent || "Preview";
    const desc = $("p", card)?.textContent || "";

    if (full) lbImg.src = full;
    lbCaption && (lbCaption.textContent = `${title}${desc ? " — " + desc : ""}`);

    lb.classList.add("is-open");
    lb.setAttribute("aria-hidden", "false");

    if (!fromHash) {
      const id = card.getAttribute("data-id") || String(activeIndex + 1);
      setHashFor(id);
    }

    lastFocus = document.activeElement;
    // Focus close button
    const closeBtn = $('[data-close]', lb) || $(".lb-close", lb);
    closeBtn && closeBtn.focus();
    document.documentElement.style.overflow = "hidden";
  }

  function closeLightbox(skipHashClear = false) {
    if (!lb) return;
    lb.classList.remove("is-open");
    lb.setAttribute("aria-hidden", "true");
    lbImg && (lbImg.src = "");
    lbCaption && (lbCaption.textContent = "");
    activeIndex = -1;
    document.documentElement.style.overflow = "";
    if (!skipHashClear) clearHash();
    if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
  }

  function step(delta) {
    if (!lb?.classList.contains("is-open")) return;
    rebuildVisibleList();
    if (visibleCards.length === 0) return;
    let next = activeIndex + delta;
    if (next < 0) next = visibleCards.length - 1;
    if (next >= visibleCards.length) next = 0;
    openLightboxByIndex(next, true);
  }

  // Click to open
  gallery.addEventListener("click", (e) => {
    const media = e.target.closest(".g-media");
    if (!media) return;
    const card = e.target.closest(".g-card");
    if (!card || card.classList.contains("is-hidden")) return;

    rebuildVisibleList();
    const idx = visibleCards.indexOf(card);
    if (idx >= 0) openLightboxByIndex(idx);
  });

  // Close handlers
  if (lb) {
    lb.addEventListener("click", (e) => {
      const close = e.target.closest("[data-close]");
      if (close) closeLightbox();
    });
  }
  lbPrev && lbPrev.addEventListener("click", () => step(-1));
  lbNext && lbNext.addEventListener("click", () => step(1));

  // Keyboard
  document.addEventListener("keydown", (e) => {
    if (!lb?.classList.contains("is-open")) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") step(-1);
    if (e.key === "ArrowRight") step(1);
  });

  // Swipe (mobile)
  let x0 = null;
  let y0 = null;
  function onTouchStart(ev) {
    const t = ev.touches[0];
    x0 = t.clientX;
    y0 = t.clientY;
  }
  function onTouchMove(ev) {
    if (x0 === null || y0 === null) return;
    const t = ev.touches[0];
    const dx = t.clientX - x0;
    const dy = t.clientY - y0;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
      step(dx > 0 ? -1 : 1);
      x0 = null;
      y0 = null;
    }
  }
  lb && lb.addEventListener("touchstart", onTouchStart, { passive: true });
  lb && lb.addEventListener("touchmove", onTouchMove, { passive: true });

  // Open from URL hash
  function openFromHash() {
    if (!location.hash.startsWith("#photo-")) return;
    const id = location.hash.replace("#photo-", "").trim();
    if (!id) return;

    const allCards = $$(".g-card", gallery);
    const card = allCards.find((c) => (c.getAttribute("data-id") || "") === id);
    if (!card) return;

    // Ensure visible with current filters
    rebuildVisibleList();
    applyFilter(); // ensures hidden state is correct
    rebuildVisibleList();

    const idx = visibleCards.indexOf(card);
    if (idx >= 0) openLightboxByIndex(idx, true);
  }
  window.addEventListener("hashchange", () => {
    if (location.hash.startsWith("#photo-")) openFromHash();
    else closeLightbox(true);
  });

  // ---------- Infinite load (local demo dataset) ----------
  const sentinel = $("#gSentinel");
  const loadBtn = $("#gLoadBtn");
  const loadMsg = $("#gLoadMsg");

  const moreItems = [
    // id, tags, title, desc, pillIconClass, pillText, img
    {
      id: "7",
      tags: "residential deep bathroom tiles",
      title: "Bathroom Detail Reset",
      desc: "Grout, fixtures, mirrors — crisp, hygienic shine.",
      pill: { ic: "fa-solid fa-sparkles", text: "Deep Clean" },
      full: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=2400&auto=format&fit=crop",
      img: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=1200&auto=format&fit=crop"
    },
    {
      id: "8",
      tags: "commercial floors office",
      title: "Commercial Floor Care",
      desc: "High-traffic floors polished and protected.",
      pill: { ic: "fa-solid fa-layer-group", text: "Floor Care" },
      full: "https://images.unsplash.com/photo-1600566752229-250ed79470f5?q=80&w=2400&auto=format&fit=crop",
      img: "https://images.unsplash.com/photo-1600566752229-250ed79470f5?q=80&w=1200&auto=format&fit=crop"
    },
    {
      id: "9",
      tags: "move deep kitchen cabinets",
      title: "Move-In Kitchen Prep",
      desc: "Cabinets, counters and appliances done right.",
      pill: { ic: "fa-solid fa-truck", text: "Move In/Out" },
      full: "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?q=80&w=2400&auto=format&fit=crop",
      img: "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?q=80&w=1200&auto=format&fit=crop"
    },
    {
      id: "10",
      tags: "exterior pressure patio",
      title: "Patio Wash",
      desc: "Outdoor surfaces refreshed with safe pressure cleaning.",
      pill: { ic: "fa-solid fa-water", text: "Exterior" },
      full: "https://images.unsplash.com/photo-1557992260-ec58e38d363c?q=80&w=2400&auto=format&fit=crop",
      img: "https://images.unsplash.com/photo-1557992260-ec58e38d363c?q=80&w=1200&auto=format&fit=crop"
    },
    {
      id: "11",
      tags: "residential sofa upholstery",
      title: "Upholstery Refresh",
      desc: "Fabric-safe cleaning, odors reduced, texture restored.",
      pill: { ic: "fa-solid fa-couch", text: "Upholstery" },
      full: "https://images.unsplash.com/photo-1615873968403-89e068629265?q=80&w=2400&auto=format&fit=crop",
      img: "https://images.unsplash.com/photo-1615873968403-89e068629265?q=80&w=1200&auto=format&fit=crop"
    },
    {
      id: "12",
      tags: "commercial deep desks",
      title: "Desk & Touchpoint Sanitize",
      desc: "High-touch surfaces disinfected with professional care.",
      pill: { ic: "fa-solid fa-building", text: "Commercial" },
      full: "https://images.unsplash.com/photo-1527515637462-daf49a30f0a7?q=80&w=2400&auto=format&fit=crop",
      img: "https://images.unsplash.com/photo-1527515637462-daf49a30f0a7?q=80&w=1200&auto=format&fit=crop"
    }
  ];

  let cursor = 0;
  const batch = 3;

  function cardHTML(item, delayMs) {
    const tiny = item.img.replace("w=1200", "w=80").replace("q=80", "q=40");
    return `
      <article class="g-card reveal is-in" data-id="${item.id}" data-tags="${item.tags}" style="--d:${delayMs}ms;">
        <button class="g-media" data-full="${item.full}" aria-label="Open image">
          <img class="g-img"
               src="${tiny}"
               data-src="${item.img}"
               alt="${item.title}"
               loading="lazy">
          <span class="g-overlay">
            <span class="g-pill"><i class="${item.pill.ic}"></i> ${item.pill.text}</span>
            <span class="g-zoom"><i class="fa-solid fa-up-right-and-down-left-from-center"></i></span>
          </span>
        </button>
        <div class="g-meta">
          <h3>${item.title}</h3>
          <p>${item.desc}</p>
          <div class="g-badges">
            ${item.tags.split(" ").slice(0,2).map(t => `<span>${t[0].toUpperCase()+t.slice(1)}</span>`).join("")}
          </div>
        </div>
      </article>
    `;
  }

  function loadMore() {
    if (cursor >= moreItems.length) {
      if (loadBtn) loadBtn.disabled = true;
      if (loadMsg) loadMsg.textContent = "You’ve reached the end.";
      return;
    }

    const slice = moreItems.slice(cursor, cursor + batch);
    cursor += slice.length;

    const html = slice.map((it, idx) => cardHTML(it, 60 + idx * 60)).join("");
    gallery.insertAdjacentHTML("beforeend", html);

    // Observe new images for blur-up
    const newImgs = $$(".g-img", gallery).filter((img) => img.hasAttribute("data-src"));
    newImgs.forEach((img) => imgObs.observe(img));

    // Rebuild and re-apply filter so new items respect chip + search
    applyFilter();
  }

  if (loadBtn) loadBtn.addEventListener("click", loadMore);

  if (sentinel) {
    const infObs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) loadMore();
      },
      { rootMargin: "350px 0px" }
    );
    infObs.observe(sentinel);
  }

  // ---------- Init ----------
  setActiveChip("all");
  applyFilter();
  rebuildVisibleList();
  openFromHash();
})();