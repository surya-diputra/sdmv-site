/* ClipThat Studio site. No dependencies, no cookies, no trackers. */

/* Store links: the lead fills these in. An empty URL shows the button as "Coming soon". */
const STORES = {
  appStore: "",   // App Store (iPhone and iPad)
  googlePlay: "", // Google Play (Android)
  mac: "",        // Mac download
  testflight: "", // TestFlight public link (optional; hidden when empty)
  playTest: "",   // Google Play testing opt-in link (optional; hidden when empty)
};

(function () {
  "use strict";

  const doc = document.documentElement;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  let reduce = reduced.matches;
  if (reduce) doc.classList.add("reduced");

  /* ---------- Store buttons ---------- */
  const soonLabel = doc.dataset.soon || "Coming soon";
  document.querySelectorAll("[data-store]").forEach((el) => {
    const url = (STORES[el.dataset.store] || "").trim();
    if (el.closest(".beta")) {
      if (url) {
        el.href = url;
        el.hidden = false;
        el.closest(".beta").hidden = false;
      }
      return;
    }
    if (url) {
      el.href = url;
      el.classList.remove("is-soon");
      el.removeAttribute("aria-disabled");
      if (/^https?:/.test(url) && !url.includes("sdmv.my.id")) el.rel = "noopener";
    } else {
      el.classList.add("is-soon");
      el.setAttribute("aria-disabled", "true");
      el.removeAttribute("href");
      const name = el.querySelector(".two > span:last-child");
      el.setAttribute("aria-label", soonLabel + ": " + (name ? name.textContent : ""));
    }
  });

  /* ---------- Nav state ---------- */
  const nav = document.querySelector(".nav");
  const onScrollNav = () => nav.classList.toggle("is-stuck", window.scrollY > 8);
  onScrollNav();

  /* ---------- Split headings into words ---------- */
  document.querySelectorAll(".split").forEach((el) => {
    let i = 0;
    const walk = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const parts = n.textContent.split(/(\s+)/);
          const frag = document.createDocumentFragment();
          parts.forEach((p) => {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(p)); return; }
            const s = document.createElement("span");
            s.className = "wd";
            s.style.setProperty("--i", i++);
            s.textContent = p;
            frag.appendChild(s);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && !n.classList.contains("wd")) {
          if (n.classList.contains("serif") || n.classList.contains("silver")) {
            // keep accent spans whole so the gradient and italics stay intact
            n.classList.add("wd");
            n.style.setProperty("--i", i++);
          } else {
            walk(n);
          }
        }
      });
    };
    walk(el);
  });

  /* ---------- Reveal on scroll ---------- */
  const revealEls = document.querySelectorAll(".reveal, .reveal-scale, .split, .tile");
  if ("IntersectionObserver" in window && !reduce) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("in"));
  }

  /* ---------- Hero video ---------- */
  const hero = document.getElementById("hero-video");
  const toggle = document.querySelector(".media-toggle");
  const setToggle = (playing) => {
    if (!toggle) return;
    toggle.setAttribute("aria-pressed", playing ? "true" : "false");
    toggle.setAttribute("aria-label", playing ? toggle.dataset.labelPause : toggle.dataset.labelPlay);
  };
  if (hero) {
    hero.addEventListener("play", () => setToggle(true));
    hero.addEventListener("pause", () => setToggle(false));
    if (!reduce) {
      hero.preload = "auto";
      const p = hero.play();
      if (p && p.catch) p.catch(() => setToggle(false));
    } else {
      setToggle(false);
    }
    toggle && toggle.addEventListener("click", () => {
      if (hero.paused) hero.play().catch(() => {}); else hero.pause();
    });
    // pause when off screen to save battery
    if ("IntersectionObserver" in window) {
      let userPaused = false;
      toggle && toggle.addEventListener("click", () => { userPaused = hero.paused; });
      new IntersectionObserver(([e]) => {
        if (!e.isIntersecting) { if (!hero.paused) hero.pause(); }
        else if (!userPaused && !reduce && hero.paused) hero.play().catch(() => {});
      }, { threshold: 0.1 }).observe(hero);
    }
  }

  /* ---------- Parallax (transform only) ---------- */
  const parallax = [...document.querySelectorAll("[data-parallax]")];
  const tilt = document.querySelector("[data-tilt]");
  let ticking = false;
  const frame = () => {
    ticking = false;
    onScrollNav();
    if (reduce) return;
    const vh = window.innerHeight;
    if (window.scrollY < vh * 1.4) {
      parallax.forEach((el) => {
        const k = parseFloat(el.dataset.parallax) || 0;
        el.style.transform = "translate3d(0," + (window.scrollY * -k).toFixed(1) + "px,0)";
      });
    }
    if (tilt) {
      const r = tilt.getBoundingClientRect();
      if (r.bottom > 0 && r.top < vh) {
        const t = Math.min(1, Math.max(0, (vh - r.top) / (vh * 0.9)));
        const deg = (1 - t) * 16;
        tilt.style.transform = "rotateX(" + deg.toFixed(2) + "deg) scale(" + (0.94 + t * 0.06).toFixed(3) + ")";
      }
    }
  };
  window.addEventListener("scroll", () => {
    if (!ticking) { ticking = true; requestAnimationFrame(frame); }
  }, { passive: true });
  frame();

  /* ---------- Sticky story: the phone's screen follows the beat ---------- */
  const stage = document.querySelector(".story-stage");
  if (stage && "IntersectionObserver" in window) {
    const shots = stage.querySelectorAll(".screen img");
    const rail = stage.querySelectorAll(".story-rail li");
    const show = (beat) => {
      const n = +beat.dataset.screen;
      shots.forEach((img, i) => img.classList.toggle("is-on", i === n));
      rail.forEach((li) => li.classList.toggle("is-on", li.dataset.step === beat.dataset.step));
    };
    // warm the stage images once the story is near
    new IntersectionObserver(([e], o) => {
      if (e.isIntersecting) { shots.forEach((img) => { img.loading = "eager"; }); o.disconnect(); }
    }, { rootMargin: "600px 0px" }).observe(stage);
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) show(e.target); });
    }, { rootMargin: "-45% 0px -45% 0px" });
    document.querySelectorAll(".beat").forEach((b) => io.observe(b));
  }

  /* ---------- Captions demo: word by word ---------- */
  const line = document.getElementById("cap-line");
  if (line) {
    const words = (line.dataset.words || "").split(/\s+/).filter(Boolean);
    line.innerHTML = "";
    const spans = words.map((w) => {
      const s = document.createElement("span");
      s.className = "w";
      s.textContent = w;
      line.appendChild(s);
      return s;
    });
    let idx = -1, timer = null, visible = false;
    const step = () => {
      idx++;
      if (idx >= spans.length + 4) {
        spans.forEach((s) => s.classList.remove("on", "now"));
        idx = -1;
        timer = setTimeout(step, 450);
        return;
      }
      spans.forEach((s, i) => {
        s.classList.toggle("on", i <= idx);
        s.classList.toggle("now", i === idx);
      });
      timer = setTimeout(step, idx < spans.length ? 380 : 520);
    };
    const showAll = () => spans.forEach((s, i) => { s.classList.add("on"); s.classList.toggle("now", i === 1); });
    const start = () => { if (!timer && !reduce) step(); };
    const stop = () => { clearTimeout(timer); timer = null; };
    if (reduce) showAll();
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(([e]) => {
        visible = e.isIntersecting;
        if (visible) start(); else stop();
      }, { threshold: 0.3 }).observe(line.closest(".phone"));
    } else if (!reduce) start();

    document.querySelectorAll(".looks-picker button").forEach((b) => {
      b.addEventListener("click", () => {
        document.querySelectorAll(".looks-picker button").forEach((x) => x.setAttribute("aria-pressed", x === b ? "true" : "false"));
        line.dataset.look = b.dataset.look;
        if (reduce) showAll();
      });
    });
  }

  /* ---------- Text animation demo (transform and opacity only) ---------- */
  const word = document.getElementById("anim-word");
  const nameEl = document.getElementById("anim-name");
  if (word && word.animate) {
    const names = {
      en: ["Fade", "Pop", "Zoom", "Rise", "Drop", "Slide left", "Slide right", "Wipe", "Type on"],
      id: ["Fade", "Pop", "Zoom", "Rise", "Drop", "Slide left", "Slide right", "Wipe", "Type on"],
    };
    const label = names[doc.lang] || names.en;
    const ease = "cubic-bezier(0.22, 1, 0.36, 1)";
    const kinds = [
      [{ opacity: 0 }, { opacity: 1 }],
      [{ opacity: 0, transform: "scale(0.6)" }, { opacity: 1, transform: "scale(1.08)", offset: 0.6 }, { opacity: 1, transform: "scale(1)" }],
      [{ opacity: 0, transform: "scale(1.3)" }, { opacity: 1, transform: "scale(1)" }],
      [{ opacity: 0, transform: "translateY(40%)" }, { opacity: 1, transform: "translateY(0)" }],
      [{ opacity: 0, transform: "translateY(-40%)" }, { opacity: 1, transform: "translateY(0)" }],
      [{ opacity: 0, transform: "translateX(30%)" }, { opacity: 1, transform: "translateX(0)" }],
      [{ opacity: 0, transform: "translateX(-30%)" }, { opacity: 1, transform: "translateX(0)" }],
      "wipe",
      "type",
    ];
    const full = word.innerHTML;
    const text = word.textContent;
    let k = 0, running = false, timer = null;
    const play = () => {
      const kind = kinds[k];
      nameEl.textContent = label[k];
      word.innerHTML = full;
      if (kind === "type") {
        // typewriter: characters appear one at a time
        word.textContent = "";
        const chars = [...text];
        chars.forEach((c, i) => {
          const s = document.createElement("span");
          s.textContent = c;
          s.style.opacity = "0";
          word.appendChild(s);
          s.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 1, delay: 60 + i * 55, fill: "forwards" });
        });
      } else if (kind === "wipe") {
        // reveal from the left edge: two opposite translations inside a clipping box
        word.innerHTML = '<span class="wipe-o"><span class="wipe-i">' + full + "</span></span>";
        const o = word.firstChild, inner = o.firstChild;
        o.animate([{ transform: "translateX(-100%)" }, { transform: "translateX(0)" }], { duration: 600, easing: ease, fill: "both" });
        inner.animate([{ transform: "translateX(100%)" }, { transform: "translateX(0)" }], { duration: 600, easing: ease, fill: "both" });
      } else {
        word.animate(kind, { duration: 600, easing: ease, fill: "both" });
      }
      k = (k + 1) % kinds.length;
      timer = setTimeout(() => {
        const out = word.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 240, easing: "ease-in", fill: "forwards" });
        out.onfinish = () => { if (running) play(); };
      }, 1500);
    };
    if (!reduce && "IntersectionObserver" in window) {
      new IntersectionObserver(([e]) => {
        if (e.isIntersecting && !running) { running = true; play(); }
        else if (!e.isIntersecting && running) {
          running = false; clearTimeout(timer);
          word.getAnimations().forEach((a) => a.cancel());
          word.innerHTML = full;
        }
      }, { threshold: 0.4 }).observe(word);
    }
  }

  /* ---------- Glass sheen layer ---------- */
  document.querySelectorAll(".card.glass, .tile.glass").forEach((c) => {
    const sh = document.createElement("span");
    sh.className = "sheen";
    sh.setAttribute("aria-hidden", "true");
    c.appendChild(sh);
  });

  /* ---------- Sound bars ---------- */
  const bars = document.querySelector(".sfx-bars");
  if (bars) {
    const shape = [0.2, 0.35, 0.6, 0.9, 1, 0.8, 0.55, 0.4, 0.7, 0.95, 0.6, 0.3, 0.2, 0.45, 0.8, 0.5, 0.3, 0.6, 0.85, 0.4, 0.25, 0.15];
    shape.forEach((s, i) => {
      const b = document.createElement("i");
      b.style.setProperty("--s", s);
      b.style.setProperty("--d", (-i * 0.13).toFixed(2) + "s");
      bars.appendChild(b);
    });
  }

  /* ---------- Terminal lines ---------- */
  const term = document.getElementById("term");
  if (term) {
    const lines = term.querySelectorAll(".ln");
    if (reduce || !("IntersectionObserver" in window)) {
      lines.forEach((l) => l.classList.add("on"));
    } else {
      new IntersectionObserver(([e], o) => {
        if (!e.isIntersecting) return;
        o.disconnect();
        lines.forEach((l, i) => setTimeout(() => l.classList.add("on"), 250 + i * 520));
      }, { threshold: 0.35 }).observe(term);
    }
  }

  /* ---------- Video posters load only near the viewport ---------- */
  const lazyPosters = document.querySelectorAll("video[data-poster]");
  const setPoster = (v) => { if (!v.poster) v.poster = v.dataset.poster; };
  if ("IntersectionObserver" in window) {
    const po = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { setPoster(e.target); po.unobserve(e.target); } });
    }, { rootMargin: "800px 0px" });
    lazyPosters.forEach((v) => { if (!v.closest("dialog")) po.observe(v); });
  } else {
    lazyPosters.forEach(setPoster);
  }

  /* ---------- Trailer: sound on tap ---------- */
  const player = document.getElementById("trailer-player");
  if (player) {
    const v = player.querySelector("video");
    const btn = player.querySelector(".play-btn");
    btn.addEventListener("click", () => {
      if (!v.src) v.src = v.dataset.src;
      v.controls = true;
      v.muted = false;
      player.classList.add("is-playing");
      v.play().catch(() => {});
      v.focus();
    });
  }

  /* ---------- Mac trailer dialog ---------- */
  const dlg = document.getElementById("mac-trailer");
  if (dlg && dlg.showModal) {
    const v = dlg.querySelector("video");
    let opener = null;
    document.querySelectorAll('[data-dialog="mac-trailer"]').forEach((b) => {
      b.addEventListener("click", () => {
        opener = b;
        setPoster(v);
        if (!v.src) v.src = v.dataset.src;
        dlg.showModal();
        v.play().catch(() => {});
      });
    });
    const close = () => dlg.close();
    dlg.querySelector(".close").addEventListener("click", close);
    dlg.addEventListener("click", (e) => { if (e.target === dlg) close(); });
    dlg.addEventListener("close", () => { v.pause(); if (opener) opener.focus(); });
  } else if (dlg) {
    document.querySelectorAll('[data-dialog="mac-trailer"]').forEach((b) => {
      b.addEventListener("click", () => { window.location.href = dlg.querySelector("video").dataset.src; });
    });
  }

  /* ---------- Follow a change of the reduced-motion setting ---------- */
  const onReduce = (e) => {
    reduce = e.matches;
    doc.classList.toggle("reduced", reduce);
    if (reduce) {
      if (hero && !hero.paused) hero.pause();
      parallax.forEach((el) => { el.style.transform = ""; });
      if (tilt) tilt.style.transform = "";
      revealEls.forEach((el) => el.classList.add("in"));
    }
  };
  if (reduced.addEventListener) reduced.addEventListener("change", onReduce);
})();

/* The language switch keeps the reader's place: it points at the section on screen. */
(() => {
  const links = document.querySelectorAll(".lang a[hreflang]");
  const secs = Array.from(document.querySelectorAll("main section[id]"));
  const here = () => {
    let id = "";
    for (const s of secs) { if (s.getBoundingClientRect().top <= window.innerHeight * 0.4) id = s.id; }
    return id;
  };
  links.forEach((a) => {
    const base = a.getAttribute("href").split("#")[0];
    const set = () => { const id = window.scrollY > 200 ? here() : ""; a.setAttribute("href", id ? base + "#" + id : base); };
    ["pointerdown", "focus", "keydown"].forEach((ev) => a.addEventListener(ev, set));
  });
})();
