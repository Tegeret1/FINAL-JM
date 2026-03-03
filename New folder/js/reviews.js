(function () {
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const $  = (s, r = document) => r.querySelector(s);

  // -----------------------------
  // Reveal on scroll
  // -----------------------------
  const obs = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add("is-in");
          obs.unobserve(e.target);
        }
      }
    },
    { threshold: 0.12 }
  );
  $$(".r-reveal").forEach((el) => obs.observe(el));

  // -----------------------------
  // Flip cards (click/tap + keyboard)
  // -----------------------------
  const cards = $$(".review-card");

  function setFlipped(card, on) {
    card.classList.toggle("is-flipped", !!on);
    const back = card.querySelector(".review-back");
    if (back) back.setAttribute("aria-hidden", on ? "false" : "true");
  }
  function toggle(card) {
    setFlipped(card, !card.classList.contains("is-flipped"));
  }

  cards.forEach((card) => {
    card.addEventListener("click", (e) => {
      // prevent flipping when clicking buttons/links
      if (e.target.closest("a,button")) return;
      toggle(card);
    });

    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggle(card);
      }
      if (e.key === "Escape") {
        setFlipped(card, false);
      }
    });
  });

  // Only one flipped at a time (elite feel)
  document.addEventListener("click", (e) => {
    const clicked = e.target.closest(".review-card");
    cards.forEach((c) => {
      if (c !== clicked) setFlipped(c, false);
    });
  });

  // -----------------------------
  // Floating Top button (bottom-right)
  // -----------------------------
  const topFab = $("#jmTopFab");
  function syncTopFab() {
    if (!topFab) return;
    const show = window.scrollY > 500;
    topFab.classList.toggle("is-show", show);
  }
  syncTopFab();
  window.addEventListener("scroll", syncTopFab, { passive: true });
  if (topFab) topFab.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

  // -----------------------------
  // Modal (Read full)
  // -----------------------------
  const modal = $("#rModal");
  const rmStars = $("#rmStars");
  const rmName = $("#rmName");
  const rmSub = $("#rmSub");
  const rmQuote = $("#rmQuote");
  const rmTags = $("#rmTags");

  function openModal(card) {
    if (!modal || !card) return;

    const name = card.querySelector(".name")?.textContent?.trim() || "Client";
    const sub = card.querySelector(".role")?.textContent?.trim() || "Customer";
    const quote = card.querySelector(".quote")?.textContent?.trim() || "";
    const rating = Number(card.getAttribute("data-rating") || "5");
    const tags = (card.getAttribute("data-tags") || "").split(/\s+/).filter(Boolean);

    if (rmName) rmName.textContent = name;
    if (rmSub) rmSub.textContent = sub;
    if (rmQuote) rmQuote.textContent = quote;
    if (rmStars) rmStars.textContent = "★★★★★".slice(0, Math.max(0, Math.min(5, rating)));

    if (rmTags) {
      rmTags.innerHTML = "";
      tags.slice(0, 10).forEach((t) => {
        const span = document.createElement("span");
        span.textContent = `#${t}`;
        rmTags.appendChild(span);
      });
    }

    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.documentElement.style.overflow = "hidden";

    // focus close button
    const x = modal.querySelector("[data-close]");
    if (x) x.focus();
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.documentElement.style.overflow = "";
  }

  $$(".review-card [data-open]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const card = btn.closest(".review-card");
      openModal(card);
    });
  });

  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target.closest("[data-close]")) closeModal();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && modal.classList.contains("is-open")) closeModal();
    });
  }

  // -----------------------------
  // Filter + search + sort
  // -----------------------------
  const grid = $("#reviewsGrid");
  const chips = $$(".chip");
  const search = $("#reviewSearch");
  const sort = $("#reviewSort");

  let activeFilter = "all";

  function normalize(s) {
    return (s || "").toLowerCase().trim();
  }

  function apply() {
    if (!grid) return;
    const q = normalize(search?.value);
    const items = $$(".review-card", grid);

    // filter + search
    items.forEach((card) => {
      const tags = normalize(card.getAttribute("data-tags"));
      const text = normalize(card.textContent);
      const matchesFilter = activeFilter === "all" ? true : tags.includes(activeFilter);
      const matchesSearch = q ? (tags.includes(q) || text.includes(q)) : true;

      const shouldShow = matchesFilter && matchesSearch && !card.classList.contains("is-hidden");
      card.style.display = shouldShow ? "" : "none";
    });

    // sort
    const mode = sort?.value || "featured";
    const visible = items.filter((c) => c.style.display !== "none");

    const byDateDesc = (a, b) => (normalize(b.getAttribute("data-date"))).localeCompare(normalize(a.getAttribute("data-date")));
    const byRatingDesc = (a, b) => Number(b.getAttribute("data-rating") || "0") - Number(a.getAttribute("data-rating") || "0");

    let sorted = visible.slice();
    if (mode === "newest") sorted.sort(byDateDesc);
    else if (mode === "rating") sorted.sort(byRatingDesc);

    // re-append sorted cards while keeping hidden ones in place
    sorted.forEach((card) => grid.appendChild(card));
  }

  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      chips.forEach((c) => {
        c.classList.remove("is-active");
        c.setAttribute("aria-selected", "false");
      });
      chip.classList.add("is-active");
      chip.setAttribute("aria-selected", "true");
      activeFilter = chip.getAttribute("data-filter") || "all";
      apply();
    });
  });

  if (search) search.addEventListener("input", apply);
  if (sort) sort.addEventListener("change", apply);

  // -----------------------------
  // Load more
  // -----------------------------
  const loadBtn = $("#loadMore");
  if (loadBtn) {
    loadBtn.addEventListener("click", () => {
      const hidden = $$(".review-card.is-hidden", grid);
      hidden.slice(0, 3).forEach((c) => c.classList.remove("is-hidden"));
      apply();

      if ($$(".review-card.is-hidden", grid).length === 0) {
        loadBtn.disabled = true;
        loadBtn.textContent = "All reviews loaded";
      }
    });
  }

  // initial
  apply();
})();