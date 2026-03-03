(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  // ---------- Reveal ----------
  const reveals = $$(".reveal");
  if (reveals.length && "IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("is-in"));
  }

  // ---------- Pricing state ----------
  const state = {
    mode: "one", // one | recurring
    discount: 0.10, // recurring discount applies to base only
    plan: { name: "Residential", base: 120 },
    addons: new Map(), // name -> price
  };

  const tabs = $$(".p-tab");
  const planCards = $$(".p-card");
  const chooseBtns = $$("[data-choose]");
  const addons = $$(".p-add");
  const selPlan = $("#selPlan");
  const selMode = $("#selMode");
  const selBase = $("#selBase");
  const selTotal = $("#selTotal");
  const selAddons = $("#selAddons");

  function money(n) {
    const x = Math.round((Number(n) || 0) * 100) / 100;
    return String(x.toFixed(0)); // integer-looking pricing; switch to toFixed(2) if you want cents
  }

  function setMode(mode) {
    state.mode = mode;

    tabs.forEach((t) => {
      const active = t.dataset.mode === mode;
      t.classList.toggle("is-active", active);
      t.setAttribute("aria-selected", active ? "true" : "false");
    });

    selMode.textContent = mode === "recurring" ? "Recurring" : "One-time";

    // Update visible plan prices (base only)
    planCards.forEach((card) => {
      const base = Number(card.dataset.base || 0);
      const amtEl = card.querySelector("[data-amount]");
      if (!amtEl) return;

      const priced = mode === "recurring" ? base * (1 - state.discount) : base;
      amtEl.textContent = money(priced);
    });

    render();
  }

  function setPlanFromCard(card) {
    if (!card) return;
    const name = card.dataset.plan || "Residential";
    const base = Number(card.dataset.base || 0);

    state.plan = { name, base };

    // highlight selected card
    planCards.forEach((c) => c.classList.remove("is-selected"));
    card.classList.add("is-selected");

    // update summary labels
    selPlan.textContent = name;
    selBase.textContent = money(modeBase());

    render();
  }

  function modeBase() {
    const b = state.plan.base;
    return state.mode === "recurring" ? b * (1 - state.discount) : b;
  }

  function addonsSum() {
    let s = 0;
    state.addons.forEach((p) => (s += Number(p) || 0));
    return s;
  }

  function renderAddons() {
    selAddons.innerHTML = "";

    if (state.addons.size === 0) {
      const empty = document.createElement("div");
      empty.className = "p-empty jm-muted";
      empty.textContent = "No add-ons selected.";
      selAddons.appendChild(empty);
      return;
    }

    state.addons.forEach((price, name) => {
      const row = document.createElement("div");
      row.className = "p-line";
      row.innerHTML = `<span>${name}</span><strong>+$${money(price)}</strong>`;
      selAddons.appendChild(row);
    });
  }

  function render() {
    const total = modeBase() + addonsSum();
    selTotal.textContent = money(total);
    selBase.textContent = money(modeBase());
    renderAddons();
  }

  // ---------- Bind mode toggle ----------
  tabs.forEach((t) => {
    t.addEventListener("click", () => setMode(t.dataset.mode || "one"));
  });

  // ---------- Bind plan selection ----------
  chooseBtns.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const card = e.target.closest(".p-card");
      setPlanFromCard(card);
    });
  });

  // Click anywhere on card selects too
  planCards.forEach((card) => {
    card.addEventListener("click", (e) => {
      // avoid stealing clicks on links
      if (e.target.closest("a")) return;
      setPlanFromCard(card);
    });
  });

  // ---------- Bind add-ons ----------
  addons.forEach((label) => {
    const input = label.querySelector('input[type="checkbox"]');
    const name = label.dataset.addon || "Addon";
    const price = Number(label.dataset.price || 0);

    if (!input) return;

    input.addEventListener("change", () => {
      if (input.checked) state.addons.set(name, price);
      else state.addons.delete(name);
      render();
    });
  });

  // ---------- Init ----------
  // default plan: first card
  setMode("one");
  setPlanFromCard(planCards[0]);
  render();
})();