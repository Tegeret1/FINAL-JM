(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  // ---------- Toast ----------
  const toastHost = $("#cToast");
  function escapeHtml(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
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
    t.querySelector("button")?.addEventListener("click", () => t.remove());
    toastHost.appendChild(t);
    setTimeout(() => t.remove(), 3200);
  }

  // ---------- Reveal on scroll ----------
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

  // ---------- Copy helpers ----------
  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      toast("Copied", text);
      return true;
    } catch (_) {
      // fallback
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        toast("Copied", text);
        return true;
      } catch (e) {
        toast("Copy failed", "Your browser blocked clipboard access.");
        return false;
      } finally {
        ta.remove();
      }
    }
  }

  // Any element with data-copy
  $$("[data-copy]").forEach((btn) => {
    btn.addEventListener("click", () => copyText(btn.getAttribute("data-copy") || ""));
  });

  // ---------- Open now? logic (simple local time check) ----------
  const checkOpenBtn = $("#checkOpenBtn");

  function isOpenNow() {
    // Nairobi time assumption: user can adjust later
    // Mon-Fri 08:30-20:00, Sat 10:00-20:00, Sun 10:00-16:00
    const now = new Date();
    const day = now.getDay(); // 0 Sun .. 6 Sat
    const minutes = now.getHours() * 60 + now.getMinutes();

    const inRange = (a, b) => minutes >= a && minutes <= b;

    if (day >= 1 && day <= 5) return inRange(8 * 60 + 30, 20 * 60);
    if (day === 6) return inRange(10 * 60, 20 * 60);
    return inRange(10 * 60, 16 * 60);
  }

  checkOpenBtn?.addEventListener("click", () => {
    toast("Status", isOpenNow() ? "We’re open right now." : "We’re closed right now.");
  });

  // ---------- WhatsApp prefill from form ----------
  const waBtn = $("#whatsAppPrefill");
  const form = $("#contactForm");

  function getField(name) {
    return form?.querySelector(`[name="${name}"]`)?.value?.trim() || "";
  }

  function buildMessage() {
    const name = getField("name");
    const email = getField("email");
    const phone = getField("phone");
    const subject = getField("subject");
    const message = getField("message");

    return [
      "Hello JMROWLAND,",
      "",
      `Name: ${name || "-"}`,
      `Email: ${email || "-"}`,
      `Phone: ${phone || "-"}`,
      `Subject: ${subject || "-"}`,
      "",
      message || "(No message)",
    ].join("\n");
  }

  waBtn?.addEventListener("click", () => {
    const txt = encodeURIComponent(buildMessage());
    // Use your number (replace if needed)
    window.open(`https://wa.me/12125550123?text=${txt}`, "_blank", "noopener");
  });

  // ---------- Email client submit (mailto) ----------
  form?.addEventListener("submit", (e) => {
    e.preventDefault();

    const consent = $("#consent");
    if (consent && !consent.checked) {
      toast("Consent required", "Please tick the consent checkbox to continue.");
      return;
    }

    const name = getField("name");
    const email = getField("email");
    const phone = getField("phone");
    const subject = getField("subject");
    const message = getField("message");

    const to = "info@jmrowland.com";
    const subj = encodeURIComponent(`JMROWLAND Contact: ${subject}`);
    const body = encodeURIComponent(
      `Name: ${name}\nEmail: ${email}\nPhone: ${phone}\n\nMessage:\n${message}`
    );

    // mailto open
    window.location.href = `mailto:${to}?subject=${subj}&body=${body}`;
    toast("Opening email…", "If nothing happens, allow popups or use WhatsApp instead.");
  });
})();