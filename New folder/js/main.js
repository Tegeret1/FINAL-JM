(function(){
  const root = document.documentElement;

  // ----- Theme (persist) -----
  const themeBtn = document.getElementById("jmTheme");
  const themeIco = document.getElementById("jmThemeIco");

  const MOON = `<svg viewBox="0 0 24 24" fill="none"><path d="M21 13.2A8 8 0 1 1 10.8 3a6.6 6.6 0 0 0 10.2 10.2Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>`;
  const SUN  = `<svg viewBox="0 0 24 24" fill="none"><path d="M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12Z" stroke="currentColor" stroke-width="1.6"/><path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l-1-1M20 20l-1-1M5 19l-1 1M20 4l-1 1" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`;

  function applyTheme(t){
    root.setAttribute("data-theme", t);
    if(themeIco) themeIco.innerHTML = (t === "dark") ? MOON : SUN;
    localStorage.setItem("jm_theme", t);
  }
  applyTheme(localStorage.getItem("jm_theme") || "dark");

  if(themeBtn){
    themeBtn.addEventListener("click", () => {
      const t = root.getAttribute("data-theme") || "dark";
      applyTheme(t === "dark" ? "light" : "dark");
    });
  }

  // ----- Mega menu click support (desktop) -----
  const mega = document.getElementById("jmMega");
  const megaBtn = mega ? mega.querySelector(".jm-mega__btn") : null;
  const megaPanel = mega ? mega.querySelector(".jm-mega__panel") : null;

  if(mega && megaBtn && megaPanel){
    megaBtn.addEventListener("click", (e) => {
      const expanded = megaBtn.getAttribute("aria-expanded") === "true";
      megaBtn.setAttribute("aria-expanded", String(!expanded));
      megaPanel.style.display = expanded ? "none" : "block";
      e.stopPropagation();
    });

    document.addEventListener("click", () => {
      megaBtn.setAttribute("aria-expanded","false");
      megaPanel.style.display = "";
    });
  }

  // ----- Mobile drawer -----
  const burger = document.getElementById("jmBurger");
  const mob = document.getElementById("jmM");
  const ov = document.getElementById("jmMOverlay");
  const close = document.getElementById("jmMClose");

  function setMenu(open){
    if(!burger || !mob) return;
    burger.classList.toggle("is-open", open);
    mob.classList.toggle("is-open", open);
    burger.setAttribute("aria-expanded", String(open));
    mob.setAttribute("aria-hidden", String(!open));
    document.documentElement.style.overflow = open ? "hidden" : "";
  }

  if(burger && mob && ov && close){
    burger.addEventListener("click", () => setMenu(burger.getAttribute("aria-expanded") !== "true"));
    ov.addEventListener("click", () => setMenu(false));
    close.addEventListener("click", () => setMenu(false));
    document.addEventListener("keydown", (e) => { if(e.key === "Escape") setMenu(false); });
    mob.querySelectorAll("a").forEach(a => a.addEventListener("click", () => setMenu(false)));
  }

  // ----- Footer year -----
  const y = document.getElementById("jmYear");
  if(y) y.textContent = String(new Date().getFullYear());

  // ----- Floating TOP button -----
  const topFloat = document.getElementById("jmTopFloat");
  function updateTopVisibility(){
    if(!topFloat) return;
    const show = window.scrollY > 320;
    topFloat.classList.toggle("is-show", show);
  }
  if(topFloat){
    updateTopVisibility();
    window.addEventListener("scroll", updateTopVisibility, { passive: true });
    topFloat.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  }

  // ==========================================================
  // ACTIVE NAV HIGHLIGHT (no header edits)
  // ==========================================================
  function markActiveNav(){
    const path = (location.pathname.split("/").pop() || "index.html").toLowerCase();

    document.querySelectorAll(".jm-n a.jm-n__a").forEach(a => {
      const href = (a.getAttribute("href") || "").split("#")[0].toLowerCase();
      const isActive = href === path || (path === "" && href === "index.html");
      a.classList.toggle("is-active", isActive);
    });

    document.querySelectorAll(".jm-m__nav a").forEach(a => {
      const href = (a.getAttribute("href") || "").split("#")[0].toLowerCase();
      const isActive = href === path || (path === "" && href === "index.html");
      a.classList.toggle("is-active", isActive);
    });
  }
  markActiveNav();

  // ==========================================================
  // Reveal on scroll
  // ==========================================================
  const prefersReduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function enableReveal(){
    const items = Array.from(document.querySelectorAll(".jm-reveal"));
    if(!items.length) return;

    if(!("IntersectionObserver" in window)){
      items.forEach(el => el.classList.add("is-in"));
      return;
    }

    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if(!e.isIntersecting) return;
        const el = e.target;
        const d = parseInt(el.getAttribute("data-delay") || "0", 10);
        window.setTimeout(() => el.classList.add("is-in"), Math.max(0, d));
        io.unobserve(el);
      });
    }, { threshold: 0.12 });

    items.forEach(el => io.observe(el));
  }

  if(prefersReduced){
    document.querySelectorAll(".jm-reveal").forEach(el => el.classList.add("is-in"));
  }else{
    enableReveal();
  }

  // ==========================================================
  // Count animation (services)
  // ==========================================================
  function animateCount(el){
    const target = parseInt(el.getAttribute("data-count") || "0", 10);
    const suffix = el.getAttribute("data-suffix") || "";
    const duration = 850;
    const start = performance.now();

    function step(t){
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      const val = Math.round(eased * target);
      el.textContent = String(val) + suffix;
      if(p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  const counterEls = Array.from(document.querySelectorAll("[data-count]"));
  if(counterEls.length && !prefersReduced && "IntersectionObserver" in window){
    const seen = new WeakSet();
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if(!e.isIntersecting) return;
        const el = e.target;
        if(seen.has(el)) return;
        seen.add(el);
        animateCount(el);
      });
    }, { threshold: 0.35 });
    counterEls.forEach(el => io.observe(el));
  }else{
    counterEls.forEach(el => {
      const target = el.getAttribute("data-count") || "0";
      const suffix = el.getAttribute("data-suffix") || "";
      el.textContent = String(target) + suffix;
    });
  }

  // ==========================================================
  // SERVICES filtering
  // ==========================================================
  const chips = Array.from(document.querySelectorAll(".jm-sv-chip"));
  const cards = Array.from(document.querySelectorAll(".jm-sv-card"));

  function setFilter(key){
    chips.forEach(c => c.classList.toggle("is-on", c.getAttribute("data-filter") === key));
    cards.forEach(card => {
      const t = card.getAttribute("data-svc") || "all";
      const show = (key === "all") || (t === key);
      card.classList.toggle("is-hide", !show);
    });

    if(key === "all"){
      history.replaceState({}, "", window.location.pathname);
    }else{
      history.replaceState({}, "", `${window.location.pathname}#${key}`);
    }
  }

  if(chips.length && cards.length){
    chips.forEach(btn => {
      btn.addEventListener("click", () => setFilter(btn.getAttribute("data-filter") || "all"));
    });

    const hash = (location.hash || "").replace("#","").trim();
    if(hash && chips.some(c => c.getAttribute("data-filter") === hash)){
      setFilter(hash);
    }
  }

  // ==========================================================
  // SERVICE MODALS (if present)
  // ==========================================================
  const SERVICE_DATA = {
    commercial: {
      title: "Commercial Cleaning",
      subtitle: "Offices, shops, and commercial premises — checklist-driven consistency.",
      image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=1800&auto=format&fit=crop",
      bullets: [
        "Daily / weekly schedules available",
        "Restrooms, floors, desks, high-touch areas",
        "After-hours slots to avoid disruptions",
        "Supervisor quality checks on request"
      ],
      meta: [["Best for","Offices • Shops • Facilities"],["Turnaround","Fast + consistent"],["Options","Eco products available"]]
    },
    residential: {
      title: "Residential Cleaning",
      subtitle: "Flexible home cleaning — tailored to your routine and priorities.",
      image: "https://images.unsplash.com/photo-1603712725038-e9334ae8f39f?q=80&w=1800&auto=format&fit=crop",
      bullets: [
        "Weekly / bi-weekly / one-time",
        "Kitchen + bathroom deep refresh",
        "Bedrooms, living rooms, dusting",
        "Add-ons: inside fridge, oven, windows"
      ],
      meta: [["Best for","Houses • Apartments"],["Style","Detail-first finish"],["Options","Add-ons supported"]]
    },
    specialized: {
      title: "Specialized Cleaning",
      subtitle: "Deep-detail work for tough areas and special requests.",
      image: "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?q=80&w=1800&auto=format&fit=crop",
      bullets: [
        "Deep cleaning reset (baseboards, grout, edges)",
        "High-touch sanitation focus",
        "Targeted upholstery & stain handling",
        "Great for pre/post events"
      ],
      meta: [["Best for","Deep resets • High-traffic areas"],["Depth","High precision"],["Options","Custom requests welcome"]]
    },
    exterior: {
      title: "Exterior Cleaning",
      subtitle: "Refresh outdoor spaces and entryways for a clean first impression.",
      image: "https://images.unsplash.com/photo-1527515862127-a4fc05baf7a5?q=80&w=1800&auto=format&fit=crop",
      bullets: [
        "Entryways and outdoor surface refresh",
        "Move-in / move-out support",
        "Dust + debris removal",
        "Perfect for property preparation"
      ],
      meta: [["Best for","Entryways • Outdoor surfaces"],["Goal","Fresh + welcoming"],["Options","Property prep packages"]]
    }
  };

  function getFocusable(container){
    return Array.from(container.querySelectorAll(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
    )).filter(el => !el.hasAttribute("disabled") && !el.getAttribute("aria-hidden"));
  }

  function ensureModal(){
    let modal = document.getElementById("jmModal");
    if(modal) return modal;

    modal = document.createElement("div");
    modal.className = "jm-modal";
    modal.id = "jmModal";
    modal.innerHTML = `
      <div class="jm-modal__ov" data-close="1"></div>
      <aside class="jm-modal__p" role="dialog" aria-modal="true" aria-label="Service details">
        <div class="jm-modal__top">
          <div>
            <h3 class="jm-modal__ttl" id="jmModalTitle">Service</h3>
            <p class="jm-modal__sub" id="jmModalSub">Details</p>
          </div>
          <button class="jm-modal__x" type="button" aria-label="Close modal" data-close="1">✕</button>
        </div>
        <div class="jm-modal__body">
          <div class="jm-modal__media"><img id="jmModalImg" alt="" loading="lazy" /></div>
          <div class="jm-modal__pane">
            <ul class="jm-modal__list" id="jmModalList"></ul>
            <div class="jm-modal__meta" id="jmModalMeta"></div>
          </div>
        </div>
        <div class="jm-modal__btm">
          <a class="jm-btn jm-btn--ghost jm-btn--soft" href="contact.html">Ask a question</a>
          <a class="jm-btn jm-btn--cta jm-btn--glow" href="booking.html">Book this service</a>
        </div>
      </aside>
    `;
    document.body.appendChild(modal);
    return modal;
  }

  let lastFocus = null;

  function openModal(key){
    const data = SERVICE_DATA[key];
    if(!data) return;

    const modal = ensureModal();
    const panel = modal.querySelector(".jm-modal__p");
    modal.querySelector("#jmModalTitle").textContent = data.title;
    modal.querySelector("#jmModalSub").textContent = data.subtitle;

    const img = modal.querySelector("#jmModalImg");
    img.src = data.image;
    img.alt = data.title;

    modal.querySelector("#jmModalList").innerHTML = data.bullets.map(t => `<li>${t}</li>`).join("");
    modal.querySelector("#jmModalMeta").innerHTML = data.meta.map(([k,v]) => (
      `<div class="jm-modal__pill"><span>${k}</span><span>${v}</span></div>`
    )).join("");

    lastFocus = document.activeElement;
    modal.classList.add("is-open");
    document.documentElement.style.overflow = "hidden";

    const focusables = getFocusable(panel);
    (focusables[0] || panel).focus?.();

    function onKey(e){
      if(e.key === "Escape"){ closeModal(); return; }
      if(e.key !== "Tab") return;

      const f = getFocusable(panel);
      if(!f.length) return;
      const first = f[0];
      const last = f[f.length - 1];

      if(e.shiftKey && document.activeElement === first){
        e.preventDefault(); last.focus();
      }else if(!e.shiftKey && document.activeElement === last){
        e.preventDefault(); first.focus();
      }
    }

    function onClick(e){
      const t = e.target;
      if(t && t.getAttribute && t.getAttribute("data-close") === "1") closeModal();
    }

    modal._jm_onKey = onKey;
    modal._jm_onClick = onClick;
    document.addEventListener("keydown", onKey);
    modal.addEventListener("click", onClick);
  }

  function closeModal(){
    const modal = document.getElementById("jmModal");
    if(!modal) return;

    modal.classList.remove("is-open");
    document.documentElement.style.overflow = "";

    if(modal._jm_onKey) document.removeEventListener("keydown", modal._jm_onKey);
    if(modal._jm_onClick) modal.removeEventListener("click", modal._jm_onClick);

    if(lastFocus && lastFocus.focus) lastFocus.focus();
    lastFocus = null;
  }

  document.querySelectorAll("[data-svc-modal]").forEach(btn => {
    btn.addEventListener("click", () => openModal(btn.getAttribute("data-svc-modal")));
  });

  // ==========================================================
  // BOOKING (Ultra Elite)
  // ==========================================================
  const bookingForm = document.getElementById("bookingForm");
  if(bookingForm){
    const stepBtns = Array.from(document.querySelectorAll(".jm-bk-step"));
    const stepViews = Array.from(document.querySelectorAll(".jm-bk-stepview"));
    const stepLabel = document.getElementById("bkStepLabel");
    const toast = document.getElementById("bkToast");
    const reviewBox = document.getElementById("bkReviewBox");
    const summary = document.getElementById("bkSummary");

    const el = (id) => document.getElementById(id);

    const fields = {
      service: el("service"),
      bedrooms: el("bedrooms"),
      bathrooms: el("bathrooms"),
      extras: el("extras"),
      frequency: el("frequency"),
      sqft: el("sqft"),
      date: el("date"),
      time: el("time"),
      fullName: el("fullName"),
      email: el("email"),
      phone: el("phone"),
      address: el("address"),
      notes: el("notes"),
      consent: el("consent"),
    };

    // set min date (today)
    try{
      const d = new Date();
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth()+1).padStart(2,"0");
      const dd = String(d.getDate()).padStart(2,"0");
      if(fields.date) fields.date.min = `${yyyy}-${mm}-${dd}`;
    }catch(_){}

    // auto-select service from URL
    const params = new URLSearchParams(location.search);
    const qs = (params.get("service") || "").toLowerCase().trim();
    const map = {
      commercial: "Commercial Cleaning",
      residential: "Residential Cleaning",
      specialized: "Deep Cleaning",
      deep: "Deep Cleaning",
      move: "Move In / Move Out",
      "move-in": "Move In / Move Out",
      post: "Post-Construction",
      "post-construction": "Post-Construction",
      exterior: "Exterior Cleaning",
      window: "Exterior Cleaning",
    };
    if(qs && fields.service && map[qs]){
      fields.service.value = map[qs];
    }

    let step = 1;

    function setErr(id, msg){
      const out = bookingForm.querySelector(`[data-err-for="${id}"]`);
      if(out) out.textContent = msg || "";
      const node = fields[id];
      if(node){
        const wrap = node.closest(".jm-bk-field");
        if(wrap) wrap.classList.toggle("is-bad", !!msg);
      }
    }

    function isEmail(v){
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || "").trim());
    }

    function validateStep(n){
      let ok = true;

      // clear relevant errors
      const clear = (ids)=>ids.forEach(id=>setErr(id,""));
      if(n === 1) clear(["service","bedrooms","bathrooms","date","time"]);
      if(n === 2) clear(["fullName","email","phone","address"]);
      if(n === 3) clear(["consent"]);

      if(n === 1){
        if(!fields.service.value){ setErr("service","Please select a service."); ok = false; }
        if(!fields.bedrooms.value){ setErr("bedrooms","Required."); ok = false; }
        if(!fields.bathrooms.value){ setErr("bathrooms","Required."); ok = false; }
        if(!fields.date.value){ setErr("date","Pick a date."); ok = false; }
        if(!fields.time.value){ setErr("time","Pick a time."); ok = false; }
      }

      if(n === 2){
        const name = (fields.fullName.value || "").trim();
        const email = (fields.email.value || "").trim();
        const phone = (fields.phone.value || "").trim();
        const address = (fields.address.value || "").trim();

        if(name.length < 2){ setErr("fullName","Enter your name."); ok = false; }
        if(!isEmail(email)){ setErr("email","Enter a valid email."); ok = false; }
        if(phone.length < 7){ setErr("phone","Enter a valid phone."); ok = false; }
        if(address.length < 4){ setErr("address","Enter your address."); ok = false; }
      }

      if(n === 3){
        if(!fields.consent.checked){
          setErr("consent","Please confirm consent to proceed.");
          ok = false;
        }
      }

      if(!ok){
        // focus first bad field
        const bad = bookingForm.querySelector(".jm-bk-field.is-bad input, .jm-bk-field.is-bad select, .jm-bk-field.is-bad textarea");
        bad && bad.focus && bad.focus();
      }
      return ok;
    }

    function formatSummary(){
      const v = (x) => (x && String(x).trim()) ? String(x).trim() : "—";
      const when = (fields.date.value && fields.time.value) ? `${fields.date.value} • ${fields.time.value}` : "—";
      const br = v(fields.bedrooms.value);
      const ba = v(fields.bathrooms.value);

      return [
        ["Service", v(fields.service.value)],
        ["Bedrooms", br],
        ["Bathrooms", ba],
        ["Extras", v(fields.extras.value)],
        ["Frequency", v(fields.frequency.value)],
        ["Sqft", v(fields.sqft.value)],
        ["When", when],
        ["Name", v(fields.fullName.value)],
        ["Email", v(fields.email.value)],
        ["Phone", v(fields.phone.value)],
        ["Address", v(fields.address.value)],
      ];
    }

    function renderSummary(){
      if(!summary) return;
      const rows = formatSummary();
      summary.innerHTML = rows.map(([k,v]) => `<div class="jm-bk-srow"><span>${k}</span><span>${v}</span></div>`).join("");
    }

    function renderReview(){
      if(!reviewBox) return;
      const rows = formatSummary();
      const notes = (fields.notes.value || "").trim();
      reviewBox.innerHTML = `
        <div style="font-weight:1100;margin-bottom:6px;">Booking summary</div>
        ${rows.map(([k,v]) => `<div style="display:flex;justify-content:space-between;gap:10px;"><span style="color:var(--muted);font-weight:950;">${k}</span><span style="font-weight:900;">${v}</span></div>`).join("")}
        <div style="margin-top:10px;">
          <div style="color:var(--muted);font-weight:950;">Notes</div>
          <div style="font-weight:900;">${notes ? notes.replace(/</g,"&lt;") : "—"}</div>
        </div>
      `;
    }

    function setStep(n){
      step = n;

      stepBtns.forEach(b => {
        const s = parseInt(b.getAttribute("data-step") || "0", 10);
        const on = s === n;
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-selected", on ? "true" : "false");
      });

      stepViews.forEach(v => {
        const s = parseInt(v.getAttribute("data-view") || "0", 10);
        v.classList.toggle("is-show", s === n);
      });

      if(stepLabel){
        stepLabel.textContent =
          n === 1 ? "Step 1 of 3 • Booking details" :
          n === 2 ? "Step 2 of 3 • Contact details" :
                   "Step 3 of 3 • Review & confirm";
      }

      renderSummary();
      if(n === 3) renderReview();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    // step buttons allow backward navigation only (elite UX)
    stepBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        const n = parseInt(btn.getAttribute("data-step") || "1", 10);
        if(n < step) setStep(n);
      });
    });

    // next/prev
    bookingForm.addEventListener("click", (e) => {
      const t = e.target;
      const next = t && t.closest && t.closest("[data-next]");
      const prev = t && t.closest && t.closest("[data-prev]");
      if(next){
        if(validateStep(step)) setStep(Math.min(3, step + 1));
      }
      if(prev){
        setStep(Math.max(1, step - 1));
      }
    });

    // live updates
    ["input","change"].forEach(evt => {
      bookingForm.addEventListener(evt, () => {
        renderSummary();
        if(step === 3) renderReview();
      });
    });

    // submit
    bookingForm.addEventListener("submit", (e) => {
      e.preventDefault();
      toast && (toast.textContent = "");

      const ok1 = validateStep(1);
      const ok2 = validateStep(2);
      const ok3 = validateStep(3);

      if(!(ok1 && ok2 && ok3)){
        setStep(!ok1 ? 1 : !ok2 ? 2 : 3);
        return;
      }

      // Demo success (plug backend later)
      if(toast){
        toast.textContent = "Booking request received. We’ll reach out shortly to confirm.";
      }

      // Optional: keep data in session for later integration
      try{
        const payload = {
          service: fields.service.value,
          bedrooms: fields.bedrooms.value,
          bathrooms: fields.bathrooms.value,
          extras: fields.extras.value,
          frequency: fields.frequency.value,
          sqft: fields.sqft.value,
          date: fields.date.value,
          time: fields.time.value,
          fullName: fields.fullName.value,
          email: fields.email.value,
          phone: fields.phone.value,
          address: fields.address.value,
          notes: fields.notes.value,
        };
        sessionStorage.setItem("jm_booking_draft", JSON.stringify(payload));
      }catch(_){}
    });

    // init
    setStep(1);
    renderSummary();
  }

})();