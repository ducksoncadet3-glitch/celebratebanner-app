"use strict";
(() => {
  // src/dom.ts
  function h(tag, attrs, ...children) {
    const el = document.createElement(tag);
    if (attrs) {
      for (const [k, v] of Object.entries(attrs)) {
        if (v == null || v === false) continue;
        if (k === "class") el.className = String(v);
        else if (k === "html") el.innerHTML = String(v);
        else if (k === "dataset") Object.assign(el.dataset, v);
        else if (k.startsWith("on") && typeof v === "function") {
          el.addEventListener(k.slice(2).toLowerCase(), v);
        } else el.setAttribute(k, v === true ? "" : String(v));
      }
    }
    appendChildren(el, children);
    return el;
  }
  function appendChildren(el, children) {
    for (const c of children) {
      if (c == null) continue;
      if (Array.isArray(c)) appendChildren(el, c);
      else if (typeof c === "object" && "nodeType" in c) el.appendChild(c);
      else el.appendChild(document.createTextNode(String(c)));
    }
  }
  function clear(el) {
    while (el.firstChild) el.removeChild(el.firstChild);
  }

  // src/styles.ts
  var STYLE_ELEMENT_ID = "cb-premium-reveal-styles";
  var PREMIUM_REVEAL_CSS = `
:root {
  --pr-obsidian: #0C0E14; --pr-obsidian2:#141824; --pr-gold:#C9A84C; --pr-gold2:#E8C97A;
  --pr-ivory:#FAF8F3; --pr-muted:rgba(250,248,243,0.62); --pr-border:rgba(201,168,76,0.22);
  --pr-serif:'Cormorant Garamond', Georgia, serif; --pr-sans:'Outfit', system-ui, sans-serif;
}
.pr-root { background:var(--pr-obsidian); color:var(--pr-ivory); font-family:var(--pr-sans);
  padding:2.5rem 1.5rem 3rem; max-width:1200px; margin:0 auto; }
.pr-visually-hidden { position:absolute!important; width:1px; height:1px; padding:0; margin:-1px;
  overflow:hidden; clip:rect(0 0 0 0); white-space:nowrap; border:0; }

/* Header */
.pr-title { font-family:var(--pr-serif); font-weight:700; font-size:clamp(28px,5vw,46px);
  text-align:center; margin:0 0 .5rem; color:var(--pr-ivory); letter-spacing:.5px; }
.pr-subtitle { text-align:center; color:var(--pr-muted); font-size:clamp(14px,2vw,17px);
  max-width:640px; margin:0 auto 2rem; line-height:1.5; }

/* Loading sequence */
.pr-loading { max-width:520px; margin:1rem auto; }
.pr-loading-title { font-family:var(--pr-serif); font-size:24px; text-align:center; margin:0 0 1.25rem; }
.pr-stages { list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:12px; }
.pr-stage { display:flex; align-items:center; gap:14px; padding:10px 14px; border-radius:12px;
  border:1px solid transparent; transition:all .4s ease; opacity:.45; }
.pr-stage-dot { width:22px; height:22px; border-radius:50%; flex:none; border:2px solid var(--pr-border);
  display:grid; place-items:center; font-size:12px; color:var(--pr-obsidian); }
.pr-stage-label { font-size:15px; }
.pr-stage--pending { opacity:.4; }
.pr-stage--active { opacity:1; border-color:var(--pr-border); background:rgba(201,168,76,0.06); }
.pr-stage--active .pr-stage-dot { border-color:var(--pr-gold);
  animation:pr-pulse 1.2s ease-in-out infinite; }
.pr-stage--done { opacity:1; }
.pr-stage--done .pr-stage-dot { background:linear-gradient(135deg,var(--pr-gold),var(--pr-gold2));
  border-color:var(--pr-gold); }
.pr-stage--done .pr-stage-dot::after { content:'\u2713'; font-weight:800; }

/* Director's choice note + gallery */
.pr-directors-note { text-align:center; color:var(--pr-gold2); font-size:13px; letter-spacing:.12em;
  text-transform:uppercase; font-weight:700; margin:0 0 1.25rem; }
.pr-gallery { display:grid; grid-template-columns:repeat(2,1fr); gap:22px; }

/* Concept card */
.pr-card { position:relative; background:var(--pr-obsidian2); border:1px solid var(--pr-border);
  border-radius:18px; overflow:hidden; display:flex; flex-direction:column;
  opacity:0; transform:translateY(16px); animation:pr-rise .6s ease forwards;
  animation-delay:calc(var(--pr-index,0) * 120ms); }
.pr-card:focus-within, .pr-card:hover { border-color:var(--pr-gold); }
.pr-card--directors { border-color:var(--pr-gold);
  box-shadow:0 0 0 1px var(--pr-gold), 0 18px 50px rgba(201,168,76,0.14); }
.pr-card-preview { aspect-ratio:4/5; background:
  linear-gradient(135deg, rgba(201,168,76,0.10), rgba(12,14,20,0.6)); display:grid; place-items:center;
  color:var(--pr-muted); font-size:13px; letter-spacing:.1em; text-transform:uppercase;
  border-bottom:1px solid var(--pr-border); }
.pr-card-preview-mark { text-align:center; }
.pr-card-topline { display:flex; align-items:center; justify-content:space-between; gap:12px;
  position:absolute; top:12px; left:12px; right:12px; }
.pr-card-body { padding:24px 24px 22px; display:flex; flex-direction:column; gap:14px; flex:1; }
.pr-card-name { font-family:var(--pr-serif); font-weight:700; font-size:27px; line-height:1.15;
  letter-spacing:.005em; margin:0; }
.pr-card-lede { font-family:var(--pr-serif); font-style:italic; font-size:16px; line-height:1.5;
  color:var(--pr-ivory); opacity:.9; margin:0; }
.pr-card-points { list-style:none; margin:2px 0 0; padding:0; display:flex; flex-direction:column; gap:9px; }
.pr-card-point { position:relative; padding-left:18px; font-size:13.5px; line-height:1.45; color:var(--pr-muted);
  letter-spacing:.005em; }
.pr-card-point::before { content:""; position:absolute; left:0; top:.55em; width:6px; height:6px; border-radius:50%;
  background:linear-gradient(135deg,var(--pr-gold),var(--pr-gold2)); }
.pr-badge-none { display:none; }
.pr-card-title { color:var(--pr-gold2); font-size:14px; margin:-6px 0 0; }
.pr-card-explanation { color:rgba(250,248,243,0.82); font-size:13.5px; line-height:1.5; margin:0; }
.pr-card-product { font-size:12.5px; color:var(--pr-ivory); }
.pr-card-product b { color:var(--pr-gold2); }
.pr-card-psychology { font-size:12.5px; color:var(--pr-muted); font-style:italic; line-height:1.45; margin:0; }
.pr-card-actions { display:flex; flex-wrap:wrap; gap:10px; margin-top:auto; padding-top:14px; }

/* WOW score */
.pr-score { display:inline-flex; align-items:baseline; gap:3px; background:rgba(12,14,20,0.72);
  border:1px solid var(--pr-border); border-radius:999px; padding:5px 11px; backdrop-filter:blur(4px); }
.pr-score-num { font-family:var(--pr-serif); font-weight:700; font-size:18px; color:var(--pr-gold2); }
.pr-score-max { font-size:11px; color:var(--pr-muted); }

/* Masterpiece badge */
.pr-badge { display:inline-flex; align-items:center; gap:5px; font-size:10.5px; font-weight:800;
  letter-spacing:.08em; text-transform:uppercase; color:var(--pr-obsidian); border-radius:999px;
  padding:5px 10px; background:linear-gradient(135deg,var(--pr-gold),var(--pr-gold2));
  box-shadow:0 4px 14px rgba(201,168,76,0.35); }
.pr-badge--pending { color:var(--pr-muted); background:transparent; border:1px solid var(--pr-border); }

/* Director choice ribbon */
.pr-choice { display:inline-flex; align-items:center; gap:5px; font-size:10.5px; font-weight:800;
  letter-spacing:.1em; text-transform:uppercase; color:var(--pr-gold2); }

/* Buttons */
.pr-btn { font-family:var(--pr-sans); font-size:13px; font-weight:700; letter-spacing:.02em; padding:11px 18px;
  border-radius:999px; cursor:pointer; border:1px solid var(--pr-border); background:transparent;
  color:var(--pr-ivory); transition:all .2s ease; }
.pr-btn:hover { border-color:var(--pr-gold); }
.pr-btn:focus-visible { outline:2px solid var(--pr-gold2); outline-offset:2px; }
.pr-btn--choose { background:linear-gradient(135deg,var(--pr-gold),var(--pr-gold2)); color:var(--pr-obsidian);
  border-color:transparent; }

@keyframes pr-rise { to { opacity:1; transform:none; } }
@keyframes pr-pulse { 0%,100%{ box-shadow:0 0 0 0 rgba(201,168,76,0.5);} 50%{ box-shadow:0 0 0 6px rgba(201,168,76,0);} }

@media (max-width:720px) {
  .pr-gallery { grid-template-columns:1fr; }
  .pr-root { padding:1.75rem 1rem 2.5rem; }
}
@media (prefers-reduced-motion: reduce) {
  .pr-card { animation:none; opacity:1; transform:none; }
  .pr-stage, .pr-btn { transition:none; }
  .pr-stage--active .pr-stage-dot { animation:none; }
}
`;
  function injectStyles(doc = document) {
    if (doc.getElementById(STYLE_ELEMENT_ID)) return;
    const style = doc.createElement("style");
    style.id = STYLE_ELEMENT_ID;
    style.textContent = PREMIUM_REVEAL_CSS;
    (doc.head || doc.documentElement).appendChild(style);
  }

  // src/WOWScore/index.ts
  function createWowScore(score, max = 100) {
    const n = Math.round(score);
    return h(
      "span",
      { class: "pr-score", role: "img", "aria-label": `WOW Score ${n} out of ${max}` },
      h("span", { class: "pr-score-num", "aria-hidden": "true" }, String(n)),
      h("span", { class: "pr-score-max", "aria-hidden": "true" }, `/${max}`)
    );
  }

  // src/MasterpieceBadge/index.ts
  function createMasterpieceBadge(passed) {
    if (!passed) return h("span", { class: "pr-badge-none", "aria-hidden": "true" });
    return h(
      "span",
      { class: "pr-badge", role: "img", "aria-label": "Masterpiece \u2014 passed the WOW quality gate" },
      h("span", { "aria-hidden": "true" }, "\u2728"),
      "Masterpiece"
    );
  }

  // src/DirectorChoice/index.ts
  function createDirectorChoice() {
    return h(
      "span",
      { class: "pr-choice", role: "img", "aria-label": "Director's Choice \u2014 the AI's recommended concept" },
      h("span", { "aria-hidden": "true" }, "\u2605"),
      "Director\u2019s Choice"
    );
  }

  // src/types.ts
  var CTA_PRIMARY = "Choose This Design";
  var CTA_SECONDARY = "More Details";
  var LOADING_STAGES = [
    "Understanding your celebration",
    "Finding your strongest memories",
    "Selecting your hero photograph",
    "Building your family's story",
    "Creating premium concepts",
    "Final creative review"
  ];
  var REVEAL_TITLE = "Your Masterpieces Are Ready";
  var REVEAL_SUBTITLE = "Our AI Creative Director created four unique concepts from your memories.";

  // src/ConceptCard/index.ts
  function fallbackCopy(concept) {
    return {
      title: concept.conceptName,
      emotionalSentence: concept.title || "A moment worth keeping, composed with care.",
      bullets: [
        "Museum-grade composition",
        `Recommended as ${concept.recommendedProduct}`,
        "Printed at 300 DPI on archival stock"
      ]
    };
  }
  function createConceptCard(props) {
    const { concept, index, isDirectorsChoice, handlers = {} } = props;
    const copy = props.copy ?? fallbackCopy(concept);
    const bullets = copy.bullets.slice(0, 3);
    const labelBits = [`${copy.title} concept`, `WOW score ${Math.round(concept.wowScore)} of 100`];
    if (concept.masterpiecePassed) labelBits.push("masterpiece");
    if (isDirectorsChoice) labelBits.push("Director's Choice");
    const preview = h(
      "div",
      { class: "pr-card-preview", "aria-hidden": "true" },
      h("div", { class: "pr-card-preview-mark" }, "Preview")
    );
    const topline = h(
      "div",
      { class: "pr-card-topline" },
      isDirectorsChoice ? createDirectorChoice() : h("span"),
      createWowScore(concept.wowScore)
    );
    const previewWrap = h("div", { class: "pr-card-media" }, preview, topline);
    const cta = (cls, text, ariaVerb, cb) => h(
      "button",
      { type: "button", class: `pr-btn ${cls}`, "aria-label": `${ariaVerb}: ${copy.title}`, onClick: () => cb?.(concept) },
      text
    );
    const actions = h(
      "div",
      { class: "pr-card-actions" },
      cta("pr-btn--choose", CTA_PRIMARY, "Choose this design", handlers.onChoose),
      cta("pr-btn--details", CTA_SECONDARY, "More details for", handlers.onDetails)
    );
    const points = h(
      "ul",
      { class: "pr-card-points" },
      ...bullets.map((b) => h("li", { class: "pr-card-point" }, b))
    );
    const body = h(
      "div",
      { class: "pr-card-body" },
      h("h3", { class: "pr-card-name" }, copy.title),
      concept.masterpiecePassed ? createMasterpieceBadge(true) : null,
      h("p", { class: "pr-card-lede" }, copy.emotionalSentence),
      points,
      actions
    );
    const attrs = {
      class: `pr-card${isDirectorsChoice ? " pr-card--directors" : ""}`,
      role: "group",
      tabindex: "0",
      dataset: { concept: concept.conceptName, index: String(index) },
      "aria-label": labelBits.join(", "),
      style: `--pr-index:${index}`
    };
    if (isDirectorsChoice) attrs["aria-current"] = "true";
    return h("article", attrs, previewWrap, body);
  }

  // src/RevealGallery/index.ts
  function createRevealGallery(props) {
    const { presentation, handlers, copyFor: copyFor2 } = props;
    const cards = presentation.concepts.map(
      (concept, i) => createConceptCard({
        concept,
        index: i,
        isDirectorsChoice: concept.conceptName === presentation.recommendedConcept,
        copy: copyFor2?.(concept.conceptName),
        handlers
      })
    );
    const gallery = h("div", { class: "pr-gallery", role: "group", "aria-label": "Four concept masterpieces" });
    for (const c of cards) gallery.appendChild(c);
    const NAV = ["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown", "Home", "End"];
    gallery.addEventListener("keydown", (ev) => {
      const e = ev;
      if (!NAV.includes(e.key)) return;
      const active = document.activeElement;
      let idx = cards.findIndex((c) => c === active);
      if (idx === -1) idx = 0;
      let nextIdx = idx;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") nextIdx = Math.min(cards.length - 1, idx + 1);
      else if (e.key === "ArrowLeft" || e.key === "ArrowUp") nextIdx = Math.max(0, idx - 1);
      else if (e.key === "Home") nextIdx = 0;
      else if (e.key === "End") nextIdx = cards.length - 1;
      if (nextIdx !== idx) {
        e.preventDefault();
        cards[nextIdx].focus();
      }
    });
    return gallery;
  }

  // src/LoadingSequence/index.ts
  function createLoadingSequence(props = {}) {
    const stages = LOADING_STAGES;
    const list = h("ol", { class: "pr-stages" });
    const live = h("div", { class: "pr-visually-hidden", role: "status", "aria-live": "polite", "aria-atomic": "true" });
    const el = h(
      "section",
      { class: "pr-loading", "aria-label": "Creating your masterpieces" },
      h("h2", { class: "pr-loading-title" }, "Creating your masterpieces\u2026"),
      list,
      live
    );
    const rows = stages.map(
      (label2, i) => h(
        "li",
        { class: "pr-stage pr-stage--pending", dataset: { index: String(i) } },
        h("span", { class: "pr-stage-dot", "aria-hidden": "true" }),
        h("span", { class: "pr-stage-label" }, label2)
      )
    );
    for (const r of rows) list.appendChild(r);
    let index = -1;
    let done = false;
    let timer = null;
    function render2() {
      rows.forEach((row2, i) => {
        const state = done || i < index ? "done" : i === index ? "active" : "pending";
        row2.className = `pr-stage pr-stage--${state}`;
        if (state === "active") row2.setAttribute("aria-current", "step");
        else row2.removeAttribute("aria-current");
      });
    }
    function goTo(i) {
      index = Math.max(0, Math.min(stages.length - 1, i));
      done = false;
      render2();
      const label2 = stages[index];
      live.textContent = label2;
      props.onStageChange?.(index, label2);
    }
    function complete() {
      if (done) return;
      done = true;
      render2();
      live.textContent = "Your masterpieces are ready.";
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      props.onComplete?.();
    }
    function next() {
      if (done) return;
      if (index < stages.length - 1) goTo(index + 1);
      else complete();
    }
    goTo(0);
    if (props.auto) {
      const ms = props.intervalMs ?? 900;
      const tick = () => {
        if (done) return;
        if (index < stages.length - 1) {
          goTo(index + 1);
          timer = setTimeout(tick, ms);
        } else complete();
      };
      timer = setTimeout(tick, ms);
    }
    return {
      el,
      stages,
      get index() {
        return index;
      },
      goTo,
      next,
      complete,
      isComplete: () => done,
      destroy() {
        if (timer) {
          clearTimeout(timer);
          timer = null;
        }
      }
    };
  }

  // src/PremiumReveal/index.ts
  function createPremiumReveal(props) {
    const { presentation, handlers, copyFor: copyFor2, skipLoading = false, loadingIntervalMs = 900, onRevealed } = props;
    injectStyles(document);
    const root = h("section", { class: "pr-root", role: "region", "aria-label": "Your masterpieces" });
    const renderReveal = () => {
      clear(root);
      root.appendChild(h("h1", { class: "pr-title" }, REVEAL_TITLE));
      root.appendChild(h("p", { class: "pr-subtitle" }, REVEAL_SUBTITLE));
      root.appendChild(
        h(
          "p",
          { class: "pr-directors-note" },
          h("span", { "aria-hidden": "true" }, "\u2605 "),
          `Director\u2019s Choice: ${presentation.recommendedConcept}`
        )
      );
      root.appendChild(createRevealGallery({ presentation, copyFor: copyFor2, handlers }));
      onRevealed?.();
    };
    if (skipLoading) {
      renderReveal();
    } else {
      const loader = createLoadingSequence({ auto: true, intervalMs: loadingIntervalMs, onComplete: renderReveal });
      root.appendChild(loader.el);
    }
    return root;
  }
  function mountPremiumReveal(container, props) {
    const root = createPremiumReveal(props);
    clear(container);
    container.appendChild(root);
    return root;
  }

  // ../shared/creative-brief/src/types.ts
  var SCHEMA_VERSION = "1.0.0";

  // ../shared/creative-brief/src/engine.ts
  var OBSIDIAN = "#0C0E14";
  var GOLD = "#C9A84C";
  var IVORY = "#FAF8F3";
  var CONCEPTS = ["Signature Edition", "Luxury Gold", "Family Legacy", "Modern Editorial"];
  function fnv1a(str) {
    let h2 = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h2 ^= str.charCodeAt(i);
      h2 = Math.imul(h2, 16777619);
    }
    return (h2 >>> 0).toString(16).padStart(8, "0");
  }
  function briefIdFor(p) {
    const key = [
      p.occasion,
      p.recommended_concept,
      p.hero_photo?.photoId ?? "none",
      p.supporting_photos.map((s) => s.photoId).join(","),
      p.mood,
      p.confidence_score
    ].join("|");
    return `brief_${fnv1a(key)}`;
  }
  var EMOTION = {
    graduation: { primary: "pride", keywords: ["pride", "achievement", "future"], statement: "Celebrate the pride of a milestone earned and the promise of what's next." },
    championship: { primary: "victory", keywords: ["victory", "energy", "unity"], statement: "Capture the roar of victory and the unity that earned it." },
    team: { primary: "unity", keywords: ["unity", "strength", "energy"], statement: "Rally the shared identity and strength of the team." },
    wedding: { primary: "romance", keywords: ["romance", "elegance", "timelessness"], statement: "Tell a love story with elegance and timeless grace." },
    birthday: { primary: "joy", keywords: ["joy", "warmth", "celebration"], statement: "Radiate joy and warmth for a day worth celebrating." },
    baby_shower: { primary: "tenderness", keywords: ["tenderness", "hope", "new beginnings"], statement: "Welcome new life with tenderness and hope." },
    retirement: { primary: "gratitude", keywords: ["gratitude", "legacy", "accomplishment"], statement: "Honor a career of accomplishment and a legacy earned." },
    family_reunion: { primary: "warmth", keywords: ["warmth", "legacy", "belonging"], statement: "Gather generations in warmth and belonging." },
    church: { primary: "reverence", keywords: ["reverence", "community", "faith"], statement: "Uplift a community bound by faith." },
    military: { primary: "honor", keywords: ["honor", "sacrifice", "pride"], statement: "Salute service with honor and quiet pride." },
    corporate: { primary: "achievement", keywords: ["achievement", "professionalism", "momentum"], statement: "Mark achievement with confident professionalism." },
    memorial: { primary: "respect", keywords: ["respect", "peace", "remembrance"], statement: "Remember a life with respect, peace, and love." },
    senior_night: { primary: "nostalgia", keywords: ["nostalgia", "pride", "farewell"], statement: "Honor a bittersweet farewell with pride and nostalgia." },
    social: { primary: "excitement", keywords: ["excitement", "boldness", "shareability"], statement: "Create an instantly shareable burst of pride." },
    unknown: { primary: "celebration", keywords: ["celebration", "memory", "joy"], statement: "Celebrate a meaningful moment worth keeping." }
  };
  var STORY_ANGLE = {
    graduation: "A journey of perseverance leading to graduation.",
    championship: "A season of teamwork that became a championship.",
    team: "A team forged in shared purpose.",
    wedding: "A love story told with elegance and timelessness.",
    birthday: "A joyful milestone in a life well lived.",
    baby_shower: "The first chapter of a new life beginning.",
    retirement: "A career of dedication honored at its close.",
    family_reunion: "A family legacy told through generations.",
    church: "A community gathered in faith and fellowship.",
    military: "A story of service, sacrifice, and honor.",
    corporate: "A milestone of achievement and momentum.",
    memorial: "A life remembered with peace and gratitude.",
    senior_night: "A final home moment before a new chapter.",
    social: "A proud moment made to be shared.",
    unknown: "A celebration of a meaningful moment."
  };
  var MESSAGES = {
    graduation: { primary: "{Graduate Name}", secondary: "Class of {Year}" },
    championship: { primary: "{Team} \u2014 Champions", secondary: "{Year} {Title}" },
    team: { primary: "{Team Name}", secondary: "{Season}" },
    wedding: { primary: "{Couple Names}", secondary: "{Wedding Date}" },
    birthday: { primary: "Happy Birthday, {Name}", secondary: "{Age} / {Date}" },
    baby_shower: { primary: "Welcome, {Baby Name}", secondary: "{Date}" },
    retirement: { primary: "Congratulations, {Name}", secondary: "{Years} of Service" },
    family_reunion: { primary: "The {Family} Family", secondary: "{Year} Reunion" },
    church: { primary: "{Occasion Title}", secondary: "{Date}" },
    military: { primary: "{Name}", secondary: "{Branch} \xB7 {Years}" },
    corporate: { primary: "{Headline}", secondary: "{Company} \xB7 {Year}" },
    memorial: { primary: "{Full Name}", secondary: "{Birth Year} \u2013 {Year}" },
    senior_night: { primary: "{Name} \xB7 #{Number}", secondary: "Senior Night {Year}" },
    social: { primary: "{Short Headline}", secondary: "{Handle / Tag}" },
    unknown: { primary: "{Name}", secondary: "{Date}" }
  };
  var TYPO_BY_CONCEPT = {
    "Signature Edition": "elegant",
    "Luxury Gold": "bold",
    "Family Legacy": "legacy",
    "Modern Editorial": "editorial"
  };
  var COMPOSITION_BY_CONCEPT = {
    "Signature Edition": { layout: "Central hero with a disciplined supporting grid.", balance: "symmetrical", whitespace: "generous" },
    "Luxury Gold": { layout: "Dramatic spotlighted hero with luxurious negative space and gold framing.", balance: "symmetrical", whitespace: "expansive" },
    "Family Legacy": { layout: "Narrative flow \u2014 hero plus a meaningful gathered cluster.", balance: "organic", whitespace: "warm-generous" },
    "Modern Editorial": { layout: "Editorial asymmetry with an oversized hero and bold type blocks.", balance: "asymmetrical", whitespace: "bold" }
  };
  var BASE_FORBIDDEN = ["clip art", "emoji as decoration", "stock stickers", "random photo placement"];
  var DECOR = {
    graduation: { allowed: ["thin gold accent lines", "subtle spotlight", "refined year label"], forbidden: ["cap-and-gown clip art", "confetti overload"] },
    championship: { allowed: ["gold glow", "spotlight", "trophy emphasis", "corner flourish"], forbidden: ["flat gold wash", "busy background", "licensed logos or likenesses"] },
    team: { allowed: ["spotlight rays", "geometric accents", "restrained sky/gold accent bars"], forbidden: ["licensed logos or likenesses", "equal-size player grid"] },
    wedding: { allowed: ["soft florals (restrained)", "thin gold lines", "elegant framing"], forbidden: ["heavy ornament", "busy patterns"] },
    birthday: { allowed: ["restrained confetti accent", "warm glow", "bold type block"], forbidden: ["confetti overload", "cartoon clip art"] },
    baby_shower: { allowed: ["soft neutrals", "gentle glow", "delicate gold detail"], forbidden: ["loud color", "busy patterns"] },
    retirement: { allowed: ["gold detail", "warm vignette", "timeline accents"], forbidden: ["corporate clutter"] },
    family_reunion: { allowed: ["soft texture", "warm vignette", "understated gold", "tasteful dates"], forbidden: ["cold grids", "heavy captions"] },
    church: { allowed: ["soft light", "gold detail", "dignified framing"], forbidden: ["garish color", "clutter"] },
    military: { allowed: ["restrained gold", "dignified framing", "subtle emblematic accent"], forbidden: ["cheap patriotic clich\xE9s", "clutter"] },
    corporate: { allowed: ["clean geometric accents", "thin gold rules"], forbidden: ["gold overuse", "clutter"] },
    memorial: { allowed: ["memorial glow", "soft vignette", "muted gold"], forbidden: ["bright confetti", "celebratory glitz"] },
    senior_night: { allowed: ["cinematic lighting", "gold accents", "bold number treatment"], forbidden: ["licensed logos or likenesses", "generic sports template"] },
    social: { allowed: ["geometric accents", "bold rules", "gold highlight"], forbidden: ["tiny text", "gold overuse"] },
    unknown: { allowed: ["thin gold accent lines", "subtle spotlight"], forbidden: ["clutter"] }
  };
  var HEIRLOOM = /* @__PURE__ */ new Set(["memorial", "family_reunion", "wedding", "retirement", "baby_shower", "church"]);
  function productIntentFor(occasion) {
    if (occasion === "social") {
      return {
        recommendedProducts: ["Digital download", "Standard print", "Framed"],
        primaryProduct: "Digital download",
        guidance: "Lead with the instantly shareable digital, then offer prints. (Descriptive only \u2014 no pricing.)"
      };
    }
    const primary = HEIRLOOM.has(occasion) ? "Framed" : "Standard print";
    return {
      recommendedProducts: ["Framed", "Premium print", "Standard print", "Digital download"],
      primaryProduct: primary,
      guidance: `Lead toward the ${primary.toLowerCase()} as a display-worthy keepsake. (Descriptive only \u2014 no pricing.)`
    };
  }
  var AUDIENCE = {
    graduation: { primaryAudience: "the graduate and immediate family", sharingContext: "shared with extended family before purchase" },
    championship: { primaryAudience: "the team, players, and their families", sharingContext: "shared across the team and fans" },
    team: { primaryAudience: "the team and its supporters", sharingContext: "shared across the roster and community" },
    wedding: { primaryAudience: "the couple and their families", sharingContext: "shared with guests and loved ones" },
    birthday: { primaryAudience: "the celebrant and close circle", sharingContext: "shared with friends and family" },
    baby_shower: { primaryAudience: "the parents-to-be and family", sharingContext: "shared with close family and friends" },
    retirement: { primaryAudience: "the retiree, family, and colleagues", sharingContext: "shared with coworkers and family" },
    family_reunion: { primaryAudience: "the extended family", sharingContext: "shared across generations" },
    church: { primaryAudience: "the congregation and community", sharingContext: "shared within the community" },
    military: { primaryAudience: "the service member and family", sharingContext: "shared with family and unit" },
    corporate: { primaryAudience: "the company and stakeholders", sharingContext: "shared internally and externally" },
    memorial: { primaryAudience: "the family and loved ones", sharingContext: "shared with mourners and family" },
    senior_night: { primaryAudience: "the athlete and family", sharingContext: "shared with family, team, and fans" },
    social: { primaryAudience: "the poster and their followers", sharingContext: "posted publicly on social platforms" },
    unknown: { primaryAudience: "the customer and their loved ones", sharingContext: "shared with family and friends before purchase" }
  };
  var PERSONALIZATION = {
    graduation: ["Graduate's name", "School & class year", "Optional short quote"],
    championship: ["Team or player name", "Year & title", "Optional final score/record"],
    team: ["Team name", "Season / year", "Optional roster line"],
    wedding: ["Couple's names", "Wedding date", "Optional vow or quote line"],
    birthday: ["Name", "Age or date", "Optional message"],
    baby_shower: ["Baby's name (or 'Baby {Surname}')", "Date", "Optional message"],
    retirement: ["Name", "Years of service", "Optional message"],
    family_reunion: ["Family name", "Year or date", "Optional caption per era"],
    church: ["Occasion title", "Date", "Optional scripture line"],
    military: ["Name", "Branch & years", "Optional honor/rank"],
    corporate: ["Headline", "Company & year", "Optional subtitle"],
    memorial: ["Full name", "Years (birth\u2013passing)", "Optional short tribute"],
    senior_night: ["Name & number", "Year", "Optional stat line"],
    social: ["Short headline", "Handle or tag", "Optional caption"],
    unknown: ["Name", "Date", "Optional message"]
  };
  function upsellFor(occasion) {
    const base = ["Matching social graphic", "Phone wallpaper", "Desktop wallpaper", "Thank-you card", "Extra prints"];
    if (HEIRLOOM.has(occasion)) return [...base, "Gallery edition", "Framed upgrade"];
    if (occasion === "championship" || occasion === "team" || occasion === "senior_night") return [...base, "Team print package"];
    return base;
  }
  var WOW_EMPHASIS = {
    "Signature Edition": ["Layout Balance", "Typography", "Luxury Finish"],
    "Luxury Gold": ["Luxury Finish", "Emotional Impact", "Hero Strength"],
    "Family Legacy": ["Storytelling", "Emotional Impact"],
    "Modern Editorial": ["Layout Balance", "Typography", "Shareability"]
  };
  var clamp = (n, lo, hi) => n < lo ? lo : n > hi ? hi : n;
  var isGoldish = (hex) => /^#(c|d|e|f)/i.test(hex) && /a|b|c|8|9/i.test(hex.slice(3, 5));
  function ensureConcept(p) {
    if (CONCEPTS.includes(p.recommended_concept)) return p.recommended_concept;
    return p.primary_subject.type === "group" ? "Family Legacy" : "Signature Edition";
  }
  function heroStrategyFor(p) {
    const hero = p.hero_photo;
    if (!hero) {
      return {
        heroPhotoId: null,
        rationale: "No hero could be selected from the uploaded photos.",
        dominance: "balanced",
        dominanceRatio: 0,
        supportingRole: "Without a clear hero, request a stronger central photo before finalizing."
      };
    }
    let dominance;
    let dominanceRatio;
    if (hero.score >= 88) {
      dominance = "commanding";
      dominanceRatio = 0.62;
    } else if (hero.score >= 78) {
      dominance = "strong";
      dominanceRatio = 0.55;
    } else {
      dominance = "balanced";
      dominanceRatio = 0.45;
    }
    const subjects = hero.faceCount === 1 ? "1 clear subject" : hero.faceCount > 1 ? `${hero.faceCount} subjects` : "a strong subject";
    return {
      heroPhotoId: hero.photoId,
      rationale: `Photo ${hero.photoId} (${hero.filename ?? "untitled"}) is strongest: ${hero.orientation}, score ${hero.score}, ${subjects}.`,
      dominance,
      dominanceRatio,
      supportingRole: "All supporting photos frame and lead the eye back to the hero; none competes with it."
    };
  }
  function supportingStrategyFor(p) {
    const supporting = p.supporting_photos;
    const anchors = [];
    const builders = [];
    const accents = [];
    supporting.forEach((s, i) => {
      if (i < 2 && s.score >= 75) anchors.push(s.photoId);
      else if (s.score >= 60) builders.push(s.photoId);
      else accents.push(s.photoId);
    });
    const hierarchy = [];
    if (anchors.length) hierarchy.push({ tier: "emotional_anchor", photoIds: anchors, role: "Carry the strongest supporting emotion, just beneath the hero." });
    if (builders.length) hierarchy.push({ tier: "story_builder", photoIds: builders, role: "Advance the narrative and connect moments." });
    if (accents.length) hierarchy.push({ tier: "accent", photoIds: accents, role: "Provide gentle texture; use sparingly or omit if crowded." });
    return {
      hierarchy,
      maxRecommended: supporting.length,
      guidance: "Beauty over quantity \u2014 cut any supporting photo that weakens the composition or crowds the hero."
    };
  }
  function colorDirectionFor(p) {
    const defaulted = p.warnings.some((w) => w.code === "no_color_data");
    const source = defaulted ? "occasion-default" : "photos";
    const palette = [];
    const seen = /* @__PURE__ */ new Set();
    const add = (hex, role) => {
      const H = hex.toUpperCase();
      if (seen.has(H)) return;
      seen.add(H);
      palette.push({ hex: H, role });
    };
    const colors = p.dominant_colors ?? [];
    const primaryHex = (colors[0]?.hex ?? OBSIDIAN).toUpperCase();
    add(primaryHex, "primary");
    const goldFromPhotos = colors.find((c) => isGoldish(c.hex))?.hex;
    const accentHex = (goldFromPhotos ?? GOLD).toUpperCase();
    add(accentHex, "accent");
    for (const c of colors.slice(1, 4)) add(c.hex.toUpperCase(), "support");
    add(OBSIDIAN, "ground");
    add(GOLD, "gold-signature");
    add(IVORY, "neutral");
    return {
      palette,
      primary: primaryHex,
      accent: accentHex,
      neutral: IVORY,
      source,
      guidance: source === "photos" ? "Build on the photos' own palette, kept in harmony with the Obsidian/Gold/Ivory brand core." : "No photo color data \u2014 use the occasion default layered on the Obsidian/Gold/Ivory brand core."
    };
  }
  function typographyFor(occasion, concept) {
    const style = occasion === "memorial" ? "respectful" : TYPO_BY_CONCEPT[concept];
    const guidanceByStyle = {
      elegant: "Elegant, high-contrast hierarchy; the name is the strongest text after the hero.",
      bold: "Large, opulent display type in gold gradients; letter-spaced small-caps labels.",
      editorial: "Confident, tightly-tracked type; strong blocks with a refined serif accent.",
      legacy: "Warm classic serif with humanist support; approachable and heartfelt.",
      respectful: "Restrained, dignified type; gentle sizing and low-key gold, never flashy."
    };
    return {
      style,
      displayFont: "Cormorant Garamond",
      supportingFont: "Outfit",
      guidance: guidanceByStyle[style]
    };
  }
  function riskWarningsFor(p) {
    const risks = [];
    const totalPhotos = p.photo_rankings.length;
    if (totalPhotos < 3) {
      risks.push({ code: "too_few_photos", message: `Only ${totalPhotos} photo(s) available; concepts may feel sparse.`, severity: "warning" });
    }
    if (!p.hero_photo) {
      risks.push({ code: "weak_hero", message: "No hero photo could be selected.", severity: "warning" });
    } else if (p.hero_photo.score < 75) {
      risks.push({ code: "weak_hero", message: `Hero photo scored ${p.hero_photo.score}, below the strong threshold (75).`, severity: "warning" });
    }
    if (p.confidence_score < 70) {
      risks.push({ code: "low_confidence", message: `Memory Profile confidence is ${p.confidence_score}; direction is less certain.`, severity: "warning" });
    }
    const dupPhotos = p.duplicate_candidates.reduce((n, d) => n + d.group.length, 0);
    if (p.duplicate_candidates.length >= 2 || totalPhotos > 0 && dupPhotos / totalPhotos > 0.3) {
      risks.push({ code: "duplicate_heavy", message: "A large share of the upload is duplicates; curation applied.", severity: "info" });
    }
    if (p.restoration_candidates.length > 0) {
      risks.push({ code: "restoration_needed", message: `${p.restoration_candidates.length} photo(s) would benefit from enhancement/restoration.`, severity: "info" });
    }
    const port = p.portrait_count;
    const land = p.landscape_count;
    if (port > 0 && land > 0) {
      const ratio = Math.min(port, land) / Math.max(port, land);
      if (ratio >= 0.5) {
        risks.push({ code: "mixed_orientation_conflict", message: "Portrait and landscape photos are mixed evenly; layout must reconcile orientations carefully.", severity: "info" });
      }
    }
    if (p.supporting_photos.length >= 8 || totalPhotos >= 12) {
      risks.push({ code: "overcrowding_risk", message: "Many photos available; enforce restraint to avoid overcrowding the hero.", severity: "info" });
    }
    return risks;
  }
  function generateCreativeBrief(memoryProfile, options = {}) {
    if (!memoryProfile || typeof memoryProfile !== "object" || Array.isArray(memoryProfile)) {
      throw new TypeError("generateCreativeBrief: memoryProfile must be a MemoryProfile object");
    }
    const occasion = memoryProfile.occasion ?? "unknown";
    const recommendedConcept = ensureConcept(memoryProfile);
    const emotion = EMOTION[occasion] ?? EMOTION.unknown;
    const messages = MESSAGES[occasion] ?? MESSAGES.unknown;
    const composition = COMPOSITION_BY_CONCEPT[recommendedConcept];
    const decor = DECOR[occasion] ?? DECOR.unknown;
    const heroStrategy = heroStrategyFor(memoryProfile);
    const riskWarnings = riskWarningsFor(memoryProfile);
    let confidence = memoryProfile.confidence_score;
    if (!memoryProfile.hero_photo) confidence -= 30;
    else if (memoryProfile.hero_photo.score < 75) confidence -= 10;
    const seriousRisks = riskWarnings.filter((r) => r.severity === "warning").length;
    confidence -= Math.min(20, seriousRisks * 5);
    const confidenceScore = clamp(Math.round(confidence), 0, 100);
    return {
      schemaVersion: SCHEMA_VERSION,
      briefId: briefIdFor(memoryProfile),
      createdAt: options.now ?? null,
      occasion,
      recommendedConcept,
      emotionalDirection: { primary: emotion.primary, keywords: [...emotion.keywords], statement: emotion.statement },
      storyAngle: STORY_ANGLE[occasion] ?? STORY_ANGLE.unknown,
      primaryMessage: {
        suggestion: messages.primary,
        guidance: "Set as the dominant statement, second only to the hero photo."
      },
      secondaryMessage: {
        suggestion: messages.secondary,
        guidance: "Refined supporting label (often gold); never competes with the primary message."
      },
      heroStrategy,
      supportingPhotoStrategy: supportingStrategyFor(memoryProfile),
      colorDirection: colorDirectionFor(memoryProfile),
      typographyDirection: typographyFor(occasion, recommendedConcept),
      compositionDirection: {
        layout: composition.layout,
        balance: composition.balance,
        whitespace: composition.whitespace,
        guidance: "Whitespace is intentional; the eye must always find the hero first."
      },
      decorativeDirection: {
        allowed: [...decor.allowed],
        forbidden: [...decor.forbidden, ...BASE_FORBIDDEN],
        guidance: "Decoration must serve emotion or hierarchy \u2014 otherwise remove it."
      },
      productIntent: productIntentFor(occasion),
      audienceIntent: {
        ...AUDIENCE[occasion] ?? AUDIENCE.unknown,
        guidance: "Let audience and sharing context shape tone and shareability."
      },
      personalizationSuggestions: [...PERSONALIZATION[occasion] ?? PERSONALIZATION.unknown],
      upsellOpportunities: upsellFor(occasion),
      wowTargets: {
        overallTarget: 90,
        emphasis: [...WOW_EMPHASIS[recommendedConcept]],
        guidance: "Never present a concept below 90; push hardest on the emphasized categories."
      },
      riskWarnings,
      confidenceScore
    };
  }

  // ../shared/wow-engine/src/types.ts
  var CONCEPT_ORDER = [
    "Signature Edition",
    "Luxury Gold",
    "Family Legacy",
    "Modern Editorial"
  ];
  var SCHEMA_VERSION2 = "1.0.0";
  var WOW_THRESHOLD = 90;

  // ../shared/wow-engine/src/scoring.ts
  var clamp01 = (n) => n < 0 ? 0 : n > 1 ? 1 : n;
  var round1 = (n) => Math.round(n * 10) / 10;
  var MAX = {
    heroStrength: 15,
    emotionalImpact: 20,
    storytelling: 15,
    layoutBalance: 15,
    typography: 10,
    colorHarmony: 10,
    luxuryFinish: 10,
    shareability: 5
  };
  var MODIFIERS = {
    "Signature Edition": { heroStrength: 1.04, emotionalImpact: 1, storytelling: 1, layoutBalance: 1.08, typography: 1.06, colorHarmony: 1.04, luxuryFinish: 1.02, shareability: 1 },
    "Luxury Gold": { heroStrength: 1.03, emotionalImpact: 1.06, storytelling: 0.98, layoutBalance: 1.02, typography: 1.04, colorHarmony: 1.06, luxuryFinish: 1.18, shareability: 1.02 },
    "Family Legacy": { heroStrength: 1, emotionalImpact: 1.1, storytelling: 1.16, layoutBalance: 1, typography: 1, colorHarmony: 1.02, luxuryFinish: 1, shareability: 1.02 },
    "Modern Editorial": { heroStrength: 1.02, emotionalImpact: 1, storytelling: 0.98, layoutBalance: 1.04, typography: 1.14, colorHarmony: 1, luxuryFinish: 0.98, shareability: 1.2 }
  };
  var EMOTIONAL_OCCASIONS = /* @__PURE__ */ new Set(["graduation", "championship", "wedding", "memorial", "military", "retirement", "family_reunion"]);
  var SOCIAL_OCCASIONS = /* @__PURE__ */ new Set(["social", "senior_night", "team", "birthday"]);
  function baseFractions(profile, brief) {
    const hero = profile.hero_photo;
    const heroScore = hero ? hero.score / 100 : 0.5;
    const heroFaces = hero ? hero.faceCount : profile.primary_subject.faceCount;
    const dom = clamp01(brief.heroStrategy.dominanceRatio || 0.5);
    const suppCount = profile.supporting_photos.length;
    const groups = profile.groups.length;
    const conf = clamp01((profile.confidence_score + brief.confidenceScore) / 2 / 100);
    const emoKeywords = Math.min(brief.emotionalDirection.keywords.length, 4) / 4;
    const colorFromPhotos = brief.colorDirection.source === "photos";
    const whitespaceGenerous = /generous|breathing/i.test(brief.compositionDirection.whitespace);
    const overcrowd = brief.riskWarnings.some((r) => r.code === "overcrowding_risk");
    const emotionalOccasion = EMOTIONAL_OCCASIONS.has(profile.occasion);
    const socialOccasion = SOCIAL_OCCASIONS.has(profile.occasion);
    const confFactor = 0.85 + 0.15 * conf;
    return {
      heroStrength: clamp01(heroScore * 0.85 + dom * 0.15),
      emotionalImpact: clamp01((0.58 + heroScore * 0.2 + emoKeywords * 0.15 + (heroFaces > 0 ? 0.1 : 0) + (emotionalOccasion ? 0.04 : 0)) * confFactor),
      storytelling: clamp01(0.6 + Math.min(suppCount, 5) / 5 * 0.3 + Math.min(groups, 3) / 3 * 0.14),
      layoutBalance: clamp01((0.76 + dom * 0.08 + (suppCount > 0 ? 0.08 : 0) + (whitespaceGenerous ? 0.06 : 0) - (overcrowd ? 0.12 : 0)) * confFactor),
      typography: clamp01(0.85 + (brief.typographyDirection ? 0.08 : 0)),
      colorHarmony: clamp01((colorFromPhotos ? 0.9 : 0.82) + 0.05),
      luxuryFinish: clamp01(0.8 + (whitespaceGenerous ? 0.04 : 0)) * confFactor,
      shareability: clamp01(0.76 + (socialOccasion ? 0.14 : 0.08) + heroScore * 0.06)
    };
  }
  function scoreConcept(concept, profile, brief) {
    const base = baseFractions(profile, brief);
    const mod = MODIFIERS[concept];
    const cats = Object.keys(MAX);
    const points = {};
    let totalRaw = 0;
    for (const c of cats) {
      const frac = clamp01(base[c] * mod[c]);
      const p = frac * MAX[c];
      points[c] = round1(p);
      totalRaw += p;
    }
    const total = Math.round(totalRaw);
    const breakdown = {
      heroStrength: points.heroStrength,
      emotionalImpact: points.emotionalImpact,
      storytelling: points.storytelling,
      layoutBalance: points.layoutBalance,
      typography: points.typography,
      colorHarmony: points.colorHarmony,
      luxuryFinish: points.luxuryFinish,
      shareability: points.shareability,
      total
    };
    const passed = total >= WOW_THRESHOLD;
    const reasons = [];
    if (!passed) {
      reasons.push(`Overall WOW Score ${total} is below the ${WOW_THRESHOLD} gate.`);
      const weakest = cats.map((c) => ({ c, ratio: points[c] / MAX[c] })).sort((a, b) => a.ratio - b.ratio).slice(0, 2);
      for (const w of weakest) {
        reasons.push(`${label(w.c)} scored ${points[w.c]}/${MAX[w.c]} \u2014 strengthen this before revealing.`);
      }
      for (const r of brief.riskWarnings) {
        if (r.severity === "warning") reasons.push(`Risk: ${r.message}`);
      }
    }
    return { breakdown, passed, reasons };
  }
  function label(c) {
    switch (c) {
      case "heroStrength":
        return "Hero Strength";
      case "emotionalImpact":
        return "Emotional Impact";
      case "storytelling":
        return "Storytelling";
      case "layoutBalance":
        return "Layout Balance";
      case "typography":
        return "Typography";
      case "colorHarmony":
        return "Color Harmony";
      case "luxuryFinish":
        return "Luxury Finish";
      case "shareability":
        return "Shareability";
    }
  }

  // ../shared/wow-engine/src/explanations.ts
  function occasionNoun(occasion) {
    const map = {
      graduation: "graduation",
      championship: "championship",
      team: "team",
      wedding: "wedding day",
      birthday: "birthday",
      baby_shower: "baby celebration",
      retirement: "retirement",
      family_reunion: "family reunion",
      church: "church milestone",
      military: "service and homecoming",
      corporate: "milestone",
      memorial: "life and legacy",
      senior_night: "senior night",
      social: "celebration",
      unknown: "celebration"
    };
    return map[occasion] ?? "celebration";
  }
  function gatheringPhrase(occasion) {
    const map = {
      graduation: "a graduation party",
      championship: "a championship celebration",
      wedding: "a wedding reception",
      birthday: "a birthday party",
      retirement: "a retirement send-off",
      family_reunion: "a family reunion",
      memorial: "a celebration of life",
      church: "a church gathering",
      senior_night: "senior night"
    };
    return map[occasion] ?? "the celebration";
  }
  function heroPhrase(profile) {
    const h2 = profile.hero_photo;
    if (!h2) return "your strongest photo";
    const name = h2.filename ? `\u201C${h2.filename}\u201D` : "your hero photo";
    return `${name} (${h2.orientation}, quality ${h2.score}/100)`;
  }
  function creativeExplanation(concept, profile, brief) {
    const occ = occasionNoun(profile.occasion);
    const emotion = brief.emotionalDirection.primary;
    const suppN = profile.supporting_photos.length;
    const heroReason = brief.heroStrategy.rationale;
    const balance = brief.compositionDirection.balance;
    const whitespace = brief.compositionDirection.whitespace;
    const accent = brief.colorDirection.accent;
    const ground = brief.colorDirection.primary;
    const s1 = `We made ${heroPhrase(profile)} the star. ${heroReason}`;
    const approach = {
      "Signature Edition": `Signature Edition centers it with ${balance} balance and ${whitespace} whitespace, framed with restraint in ${accent} on ${ground} \u2014 timeless, so this ${occ} still feels right in ten years.`,
      "Luxury Gold": `Luxury Gold lifts it into a cinematic spotlight with luxurious negative space and gold framing in ${accent}, so the ${occ} feels as big as it was.`,
      "Family Legacy": `Family Legacy arranges the memories as a warm story \u2014 anchor moments, then story builders \u2014 with room around every face, honoring the ${occ} across time.`,
      "Modern Editorial": `Modern Editorial gives it magazine-cover scale and deliberate asymmetry, with bold negative space and strong type \u2014 the ${occ}, styled like a cover.`
    };
    const s2 = approach[concept];
    const s3 = suppN > 0 ? `${suppN} supporting photo${suppN === 1 ? " was" : "s were"} chosen only because they strengthen the hero and lead the eye back to it \u2014 beauty over quantity, nothing added for its own sake.` : `We let the hero stand alone rather than pad the design \u2014 restraint over filler.`;
    const s4 = `Everything serves one feeling: ${emotion}. ${brief.emotionalDirection.statement}`;
    return [s1, s2, s3, s4].join(" ");
  }
  function purchasePsychology(concept, profile, brief, recommendedProduct) {
    const occ = occasionNoun(profile.occasion);
    const gathering = gatheringPhrase(profile.occasion);
    const audience = brief.audienceIntent.primaryAudience;
    const base = {
      "Signature Edition": `The version most families choose \u2014 timeless and universally loved. A natural centerpiece for ${gathering}.`,
      "Luxury Gold": `Best displayed as a framed keepsake; the gold reads richest at a large size, so it looks strongest at 24\xD736.`,
      "Family Legacy": `Grandparents and extended family tend to love this one. It\u2019s made to be handed down.`,
      "Modern Editorial": `Made to share \u2014 it looks strongest on a phone screen and social feed before it ever reaches a wall.`
    };
    const product = recommendedProduct ? ` Recommended as a ${recommendedProduct}.` : "";
    const forWhom = ` Made for ${audience}.`;
    return `${base[concept]}${product}${forWhom}`.replace(/\s+/g, " ").trim() + ` (${occ})`;
  }
  function sharePreview(concept, profile, brief) {
    const occ = occasionNoun(profile.occasion);
    const reverent = profile.occasion === "memorial";
    const headline = reverent ? `Honoring a life \u2014 our ${occ}.` : brief.emotionalDirection.statement;
    const caption = reverent ? `We turned our favorite photos into something worth keeping forever. \u{1F90D}` : `I can\u2019t believe this came from our photos. \u{1F62E}`;
    const altText = `A ${concept} CelebrateBanner ${occ} design, centered on the chosen hero photo${profile.supporting_photos.length ? ` with ${profile.supporting_photos.length} supporting photos` : ""}.`;
    return { headline, caption, altText };
  }

  // ../shared/wow-engine/src/concepts.ts
  var round2 = (n) => Math.round(n * 100) / 100;
  var clamp012 = (n) => n < 0 ? 0 : n > 1 ? 1 : n;
  var MAX_SUPPORTING = {
    "Signature Edition": 4,
    "Luxury Gold": 3,
    "Family Legacy": 6,
    "Modern Editorial": 4
  };
  function heroDominance(concept, brief) {
    const base = clamp012(brief.heroStrategy.dominanceRatio || 0.55);
    switch (concept) {
      case "Luxury Gold":
        return round2(Math.min(0.68, base + 0.06));
      case "Family Legacy":
        return round2(Math.max(0.45, base - 0.06));
      case "Modern Editorial":
        return round2(Math.min(0.66, base + 0.04));
      default:
        return round2(base);
    }
  }
  function layoutRecipe(concept, brief) {
    const dom = heroDominance(concept, brief);
    const maxSupporting = MAX_SUPPORTING[concept];
    switch (concept) {
      case "Signature Edition":
        return { arrangement: "Central hero with a disciplined supporting grid", heroPlacement: "centered", heroDominanceRatio: dom, supportingLayout: "symmetrical grid beneath the hero", balance: "symmetrical", whitespace: "generous margins", focalPath: "single clear centered path", maxSupporting };
      case "Luxury Gold":
        return { arrangement: "Dramatic spotlighted hero with luxurious negative space", heroPlacement: "centered, spotlit", heroDominanceRatio: dom, supportingLayout: "minimal framed supporting row", balance: "symmetrical grandeur", whitespace: "luxurious", focalPath: "spotlight leads straight to the hero", maxSupporting };
      case "Family Legacy":
        return { arrangement: "Narrative gathered-memories flow", heroPlacement: "anchored", heroDominanceRatio: dom, supportingLayout: "tiered story clusters (anchors \u2192 builders \u2192 accents)", balance: "balanced", whitespace: "warm, room around every face", focalPath: "hero first, then the journey", maxSupporting };
      case "Modern Editorial":
        return { arrangement: "Editorial asymmetry with an oversized hero", heroPlacement: "off-center", heroDominanceRatio: dom, supportingLayout: "off-grid supporting blocks", balance: "deliberate asymmetry", whitespace: "bold negative space", focalPath: "scale-led diagonal path", maxSupporting };
    }
  }
  function colorRecipe(concept, brief) {
    const d = brief.colorDirection;
    const guidance = {
      "Signature Edition": "Restrained gold on obsidian; refined, high-contrast, timeless. Gold as a hairline accent only.",
      "Luxury Gold": "Gold-forward on deep obsidian with glow accents on the hero \u2014 radiant metallic, never flooded.",
      "Family Legacy": "Warm layer within the brand core; soft, unifying, nostalgic. Gold used as gentle detail.",
      "Modern Editorial": "Sharpest contrast, a single disciplined accent; gold as highlight only."
    };
    return {
      ground: d.primary,
      accent: d.accent,
      neutral: d.neutral,
      palette: d.palette.map((p) => ({ hex: p.hex, role: p.role })),
      source: d.source,
      guidance: guidance[concept]
    };
  }
  function typographyRecipe(concept, brief) {
    const t = brief.typographyDirection;
    const spec = {
      "Signature Edition": { headline: "elegant Cormorant Garamond display, high contrast, one headline", label: "refined gold small-caps label", guidance: "Classic, confident hierarchy; distance- and print-readable." },
      "Luxury Gold": { headline: "large Cormorant Garamond in gold gradient", label: "letter-spaced small-caps gold label", guidance: "Formal and radiant; the most decorative type voice, still restrained." },
      "Family Legacy": { headline: "warm classic serif display, approachable", label: "humanist supporting labels, tasteful dates", guidance: "Heartfelt, legible; room to breathe around names." },
      "Modern Editorial": { headline: "oversized confident display, tight tracking", label: "bold sans labels; refined serif accent", guidance: "Type as composition; strong scale contrast, magazine-grade." }
    };
    const s = spec[concept];
    return { style: t.style, displayFont: t.displayFont, supportingFont: t.supportingFont, headlineTreatment: s.headline, labelTreatment: s.label, guidance: s.guidance };
  }
  function pickProduct(concept, brief) {
    const list = brief.productIntent.recommendedProducts ?? [];
    const primary = brief.productIntent.primaryProduct;
    const pref = {
      "Signature Edition": [],
      "Luxury Gold": ["Framed", "Premium"],
      "Family Legacy": ["Framed", "Premium"],
      "Modern Editorial": ["Digital", "Social"]
    };
    for (const key of pref[concept]) {
      const m = list.find((p) => p.toLowerCase().includes(key.toLowerCase()));
      if (m) return m;
    }
    return primary || list[0] || "Premium print";
  }
  function buildConcept(concept, profile, brief) {
    const layout = layoutRecipe(concept, brief);
    const supportingPhotos = profile.supporting_photos.slice(0, layout.maxSupporting);
    const recommendedProduct = pickProduct(concept, brief);
    const { breakdown, passed, reasons } = scoreConcept(concept, profile, brief);
    return {
      conceptName: concept,
      title: brief.primaryMessage.suggestion,
      subtitle: brief.secondaryMessage.suggestion,
      creativeExplanation: creativeExplanation(concept, profile, brief),
      purchasePsychology: purchasePsychology(concept, profile, brief, recommendedProduct),
      heroPhoto: profile.hero_photo,
      supportingPhotos,
      layoutRecipe: layout,
      colorRecipe: colorRecipe(concept, brief),
      typographyRecipe: typographyRecipe(concept, brief),
      recommendedProduct,
      sharePreview: sharePreview(concept, profile, brief),
      wowScore: breakdown.total,
      masterpiecePassed: passed,
      scoreBreakdown: breakdown,
      failureReasons: reasons
    };
  }

  // ../shared/wow-engine/src/engine.ts
  var ENGINE_VERSION = "0.1.0";
  function generateWOWPresentation(memoryProfile, creativeBrief, options) {
    const concepts = CONCEPT_ORDER.map(
      (name) => buildConcept(name, memoryProfile, creativeBrief)
    );
    const overallWOWScore = concepts.length ? Math.round(concepts.reduce((s, c) => s + c.wowScore, 0) / concepts.length) : 0;
    const masterpiecePassed = concepts.every((c) => c.masterpiecePassed);
    return {
      schemaVersion: SCHEMA_VERSION2,
      version: ENGINE_VERSION,
      createdAt: options?.now ?? null,
      occasion: memoryProfile.occasion,
      recommendedConcept: creativeBrief.recommendedConcept,
      masterpiecePassed,
      overallWOWScore,
      concepts
    };
  }

  // ../shared/render-orchestrator/src/types.ts
  var SCHEMA_VERSION3 = "1.0.0";
  var WOW_THRESHOLD2 = 90;

  // ../shared/render-orchestrator/src/mapper.ts
  var CONCEPT_ARRANGEMENT = {
    "Signature Edition": "classic",
    // central hero, disciplined grid
    "Luxury Gold": "pyramid",
    // grand, hero-dominant, symmetrical tiers
    "Family Legacy": "mosaic",
    // gathered memories, narrative grid
    "Modern Editorial": "magazine"
    // editorial asymmetry, hero to one side
  };
  var HERO_ZONE = {
    classic: "center",
    pyramid: "apex-top",
    mosaic: "center",
    magazine: "left"
  };
  var HERO_FRAME = {
    "Signature Edition": "thin-gold",
    "Luxury Gold": "gold",
    "Family Legacy": "soft",
    "Modern Editorial": "minimal"
  };
  function decorationTheme(occasion) {
    switch (occasion) {
      case "championship":
      case "team":
      case "senior_night":
        return "stadium";
      case "wedding":
        return "floral";
      case "memorial":
        return "reverent";
      case "graduation":
        return "graduation";
      default:
        return "obsidian";
    }
  }
  function orientationFor(occasion) {
    if (occasion === "team") return "landscape";
    if (occasion === "social") return "square";
    return "portrait";
  }
  function conceptArrangement(name) {
    return CONCEPT_ARRANGEMENT[name];
  }
  function buildRenderInstructions(concept, brief, profile) {
    const arrangement = conceptArrangement(concept.conceptName);
    const layout = concept.layoutRecipe;
    const color = concept.colorRecipe;
    const type = concept.typographyRecipe;
    const isLuxury = concept.conceptName === "Luxury Gold";
    const isMagazine = arrangement === "magazine";
    const heroPlacement = {
      zone: HERO_ZONE[arrangement],
      dominanceRatio: layout.heroDominanceRatio,
      frame: HERO_FRAME[concept.conceptName],
      spotlight: isLuxury,
      protectFace: true
      // Design Bible: never crop through faces
    };
    const supportingPlacement = {
      arrangement,
      maxCells: layout.maxSupporting,
      count: Math.min(layout.maxSupporting, concept.supportingPhotos.length),
      gapRatio: 0.02,
      treatment: "Unified grade; smaller and quieter; lead the eye back to the hero."
    };
    const typographyPlacement = {
      titleZone: isMagazine ? "left-top" : "top-center",
      subtitleZone: isMagazine ? "left-top-under-title" : "top-center-under-title",
      alignment: isMagazine ? "left" : "center",
      displayFont: type.displayFont,
      supportingFont: type.supportingFont,
      headlineTreatment: type.headlineTreatment,
      labelTreatment: type.labelTreatment
    };
    const backgroundSelection = {
      style: isLuxury ? "obsidian-gold-glow" : "obsidian-gradient",
      decorationTheme: decorationTheme(profile.occasion),
      vignette: true
    };
    const colorPalette = {
      ground: color.ground,
      accent: color.accent,
      neutral: color.neutral,
      palette: color.palette.map((p) => ({ hex: p.hex, role: p.role })),
      source: color.source
    };
    const decorativeElements = Array.isArray(brief.decorativeDirection.allowed) ? brief.decorativeDirection.allowed.slice(0, 8).map((s) => String(s)) : [];
    const spacing = {
      marginRatio: 0.055,
      gapRatio: 0.02,
      whitespace: brief.compositionDirection.whitespace
    };
    const layering = {
      order: ["background", "decorations", "supporting-photos", "hero-photo", "title-text", "preview-overlay"]
    };
    return {
      arrangement,
      heroPlacement,
      supportingPlacement,
      typographyPlacement,
      backgroundSelection,
      colorPalette,
      decorativeElements,
      spacing,
      layering
    };
  }
  var px = (inches, dpi) => Math.round(inches * dpi);
  function buildExportTargets(profile) {
    const dpi = 300;
    const orientation = orientationFor(profile.occasion);
    const dims = (shortIn, longIn) => {
      if (orientation === "landscape") return { w: longIn, h: shortIn };
      if (orientation === "square") return { w: longIn, h: longIn };
      return { w: shortIn, h: longIn };
    };
    const target = (id, label2, product, shortIn, longIn, opts) => {
      const { w, h: h2 } = dims(shortIn, longIn);
      return {
        id,
        label: label2,
        product,
        widthIn: w,
        heightIn: h2,
        dpi,
        widthPx: px(w, dpi),
        heightPx: px(h2, dpi),
        bleedIn: 0.125,
        safeMarginIn: 0.25,
        colorMode: opts.colorMode,
        formats: opts.formats,
        orientation,
        framed: !!opts.framed,
        matte: !!opts.matte,
        note: opts.note
      };
    };
    return [
      target("digital", "Digital Download", "Digital download", 24, 36, {
        colorMode: "RGB",
        formats: ["jpg", "pdf"],
        note: "Print-ready master file for instant download; render once at full resolution."
      }),
      target("poster_18x24", "18\xD724 Poster", "Standard print", 18, 24, {
        colorMode: "CMYK",
        formats: ["pdf", "jpg"],
        note: "Small poster print; CMYK at 300 DPI with bleed + safe margin."
      }),
      target("poster_24x36", "24\xD736 Poster", "Premium print", 24, 36, {
        colorMode: "CMYK",
        formats: ["pdf", "jpg"],
        note: "Flagship poster print; CMYK at 300 DPI with bleed + safe margin."
      }),
      target("framed_24x36", "Framed Edition", "Framed", 24, 36, {
        colorMode: "CMYK",
        formats: ["pdf", "jpg"],
        framed: true,
        matte: true,
        note: "Framed keepsake; same 24\xD736 print inside a mat + frame (frame color chosen after checkout)."
      })
    ];
  }

  // ../shared/render-orchestrator/src/validator.ts
  var REQUIRED_TARGETS = ["digital", "poster_18x24", "poster_24x36", "framed_24x36"];
  function layoutComplete(l) {
    if (!l) return false;
    const strOk = [l.arrangement, l.heroPlacement, l.supportingLayout, l.balance, l.whitespace, l.focalPath].every((v) => typeof v === "string" && v.length > 0);
    const dom = l.heroDominanceRatio;
    const domOk = typeof dom === "number" && dom > 0 && dom <= 1;
    const maxOk = typeof l.maxSupporting === "number" && l.maxSupporting >= 0;
    return strOk && domOk && maxOk;
  }
  function typographyComplete(t) {
    if (!t) return false;
    return [t.style, t.displayFont, t.supportingFont, t.headlineTreatment, t.labelTreatment].every((v) => typeof v === "string" && v.length > 0);
  }
  function targetsDefined(targets) {
    if (!Array.isArray(targets) || targets.length === 0) return false;
    const ids = new Set(targets.map((t) => t.id));
    const allPresent = REQUIRED_TARGETS.every((id) => ids.has(id));
    const allSized = targets.every((t) => t.widthPx > 0 && t.heightPx > 0 && t.dpi > 0);
    return allPresent && allSized;
  }
  function validate(concept, exportTargets) {
    const reasons = [];
    if (!concept) {
      return {
        passed: false,
        heroPhoto: false,
        supportingPhotos: false,
        wowScore: false,
        masterpiecePassed: false,
        layoutRecipeComplete: false,
        typographyRecipeComplete: false,
        exportTargetsDefined: targetsDefined(exportTargets),
        reasons: ["Concept not found in the WOW presentation."]
      };
    }
    const heroPhoto = concept.heroPhoto != null;
    const supportingPhotos = Array.isArray(concept.supportingPhotos) && concept.supportingPhotos.length >= 1;
    const wowScore = typeof concept.wowScore === "number" && concept.wowScore >= WOW_THRESHOLD2;
    const masterpiecePassed = concept.masterpiecePassed === true;
    const layoutRecipeComplete = layoutComplete(concept.layoutRecipe);
    const typographyRecipeComplete = typographyComplete(concept.typographyRecipe);
    const exportTargetsDefined = targetsDefined(exportTargets);
    if (!heroPhoto) reasons.push("Hero photo is missing \u2014 every concept must be anchored by a hero.");
    if (!supportingPhotos) reasons.push("No supporting photos \u2014 at least one is required.");
    if (!wowScore) reasons.push(`WOW Score ${concept.wowScore} is below the ${WOW_THRESHOLD2} gate.`);
    if (!masterpiecePassed) reasons.push("Concept did not pass the Masterpiece gate.");
    if (!layoutRecipeComplete) reasons.push("Layout recipe is incomplete.");
    if (!typographyRecipeComplete) reasons.push("Typography recipe is incomplete.");
    if (!exportTargetsDefined) reasons.push("Export targets are not fully defined.");
    const passed = heroPhoto && supportingPhotos && wowScore && masterpiecePassed && layoutRecipeComplete && typographyRecipeComplete && exportTargetsDefined;
    return {
      passed,
      heroPhoto,
      supportingPhotos,
      wowScore,
      masterpiecePassed,
      layoutRecipeComplete,
      typographyRecipeComplete,
      exportTargetsDefined,
      reasons
    };
  }

  // ../shared/render-orchestrator/src/engine.ts
  var ENGINE_VERSION2 = "0.1.0";
  function emptyInstructions() {
    return {
      arrangement: "classic",
      heroPlacement: { zone: "center", dominanceRatio: 0, frame: "thin-gold", spotlight: false, protectFace: true },
      supportingPlacement: { arrangement: "classic", maxCells: 0, count: 0, gapRatio: 0.02, treatment: "" },
      typographyPlacement: { titleZone: "top-center", subtitleZone: "top-center-under-title", alignment: "center", displayFont: "", supportingFont: "", headlineTreatment: "", labelTreatment: "" },
      backgroundSelection: { style: "obsidian-gradient", decorationTheme: "obsidian", vignette: true },
      colorPalette: { ground: "", accent: "", neutral: "", palette: [], source: "occasion-default" },
      decorativeElements: [],
      spacing: { marginRatio: 0.055, gapRatio: 0.02, whitespace: "" },
      layering: { order: ["background", "decorations", "supporting-photos", "hero-photo", "title-text", "preview-overlay"] }
    };
  }
  function generateRenderPlan(memoryProfile, creativeBrief, wowPresentation, options) {
    const targetName = options?.conceptName ?? wowPresentation.recommendedConcept;
    const concept = wowPresentation.concepts.find((c) => c.conceptName === targetName);
    const exportTargets = buildExportTargets(memoryProfile);
    const qualityChecks = validate(concept, exportTargets);
    const renderInstructions = concept ? buildRenderInstructions(concept, creativeBrief, memoryProfile) : emptyInstructions();
    return {
      schemaVersion: SCHEMA_VERSION3,
      version: ENGINE_VERSION2,
      createdAt: options?.now ?? null,
      occasion: memoryProfile.occasion,
      conceptName: targetName,
      accepted: qualityChecks.passed,
      heroPhoto: concept ? concept.heroPhoto : null,
      supportingPhotos: concept ? concept.supportingPhotos : [],
      layoutRecipe: concept ? concept.layoutRecipe : emptyLayout(),
      colorRecipe: concept ? concept.colorRecipe : emptyColor(),
      typographyRecipe: concept ? concept.typographyRecipe : emptyType(),
      renderInstructions,
      exportTargets,
      qualityChecks
    };
  }
  function emptyLayout() {
    return { arrangement: "", heroPlacement: "", heroDominanceRatio: 0, supportingLayout: "", balance: "", whitespace: "", focalPath: "", maxSupporting: 0 };
  }
  function emptyColor() {
    return { ground: "", accent: "", neutral: "", palette: [], source: "occasion-default", guidance: "" };
  }
  function emptyType() {
    return { style: "", displayFont: "", supportingFont: "", headlineTreatment: "", labelTreatment: "", guidance: "" };
  }

  // ../shared/art-direction-engine/src/types.ts
  var SCHEMA_VERSION4 = "1.0.0";

  // ../shared/art-direction-engine/src/philosophy.ts
  var IDENTITIES = {
    "Signature Edition": {
      philosophy: {
        thesis: "A luxury museum print \u2014 symmetry, restraint, and quiet confidence.",
        balance: "symmetrical",
        visualHierarchy: ["hero portrait", "title", "supporting grid", "gold hairline"],
        focalPath: "A single centred axis: the eye lands on the hero and stays."
      },
      whitespace: { level: "generous", marginRatio: 0.075, gutterRatio: 0.022, rationale: "Gallery margins let the hero breathe; nothing crowds the frame." },
      heroDominanceBase: 0.68,
      framingStyle: "museum",
      heroSpotlight: false,
      heroCinematic: true,
      heroFrame: "thin-gold",
      supporting: { count: 4, cadence: "even", aspect: 1, gapRatio: 0.022, rationale: "Four evenly weighted memories \u2014 a disciplined predella beneath the hero." },
      typography: {
        style: "museum serif",
        displayFont: "Cormorant Garamond",
        supportingFont: "Outfit",
        displayScale: 1,
        tracking: "0.01em",
        casing: "title",
        alignment: "center",
        headlineTreatment: "Centred display serif with generous leading",
        labelTreatment: "Small caps, wide tracking, muted"
      },
      palette: { ground: "#0C0E14", accent: "#C9A84C", neutral: "#FAF8F3", rationale: "Obsidian ground, champagne gold used sparingly, ivory type." },
      luxuryLevel: 88,
      emotionalIntensity: 62,
      treatment: { grade: { contrast: 1.02, saturate: 0.98, brightness: 1 }, vignette: 0.18, heroFrame: "thin-gold", supportingAspect: 1, cinematicHero: true }
    },
    "Luxury Gold": {
      philosophy: {
        thesis: "High-end editorial \u2014 fashion-magazine drama, gold at full voice.",
        balance: "editorial",
        visualHierarchy: ["spotlit hero", "oversized title", "gold accents", "few supporting"],
        focalPath: "A spotlight pulls the eye to the hero, then the gold carries it down."
      },
      whitespace: { level: "dramatic", marginRatio: 0.055, gutterRatio: 0.018, rationale: "Tight margins press the drama toward the edges of the page." },
      heroDominanceBase: 0.66,
      framingStyle: "cinematic",
      heroSpotlight: true,
      heroCinematic: true,
      heroFrame: "gold",
      supporting: { count: 3, cadence: "sparse", aspect: 1, gapRatio: 0.018, rationale: "Only three supporting frames \u2014 scarcity is what makes the hero feel expensive." },
      typography: {
        style: "editorial display",
        displayFont: "Cormorant Garamond",
        supportingFont: "Outfit",
        displayScale: 1.18,
        tracking: "0.04em",
        casing: "upper",
        alignment: "center",
        headlineTreatment: "Oversized display caps with wide tracking",
        labelTreatment: "Gold small caps"
      },
      palette: { ground: "#0A0A0A", accent: "#E8C97A", neutral: "#FFFFFF", rationale: "Near-black ground, bright gold at full saturation, pure white type." },
      luxuryLevel: 96,
      emotionalIntensity: 70,
      treatment: { grade: { contrast: 1.18, saturate: 1.05, brightness: 0.96 }, vignette: 0.38, heroFrame: "gold", supportingAspect: 1, cinematicHero: true }
    },
    "Family Legacy": {
      philosophy: {
        thesis: "Emotional storytelling \u2014 a layered photo journey, family first.",
        balance: "layered",
        visualHierarchy: ["hero", "story of supporting photos", "warm ground", "title"],
        focalPath: "The hero anchors, then the eye walks the story left to right."
      },
      whitespace: { level: "controlled", marginRatio: 0.05, gutterRatio: 0.026, rationale: "Closer spacing gathers the memories together, like photographs on a mantel." },
      heroDominanceBase: 0.58,
      framingStyle: "intimate",
      heroSpotlight: false,
      heroCinematic: false,
      heroFrame: "soft",
      supporting: { count: 6, cadence: "journey", aspect: 1, gapRatio: 0.026, rationale: "Six memories in narrative order \u2014 the story matters as much as the hero." },
      typography: {
        style: "warm humanist",
        displayFont: "Cormorant Garamond",
        supportingFont: "Outfit",
        displayScale: 0.94,
        tracking: "0.005em",
        casing: "title",
        alignment: "center",
        headlineTreatment: "Softer display serif, tighter leading",
        labelTreatment: "Warm sentence case"
      },
      palette: { ground: "#1A1410", accent: "#C98B4C", neutral: "#F5EDE2", rationale: "Warm brown-black ground, amber accent, cream type \u2014 a family album." },
      luxuryLevel: 74,
      emotionalIntensity: 92,
      treatment: { grade: { contrast: 1.04, saturate: 1.08, brightness: 1.02 }, vignette: 0.22, heroFrame: "soft", supportingAspect: 1, cinematicHero: false }
    },
    "Modern Editorial": {
      philosophy: {
        thesis: "A magazine cover \u2014 negative space, a large headline, nothing spare.",
        balance: "asymmetrical",
        visualHierarchy: ["headline", "off-centre hero", "negative space", "two supporting"],
        focalPath: "The headline enters first, the hero answers it from the left."
      },
      whitespace: { level: "expansive", marginRatio: 0.09, gutterRatio: 0.03, rationale: "Negative space is the subject: the emptiness is what reads as contemporary." },
      heroDominanceBase: 0.62,
      framingStyle: "editorial",
      heroSpotlight: false,
      heroCinematic: false,
      heroFrame: "minimal",
      supporting: { count: 3, cadence: "crescendo", aspect: 1, gapRatio: 0.03, rationale: "Three frames, generously spaced \u2014 restraint is the whole point." },
      typography: {
        style: "contemporary minimal",
        displayFont: "Cormorant Garamond",
        supportingFont: "Outfit",
        displayScale: 1.12,
        tracking: "-0.01em",
        casing: "title",
        alignment: "left",
        headlineTreatment: "Large left-aligned display with tight tracking",
        labelTreatment: "Uppercase micro-labels"
      },
      palette: { ground: "#101216", accent: "#FAF8F3", neutral: "#9AA0A6", rationale: "Cool ink ground, ivory as the accent, grey type \u2014 light is the accent, not gold." },
      luxuryLevel: 80,
      emotionalIntensity: 54,
      treatment: { grade: { contrast: 1.1, saturate: 0.8, brightness: 1.04 }, vignette: 0.1, heroFrame: "minimal", supportingAspect: 1, cinematicHero: false }
    }
  };
  function clampHeroDominance(value, floor = 0.55, ceiling = 0.7) {
    if (!Number.isFinite(value)) return floor;
    return Math.min(ceiling, Math.max(floor, Math.round(value * 1e3) / 1e3));
  }
  function heroEmphasisFor(name, briefDominance) {
    const id = IDENTITIES[name];
    const brief = Number.isFinite(briefDominance) ? briefDominance : 0.5;
    const dominanceRatio = clampHeroDominance(id.heroDominanceBase + (brief - 0.5) * 0.1);
    return {
      dominanceRatio,
      framing: id.framingStyle,
      spotlight: id.heroSpotlight,
      cinematic: id.heroCinematic,
      frame: id.heroFrame,
      fillsFrame: true
    };
  }

  // ../shared/art-direction-engine/src/story.ts
  var STORY_BEATS = {
    graduation: ["portrait", "diploma", "parents", "friends", "celebration", "cake"],
    championship: ["portrait", "action", "team", "trophy", "celebration", "crowd"],
    team: ["portrait", "action", "team", "trophy", "celebration", "crowd"],
    wedding: ["portrait", "ceremony", "rings", "family", "celebration", "cake"],
    family_reunion: ["portrait", "generations", "parents", "children", "gathering", "feast"],
    memorial: ["portrait", "younger-years", "family", "friends", "legacy", "remembrance"]
  };
  var DEFAULT_BEATS = ["portrait", "moment", "family", "friends", "celebration", "detail"];
  var BEAT_KEYWORDS = {
    portrait: ["portrait", "headshot", "solo", "senior"],
    // NOT 'cap'/'gown': graduation attire appears in many photos
    diploma: ["diploma", "certificate", "scroll", "stage", "walk", "handshake"],
    parents: ["parents", "mom", "mother", "dad", "father", "mum", "family"],
    friends: ["friends", "classmates", "squad", "crew", "buddies"],
    celebration: ["celebration", "party", "cheer", "toss", "confetti", "hug", "jump", "cap toss"],
    cake: ["cake", "dessert", "toast", "champagne", "cupcake"],
    action: ["action", "play", "game", "match", "shot", "run"],
    team: ["team", "squad", "lineup", "huddle"],
    trophy: ["trophy", "medal", "cup", "award", "banner"],
    crowd: ["crowd", "stands", "fans", "stadium"],
    ceremony: ["ceremony", "vows", "aisle", "altar"],
    rings: ["rings", "ring", "bands"],
    family: ["family", "relatives", "kin"],
    generations: ["generations", "grandma", "grandpa", "grandparents"],
    children: ["children", "kids", "cousins"],
    gathering: ["gathering", "reunion", "group"],
    feast: ["feast", "dinner", "meal", "table"],
    "younger-years": ["young", "vintage", "archive", "old"],
    legacy: ["legacy", "tribute"],
    remembrance: ["remembrance", "memorial", "candle", "flowers"],
    moment: [],
    detail: ["detail", "closeup", "macro"]
  };
  function beatsForOccasion(occasion, override) {
    if (override && override.length) return override;
    return STORY_BEATS[occasion] ?? DEFAULT_BEATS;
  }
  function classifyPhoto(photo, beats) {
    const name = String(photo.filename ?? "").toLowerCase();
    for (const beat of beats) {
      const keys = BEAT_KEYWORDS[beat] ?? [];
      const hit = keys.find((k) => name.includes(k));
      if (hit) return { beat, reason: `Filename mentions \u201C${hit}\u201D.` };
    }
    const faces = typeof photo.faceCount === "number" ? photo.faceCount : 0;
    if (faces === 1 && beats.includes("portrait")) return { beat: "portrait", reason: "A single subject reads as a portrait." };
    if (faces >= 4 && beats.includes("friends")) return { beat: "friends", reason: `${faces} faces read as a group of friends.` };
    if (faces >= 2 && beats.includes("parents")) return { beat: "parents", reason: `${faces} faces read as family.` };
    if (faces >= 2 && beats.includes("family")) return { beat: "family", reason: `${faces} faces read as family.` };
    return { beat: "unplaced", reason: "No narrative cue \u2014 kept in the customer\u2019s original order." };
  }
  function orderPhotoStory(photos, occasion, override) {
    const beats = beatsForOccasion(occasion, override);
    const list = Array.isArray(photos) ? photos.filter(Boolean) : [];
    const tagged = list.map((photo, index) => {
      const { beat, reason } = classifyPhoto(photo, beats);
      const rank = beat === "unplaced" ? beats.length : beats.indexOf(beat);
      return { photo, index, beat, reason, rank: rank < 0 ? beats.length : rank };
    });
    tagged.sort((a, b) => a.rank - b.rank || a.index - b.index);
    return {
      ordered: tagged.map((t) => t.photo),
      flow: tagged.map((t) => ({ photoId: t.photo.photoId, beat: t.beat, reason: t.reason }))
    };
  }

  // ../shared/art-direction-engine/src/copy.ts
  var SENTIMENT = {
    graduation: {
      "Signature Edition": "The years of work, framed with the calm of a gallery wall.",
      "Luxury Gold": "A milestone worth every ounce of gold on the page.",
      "Family Legacy": "The whole journey \u2014 not just the moment it ended.",
      "Modern Editorial": "Achievement, stated plainly, with nothing in the way."
    },
    championship: {
      "Signature Edition": "The season distilled into one composed, permanent image.",
      "Luxury Gold": "The trophy light, held on the page long after the whistle.",
      "Family Legacy": "Every practice, every ride home, gathered in one story.",
      "Modern Editorial": "Victory, stripped to its cleanest possible line."
    },
    wedding: {
      "Signature Edition": "A day of promises, given the stillness it deserves.",
      "Luxury Gold": "The glow of the evening, kept at full brightness.",
      "Family Legacy": "Two families, one page, in the order the day unfolded.",
      "Modern Editorial": "Love, edited down to what actually matters."
    },
    memorial: {
      "Signature Edition": "A life, held quietly and with great care.",
      "Luxury Gold": "A brightness that refuses to dim.",
      "Family Legacy": "The story told the way the family remembers it.",
      "Modern Editorial": "Presence, honoured with restraint."
    }
  };
  var DEFAULT_SENTIMENT = {
    "Signature Edition": "A moment worth keeping, composed like a gallery print.",
    "Luxury Gold": "A moment worth keeping, lit like a magazine cover.",
    "Family Legacy": "A moment worth keeping, told as the story it really was.",
    "Modern Editorial": "A moment worth keeping, with nothing in the way."
  };
  function emotionalSentence(name, occasion) {
    return SENTIMENT[occasion] && SENTIMENT[occasion][name] || DEFAULT_SENTIMENT[name];
  }
  var pct = (n) => `${Math.round(n * 100)}%`;
  function bulletsFor(d) {
    const heroPct = pct(d.hero.dominanceRatio);
    switch (d.conceptName) {
      case "Signature Edition":
        return [
          "Symmetrical museum composition",
          `Hero commands ${heroPct} of the frame`,
          "Champagne gold, used sparingly"
        ];
      case "Luxury Gold":
        return [
          "High-contrast editorial drama",
          `Spotlit hero at ${heroPct} of the frame`,
          `Only ${d.supporting.count} supporting frames \u2014 scarcity reads as luxury`
        ];
      case "Family Legacy":
        return [
          `A ${d.supporting.count}-photo journey, in story order`,
          `Warm hierarchy, hero at ${heroPct}`,
          "Amber and cream \u2014 the palette of a family album"
        ];
      case "Modern Editorial":
        return [
          "Magazine-cover negative space",
          `Off-centre hero at ${heroPct}`,
          "Restrained, contemporary palette \u2014 light is the accent"
        ];
    }
  }
  function copyFor(d, occasion) {
    return {
      title: d.conceptName,
      emotionalSentence: emotionalSentence(d.conceptName, occasion),
      bullets: bulletsFor(d)
    };
  }

  // ../shared/art-direction-engine/src/engine.ts
  var clone = (v) => structuredClone(v);
  function directionFor(concept, brief, occasion, options) {
    const name = concept.conceptName;
    const id = IDENTITIES[name];
    const hero = heroEmphasisFor(name, brief.heroStrategy?.dominanceRatio ?? 0.5);
    const story = orderPhotoStory(concept.supportingPhotos, occasion, options.beats);
    const supporting = { ...id.supporting, count: Math.min(id.supporting.count, story.ordered.length || id.supporting.count) };
    const partial = {
      conceptName: name,
      philosophy: id.philosophy,
      whitespace: id.whitespace,
      hero,
      supporting,
      typography: id.typography,
      palette: id.palette,
      luxuryLevel: id.luxuryLevel,
      emotionalIntensity: id.emotionalIntensity,
      framingStyle: id.framingStyle,
      storytellingFlow: story.flow,
      treatment: { ...id.treatment, heroFrame: hero.frame, supportingAspect: id.supporting.aspect, cinematicHero: hero.cinematic }
    };
    return { ...partial, copy: copyFor(partial, occasion) };
  }
  function applyDirection(concept, d, occasion, options) {
    const out = clone(concept);
    const story = orderPhotoStory(concept.supportingPhotos, occasion, options.beats);
    out.supportingPhotos = story.ordered;
    out.layoutRecipe = {
      ...out.layoutRecipe,
      arrangement: d.philosophy.thesis,
      heroPlacement: `${d.hero.framing} framing, fills the frame`,
      heroDominanceRatio: d.hero.dominanceRatio,
      // always 0.55–0.70
      supportingLayout: `${d.supporting.cadence} rhythm of ${d.supporting.count}`,
      balance: d.philosophy.balance,
      whitespace: `${d.whitespace.level} \u2014 ${d.whitespace.rationale}`,
      focalPath: d.philosophy.focalPath,
      maxSupporting: d.supporting.count
      // rhythm: how many are drawn
    };
    out.colorRecipe = {
      ...out.colorRecipe,
      ground: d.palette.ground,
      accent: d.palette.accent,
      neutral: d.palette.neutral,
      palette: [
        { hex: d.palette.ground, role: "ground" },
        { hex: d.palette.accent, role: "accent" },
        { hex: d.palette.neutral, role: "neutral" }
      ],
      guidance: d.palette.rationale
    };
    out.typographyRecipe = {
      ...out.typographyRecipe,
      style: d.typography.style,
      displayFont: d.typography.displayFont,
      supportingFont: d.typography.supportingFont,
      headlineTreatment: d.typography.headlineTreatment,
      labelTreatment: d.typography.labelTreatment,
      guidance: `${d.philosophy.thesis} Alignment ${d.typography.alignment}, tracking ${d.typography.tracking}.`
    };
    return out;
  }
  function directArt(memoryProfile, creativeBrief, wowPresentation, options = {}) {
    const occasion = String(memoryProfile.occasion ?? "unknown");
    const directions = wowPresentation.concepts.filter((c) => IDENTITIES[c.conceptName]).map((c) => directionFor(c, creativeBrief, occasion, options));
    const byName = new Map(directions.map((d) => [d.conceptName, d]));
    const presentation = clone(wowPresentation);
    presentation.concepts = presentation.concepts.map((c) => {
      const d = byName.get(c.conceptName);
      return d ? applyDirection(c, d, occasion, options) : c;
    });
    return { schemaVersion: SCHEMA_VERSION4, occasion, directions, presentation };
  }

  // demo/pipeline.ts
  function runPipeline(memoryProfile) {
    const creativeBrief = generateCreativeBrief(memoryProfile);
    const rawPresentation = generateWOWPresentation(memoryProfile, creativeBrief);
    const artDirection = directArt(memoryProfile, creativeBrief, rawPresentation);
    const wowPresentation = artDirection.presentation;
    const renderPlan = generateRenderPlan(memoryProfile, creativeBrief, wowPresentation);
    return { memoryProfile, creativeBrief, wowPresentation, artDirection, renderPlan };
  }
  function renderPlanForConcept(result, conceptName) {
    return generateRenderPlan(result.memoryProfile, result.creativeBrief, result.wowPresentation, { conceptName });
  }

  // ../shared/render-engine/src/canvas/helpers.ts
  function roundRect(ctx, x, y, w, h2, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h2, r);
    ctx.arcTo(x + w, y + h2, x, y + h2, r);
    ctx.arcTo(x, y + h2, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  function drawCover(ctx, img, x, y, w, h2) {
    if (!img) return;
    const iw = img.naturalWidth ?? img.width ?? 1;
    const ih = img.naturalHeight ?? img.height ?? 1;
    const rotDeg = ((img._rotDeg ?? 0) % 360 + 360) % 360;
    const swap = rotDeg === 90 || rotDeg === 270;
    const effW = swap ? ih : iw;
    const effH = swap ? iw : ih;
    const coverScale = Math.max(w / effW, h2 / effH);
    const containScale = Math.min(w / effW, h2 / effH);
    const cropRatio2 = coverScale / containScale;
    const useContain = img._useContain === true || cropRatio2 > 1.55;
    const scale = useContain ? containScale : coverScale;
    const dw = iw * scale;
    const dh = ih * scale;
    const cx = x + w / 2;
    const cy = y + h2 / 2;
    ctx.save();
    ctx.translate(cx, cy);
    if (rotDeg) ctx.rotate(rotDeg * Math.PI / 180);
    ctx.drawImage(img, 0, 0, iw, ih, -dw / 2, -dh / 2, dw, dh);
    ctx.restore();
  }
  function lightenHex(hex, amt) {
    const m = /^#([0-9a-f]{6})$/i.exec(hex || "");
    if (!m) return hex;
    const n = parseInt(m[1], 16);
    let r = n >> 16 & 255;
    let g = n >> 8 & 255;
    let b = n & 255;
    r = Math.min(255, r + amt);
    g = Math.min(255, g + amt);
    b = Math.min(255, b + amt);
    return "#" + (r << 16 | g << 8 | b).toString(16).padStart(6, "0");
  }
  function hexToRgba(hex, alpha) {
    const m = /^#([0-9a-f]{6})$/i.exec(hex || "");
    if (!m) return hex;
    const n = parseInt(m[1], 16);
    return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${alpha})`;
  }
  function tileToCount(base, count) {
    const out = [];
    if (!base || base.length === 0) return out;
    for (let i = 0; i < count; i++) out.push({ ...base[i % base.length] });
    return out;
  }

  // ../shared/render-engine/src/frames/registry.ts
  var REGISTRY = /* @__PURE__ */ new Map();
  function registerFrame(renderer) {
    REGISTRY.set(renderer.id, renderer);
  }
  function getFrame(id) {
    const r = REGISTRY.get(id ?? "rounded");
    return r ?? REGISTRY.get("rounded");
  }

  // ../shared/render-engine/src/frames/rounded.ts
  var RoundedFrame = {
    id: "rounded",
    label: "Rounded",
    draw(ctx, img, x, y, w, h2, withShadow) {
      if (withShadow) {
        ctx.save();
        ctx.shadowColor = "rgba(0,0,0,0.45)";
        ctx.shadowBlur = 18;
        ctx.shadowOffsetY = 8;
        ctx.fillStyle = "#000";
        roundRect(ctx, x, y, w, h2, 12);
        ctx.fill();
        ctx.restore();
      }
      ctx.save();
      roundRect(ctx, x, y, w, h2, 12);
      ctx.clip();
      drawCover(ctx, img, x, y, w, h2);
      ctx.restore();
    }
  };
  registerFrame(RoundedFrame);

  // ../shared/render-engine/src/canvas/paths.ts
  function hexPath(ctx, x, y, w, h2) {
    const size = Math.min(w, h2);
    const cx = x + w / 2;
    const cy = y + h2 / 2;
    const rx = size / 2;
    const ry = size / 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy - ry);
    ctx.lineTo(cx + rx, cy - ry / 2);
    ctx.lineTo(cx + rx, cy + ry / 2);
    ctx.lineTo(cx, cy + ry);
    ctx.lineTo(cx - rx, cy + ry / 2);
    ctx.lineTo(cx - rx, cy - ry / 2);
    ctx.closePath();
  }
  function diamondPath(ctx, x, y, w, h2) {
    const cx = x + w / 2;
    const cy = y + h2 / 2;
    const s = Math.min(w, h2) / 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy - s);
    ctx.lineTo(cx + s, cy);
    ctx.lineTo(cx, cy + s);
    ctx.lineTo(cx - s, cy);
    ctx.closePath();
  }
  function scallopPath(ctx, cx, cy, r) {
    const lobes = 14;
    const bump = r * 0.07;
    ctx.beginPath();
    for (let deg = 0; deg <= 360; deg += 1) {
      const a = deg * Math.PI / 180;
      const rr = r - bump + bump * Math.cos(lobes * a);
      const px2 = cx + Math.cos(a) * rr;
      const py = cy + Math.sin(a) * rr;
      if (deg === 0) ctx.moveTo(px2, py);
      else ctx.lineTo(px2, py);
    }
    ctx.closePath();
  }
  function heartPath(ctx, x, y, w, h2) {
    const cx = x + w / 2;
    const cy = y + h2 / 2;
    const s = Math.min(w, h2) * 0.5;
    ctx.beginPath();
    ctx.moveTo(cx, cy + s * 0.65);
    ctx.bezierCurveTo(cx - s * 1, cy + s * 0.1, cx - s * 0.7, cy - s * 0.85, cx, cy - s * 0.25);
    ctx.bezierCurveTo(cx + s * 0.7, cy - s * 0.85, cx + s * 1, cy + s * 0.1, cx, cy + s * 0.65);
    ctx.closePath();
  }
  function starPath(ctx, x, y, w, h2) {
    const cx = x + w / 2;
    const cy = y + h2 / 2;
    const outer = Math.min(w, h2) / 2;
    const inner = outer * 0.45;
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = i / 10 * Math.PI * 2 - Math.PI / 2;
      const r = i % 2 === 0 ? outer : inner;
      const px2 = cx + Math.cos(a) * r;
      const py = cy + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px2, py);
      else ctx.lineTo(px2, py);
    }
    ctx.closePath();
  }

  // ../shared/render-engine/src/frames/shapes.ts
  function withDrop(ctx, blur, off, pathFn) {
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.45)";
    ctx.shadowBlur = blur;
    ctx.shadowOffsetY = off;
    ctx.fillStyle = "#000";
    pathFn();
    ctx.fill();
    ctx.restore();
  }
  function withGoldOutline(ctx, lineWidth, pathFn) {
    ctx.save();
    ctx.strokeStyle = "rgba(201,168,76,0.9)";
    ctx.lineWidth = lineWidth;
    pathFn();
    ctx.stroke();
    ctx.restore();
  }
  var CircleFrame = {
    id: "circle",
    label: "Circle",
    draw(ctx, img, x, y, w, h2, withShadow) {
      const cx = x + w / 2;
      const cy = y + h2 / 2;
      const r = Math.min(w, h2) / 2;
      const p = () => {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
      };
      if (withShadow) withDrop(ctx, 18, 8, p);
      ctx.save();
      p();
      ctx.clip();
      drawCover(ctx, img, cx - r, cy - r, r * 2, r * 2);
      ctx.restore();
    }
  };
  var HexagonFrame = {
    id: "hexagon",
    label: "Hexagon",
    draw(ctx, img, x, y, w, h2, withShadow) {
      const size = Math.min(w, h2);
      const p = () => hexPath(ctx, x, y, w, h2);
      if (withShadow) withDrop(ctx, 18, 8, p);
      ctx.save();
      p();
      ctx.clip();
      drawCover(ctx, img, x + (w - size) / 2, y + (h2 - size) / 2, size, size);
      ctx.restore();
      withGoldOutline(ctx, 2, p);
    }
  };
  var DiamondFrame = {
    id: "diamond",
    label: "Diamond",
    draw(ctx, img, x, y, w, h2, withShadow) {
      const cx = x + w / 2;
      const cy = y + h2 / 2;
      const s = Math.min(w, h2) / 2;
      const p = () => diamondPath(ctx, x, y, w, h2);
      if (withShadow) withDrop(ctx, 18, 8, p);
      ctx.save();
      p();
      ctx.clip();
      drawCover(ctx, img, cx - s, cy - s, s * 2, s * 2);
      ctx.restore();
      withGoldOutline(ctx, 2, p);
    }
  };
  var ScallopFrame = {
    id: "scallop",
    label: "Scallop",
    draw(ctx, img, x, y, w, h2, withShadow) {
      const cx = x + w / 2;
      const cy = y + h2 / 2;
      const r = Math.min(w, h2) / 2;
      const p = () => scallopPath(ctx, cx, cy, r);
      if (withShadow) withDrop(ctx, 16, 7, p);
      ctx.save();
      p();
      ctx.clip();
      drawCover(ctx, img, cx - r, cy - r, r * 2, r * 2);
      ctx.restore();
      ctx.save();
      ctx.strokeStyle = "rgba(201,168,76,0.85)";
      ctx.lineWidth = 1.5;
      p();
      ctx.stroke();
      ctx.restore();
    }
  };
  var HeartFrame = {
    id: "heart",
    label: "Heart",
    draw(ctx, img, x, y, w, h2, withShadow) {
      const cx = x + w / 2;
      const cy = y + h2 / 2;
      const size = Math.min(w, h2);
      const p = () => heartPath(ctx, x, y, w, h2);
      if (withShadow) withDrop(ctx, 18, 8, p);
      ctx.save();
      p();
      ctx.clip();
      drawCover(ctx, img, cx - size / 2, cy - size / 2, size, size);
      ctx.restore();
      ctx.save();
      ctx.strokeStyle = "rgba(201,168,76,0.85)";
      ctx.lineWidth = 1.5;
      p();
      ctx.stroke();
      ctx.restore();
    }
  };
  var StarFrame = {
    id: "star",
    label: "Star",
    draw(ctx, img, x, y, w, h2, withShadow) {
      const cx = x + w / 2;
      const cy = y + h2 / 2;
      const size = Math.min(w, h2);
      const p = () => starPath(ctx, x, y, w, h2);
      if (withShadow) withDrop(ctx, 16, 7, p);
      ctx.save();
      p();
      ctx.clip();
      drawCover(ctx, img, cx - size / 2, cy - size / 2, size, size);
      ctx.restore();
      ctx.save();
      ctx.strokeStyle = "rgba(201,168,76,0.85)";
      ctx.lineWidth = 1.5;
      p();
      ctx.stroke();
      ctx.restore();
    }
  };
  registerFrame(CircleFrame);
  registerFrame(HexagonFrame);
  registerFrame(DiamondFrame);
  registerFrame(ScallopFrame);
  registerFrame(HeartFrame);
  registerFrame(StarFrame);

  // ../shared/render-engine/src/frames/cards.ts
  var PolaroidFrame = {
    id: "polaroid",
    label: "Polaroid",
    draw(ctx, img, x, y, w, h2, withShadow) {
      const pad = Math.min(w, h2) * 0.06;
      const bPad = Math.min(w, h2) * 0.16;
      ctx.save();
      if (withShadow) {
        ctx.shadowColor = "rgba(0,0,0,0.5)";
        ctx.shadowBlur = 22;
        ctx.shadowOffsetY = 10;
      }
      ctx.fillStyle = "#FAF8F3";
      roundRect(ctx, x, y, w, h2, 4);
      ctx.fill();
      ctx.restore();
      ctx.save();
      ctx.beginPath();
      ctx.rect(x + pad, y + pad, w - pad * 2, h2 - pad - bPad);
      ctx.clip();
      drawCover(ctx, img, x + pad, y + pad, w - pad * 2, h2 - pad - bPad);
      ctx.restore();
    }
  };
  var VintageFrame = {
    id: "vintage",
    label: "Vintage",
    draw(ctx, img, x, y, w, h2, withShadow) {
      if (withShadow) {
        ctx.save();
        ctx.shadowColor = "rgba(0,0,0,0.40)";
        ctx.shadowBlur = 14;
        ctx.shadowOffsetY = 6;
        ctx.fillStyle = "#F5EDD8";
        ctx.fillRect(x, y, w, h2);
        ctx.restore();
      } else {
        ctx.fillStyle = "#F5EDD8";
        ctx.fillRect(x, y, w, h2);
      }
      const pad = Math.min(w, h2) * 0.06;
      ctx.save();
      ctx.beginPath();
      ctx.rect(x + pad, y + pad, w - pad * 2, h2 - pad * 2);
      ctx.clip();
      ctx.filter = "sepia(0.55) saturate(1.05) contrast(0.95)";
      drawCover(ctx, img, x + pad, y + pad, w - pad * 2, h2 - pad * 2);
      ctx.filter = "none";
      ctx.restore();
    }
  };
  var TapeFrame = {
    id: "tape",
    label: "Washi tape",
    draw(ctx, img, x, y, w, h2, withShadow) {
      if (withShadow) {
        ctx.save();
        ctx.shadowColor = "rgba(0,0,0,0.40)";
        ctx.shadowBlur = 14;
        ctx.shadowOffsetY = 6;
        ctx.fillStyle = "#000";
        ctx.fillRect(x, y, w, h2);
        ctx.restore();
      }
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, w, h2);
      ctx.clip();
      drawCover(ctx, img, x, y, w, h2);
      ctx.restore();
      const tw = Math.min(w, h2) * 0.34;
      const th = Math.min(w, h2) * 0.1;
      ctx.save();
      ctx.fillStyle = "rgba(232,201,122,0.72)";
      ctx.translate(x, y);
      ctx.rotate(-22 * Math.PI / 180);
      ctx.fillRect(-tw * 0.3, -th / 2, tw, th);
      ctx.restore();
      ctx.save();
      ctx.fillStyle = "rgba(232,201,122,0.72)";
      ctx.translate(x + w, y + h2);
      ctx.rotate(-22 * Math.PI / 180);
      ctx.fillRect(-tw * 0.7, -th / 2, tw, th);
      ctx.restore();
    }
  };
  var WhiteFrame = {
    id: "white",
    label: "White edge",
    draw(ctx, img, x, y, w, h2, withShadow) {
      if (withShadow) {
        ctx.save();
        ctx.shadowColor = "rgba(0,0,0,0.40)";
        ctx.shadowBlur = 14;
        ctx.shadowOffsetY = 6;
        ctx.fillStyle = "#FAF8F3";
        ctx.fillRect(x, y, w, h2);
        ctx.restore();
      } else {
        ctx.fillStyle = "#FAF8F3";
        ctx.fillRect(x, y, w, h2);
      }
      ctx.save();
      ctx.beginPath();
      ctx.rect(x + 3, y + 3, w - 6, h2 - 6);
      ctx.clip();
      drawCover(ctx, img, x + 3, y + 3, w - 6, h2 - 6);
      ctx.restore();
    }
  };
  registerFrame(PolaroidFrame);
  registerFrame(VintageFrame);
  registerFrame(TapeFrame);
  registerFrame(WhiteFrame);

  // ../shared/render-engine/src/frames/borders.ts
  var GoldFrame = {
    id: "gold",
    label: "Gold edge",
    draw(ctx, img, x, y, w, h2, withShadow) {
      RoundedFrame.draw(ctx, img, x, y, w, h2, withShadow);
      ctx.save();
      ctx.strokeStyle = "#C9A84C";
      ctx.lineWidth = 4;
      roundRect(ctx, x, y, w, h2, 12);
      ctx.stroke();
      ctx.restore();
    }
  };
  var DoubleGoldFrame = {
    id: "double-gold",
    label: "Double gold",
    draw(ctx, img, x, y, w, h2, withShadow) {
      if (withShadow) {
        ctx.save();
        ctx.shadowColor = "rgba(0,0,0,0.40)";
        ctx.shadowBlur = 14;
        ctx.shadowOffsetY = 6;
        ctx.fillStyle = "#000";
        ctx.fillRect(x, y, w, h2);
        ctx.restore();
      }
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, w, h2);
      ctx.clip();
      drawCover(ctx, img, x, y, w, h2);
      ctx.restore();
      ctx.save();
      ctx.strokeStyle = "#C9A84C";
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 1, y + 1, w - 2, h2 - 2);
      ctx.strokeRect(x + 6, y + 6, w - 12, h2 - 12);
      ctx.restore();
    }
  };
  var BaroqueFrame = {
    id: "baroque",
    label: "Baroque",
    draw(ctx, img, x, y, w, h2, withShadow) {
      if (withShadow) {
        ctx.save();
        ctx.shadowColor = "rgba(0,0,0,0.45)";
        ctx.shadowBlur = 16;
        ctx.shadowOffsetY = 7;
        ctx.fillStyle = "#000";
        ctx.fillRect(x, y, w, h2);
        ctx.restore();
      }
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, w, h2);
      ctx.clip();
      drawCover(ctx, img, x, y, w, h2);
      ctx.restore();
      ctx.save();
      ctx.strokeStyle = "#C9A84C";
      ctx.lineWidth = 4;
      ctx.strokeRect(x + 2, y + 2, w - 4, h2 - 4);
      ctx.strokeStyle = "#E8C97A";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x + 9, y + 9, w - 18, h2 - 18);
      ctx.restore();
    }
  };
  var RibbonFrame = {
    id: "ribbon",
    label: "Ribbon",
    draw(ctx, img, x, y, w, h2, withShadow) {
      if (withShadow) {
        ctx.save();
        ctx.shadowColor = "rgba(0,0,0,0.40)";
        ctx.shadowBlur = 14;
        ctx.shadowOffsetY = 6;
        ctx.fillStyle = "#000";
        ctx.fillRect(x, y, w, h2);
        ctx.restore();
      }
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, w, h2);
      ctx.clip();
      drawCover(ctx, img, x, y, w, h2);
      ctx.restore();
      ctx.save();
      ctx.strokeStyle = "#C9A84C";
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, w, h2);
      ctx.restore();
    }
  };
  var CrownFrame = {
    id: "crown",
    label: "Crown",
    draw(ctx, img, x, y, w, h2, withShadow) {
      if (withShadow) {
        ctx.save();
        ctx.shadowColor = "rgba(0,0,0,0.40)";
        ctx.shadowBlur = 14;
        ctx.shadowOffsetY = 6;
        ctx.fillStyle = "#000";
        ctx.fillRect(x, y, w, h2);
        ctx.restore();
      }
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, w, h2);
      ctx.clip();
      drawCover(ctx, img, x, y, w, h2);
      ctx.restore();
      ctx.save();
      ctx.strokeStyle = "#C9A84C";
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, w, h2);
      ctx.restore();
      const cw = Math.max(22, Math.min(w, h2) * 0.14);
      const ch = cw * 0.7;
      const ccx = x + w / 2 - cw / 2;
      const ccy = y - ch - 4;
      ctx.save();
      ctx.fillStyle = "#C9A84C";
      ctx.beginPath();
      ctx.moveTo(ccx, ccy + ch);
      ctx.lineTo(ccx + cw, ccy + ch);
      ctx.lineTo(ccx + cw - cw * 0.15, ccy + ch * 0.42);
      ctx.lineTo(ccx + cw * 0.15, ccy + ch * 0.42);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(ccx + cw * 0.15, ccy + ch * 0.42);
      ctx.lineTo(ccx + cw * 0.3, ccy);
      ctx.lineTo(ccx + cw * 0.5, ccy + ch * 0.42);
      ctx.lineTo(ccx + cw * 0.7, ccy);
      ctx.lineTo(ccx + cw * 0.85, ccy + ch * 0.42);
      ctx.fill();
      ctx.restore();
    }
  };
  registerFrame(GoldFrame);
  registerFrame(DoubleGoldFrame);
  registerFrame(BaroqueFrame);
  registerFrame(RibbonFrame);
  registerFrame(CrownFrame);

  // ../shared/render-engine/src/frames/effects.ts
  var NeonFrame = {
    id: "neon",
    label: "Neon glow",
    draw(ctx, img, x, y, w, h2, _withShadow) {
      ctx.save();
      roundRect(ctx, x, y, w, h2, 8);
      ctx.clip();
      drawCover(ctx, img, x, y, w, h2);
      ctx.restore();
      ctx.save();
      ctx.strokeStyle = "#22E8FF";
      ctx.shadowColor = "#22E8FF";
      ctx.shadowBlur = 18;
      ctx.lineWidth = 3;
      roundRect(ctx, x, y, w, h2, 8);
      ctx.stroke();
      ctx.restore();
    }
  };
  var GlitterFrame = {
    id: "glitter",
    label: "Glitter",
    draw(ctx, img, x, y, w, h2, withShadow) {
      if (withShadow) {
        ctx.save();
        ctx.shadowColor = "rgba(0,0,0,0.45)";
        ctx.shadowBlur = 16;
        ctx.shadowOffsetY = 7;
        ctx.fillStyle = "#000";
        ctx.fillRect(x, y, w, h2);
        ctx.restore();
      }
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, w, h2);
      ctx.clip();
      drawCover(ctx, img, x, y, w, h2);
      ctx.restore();
      ctx.save();
      const dr = Math.max(1.6, Math.min(w, h2) * 0.012);
      const step = dr * 4;
      ctx.fillStyle = "#E8C97A";
      ctx.shadowColor = "rgba(232,201,122,0.7)";
      ctx.shadowBlur = 6;
      for (let px2 = x; px2 <= x + w + 0.1; px2 += step) {
        ctx.beginPath();
        ctx.arc(px2, y, dr, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(px2, y + h2, dr, 0, Math.PI * 2);
        ctx.fill();
      }
      for (let py = y + step; py <= y + h2 - step + 0.1; py += step) {
        ctx.beginPath();
        ctx.arc(x, py, dr, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + w, py, dr, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  };
  var ShadowFrame = {
    id: "shadow",
    label: "Drop shadow",
    draw(ctx, img, x, y, w, h2, _withShadow) {
      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,0.55)";
      ctx.shadowBlur = 22;
      ctx.shadowOffsetY = 12;
      ctx.fillStyle = "#000";
      ctx.fillRect(x, y, w, h2);
      ctx.restore();
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, w, h2);
      ctx.clip();
      drawCover(ctx, img, x, y, w, h2);
      ctx.restore();
    }
  };
  var ShadowBoxFrame = {
    id: "shadow-box",
    label: "Shadow box",
    draw(ctx, img, x, y, w, h2, _withShadow) {
      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,0.55)";
      ctx.shadowBlur = 26;
      ctx.shadowOffsetY = 14;
      ctx.fillStyle = "#000";
      ctx.fillRect(x, y, w, h2);
      ctx.restore();
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, w, h2);
      ctx.clip();
      drawCover(ctx, img, x, y, w, h2);
      ctx.restore();
    }
  };
  registerFrame(NeonFrame);
  registerFrame(GlitterFrame);
  registerFrame(ShadowFrame);
  registerFrame(ShadowBoxFrame);

  // ../shared/render-engine/src/canvas/rng.ts
  function mulberry32(seed) {
    let a = seed >>> 0;
    return function() {
      a = a + 1831565813 >>> 0;
      let t = a;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function photoRot(rng, maxDeg) {
    return (rng() * 2 - 1) * maxDeg * (Math.PI / 180);
  }

  // ../shared/render-engine/src/frames/dispatch.ts
  function drawPhotoFramed(ctx, input, photo, x, y, w, h2, opts = {}) {
    const frameId = opts.forceFrame ?? input.frames?.[photo.id] ?? input.defaultFrame ?? "rounded";
    const rotation = opts.rotation ?? 0;
    const shadow = opts.shadow !== false;
    if (photo.image) {
      photo.image._rotDeg = input.rotations?.[photo.id] ?? 0;
    }
    ctx.save();
    let px2 = x;
    let py = y;
    if (rotation) {
      const tcx = opts.cx ?? x + w / 2;
      const tcy = opts.cy ?? y + h2 / 2;
      ctx.translate(tcx, tcy);
      ctx.rotate(rotation);
      px2 = -w / 2;
      py = -h2 / 2;
    } else if (opts.cx != null && opts.cy != null) {
      ctx.translate(opts.cx, opts.cy);
      px2 = -w / 2;
      py = -h2 / 2;
    }
    const frame = getFrame(frameId);
    frame.draw(ctx, photo.image, px2, py, w, h2, shadow);
    ctx.restore();
  }
  function drawHero3D(ctx, input, photo, x, y, w, h2) {
    if (!photo || !photo.image) return;
    if (photo.image) {
      photo.image._rotDeg = input.rotations?.[photo.id] ?? 0;
    }
    const radius = 14;
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.75)";
    ctx.shadowBlur = 60;
    ctx.shadowOffsetX = 18;
    ctx.shadowOffsetY = 28;
    ctx.fillStyle = "#000";
    roundRect(ctx, x, y, w, h2, radius);
    ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = 30;
    ctx.shadowOffsetX = 10;
    ctx.shadowOffsetY = 16;
    ctx.fillStyle = "#111";
    roundRect(ctx, x + 2, y + 2, w, h2, radius);
    ctx.fill();
    ctx.restore();
    ctx.save();
    roundRect(ctx, x, y, w, h2, radius);
    ctx.clip();
    drawCover(ctx, photo.image, x, y, w, h2);
    ctx.restore();
    ctx.save();
    ctx.strokeStyle = "#C9A84C";
    ctx.lineWidth = 3;
    ctx.shadowColor = "rgba(201,168,76,0.6)";
    ctx.shadowBlur = 12;
    roundRect(ctx, x, y, w, h2, radius);
    ctx.stroke();
    ctx.restore();
    ctx.save();
    const shine = ctx.createLinearGradient(x, y, x + w * 0.6, y + h2 * 0.4);
    shine.addColorStop(0, "rgba(255,255,255,0.18)");
    shine.addColorStop(0.4, "rgba(255,255,255,0.06)");
    shine.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = shine;
    roundRect(ctx, x, y, w, h2, radius);
    ctx.fill();
    ctx.restore();
  }
  function drawPhoto3D(ctx, input, photo, cx, cy, w, h2, rotation, offY = 10, blur = 22) {
    if (!photo || !photo.image) return;
    photo.image._rotDeg = input.rotations?.[photo.id] ?? 0;
    ctx.save();
    if (rotation) {
      ctx.translate(cx, cy);
      ctx.rotate(rotation);
      cx = 0;
      cy = 0;
    }
    const x = cx - w / 2;
    const y = cy - h2 / 2;
    const radius = 8;
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.65)";
    ctx.shadowBlur = blur;
    ctx.shadowOffsetX = 6;
    ctx.shadowOffsetY = offY;
    ctx.fillStyle = "#000";
    roundRect(ctx, x, y, w, h2, radius);
    ctx.fill();
    ctx.restore();
    ctx.save();
    roundRect(ctx, x, y, w, h2, radius);
    ctx.clip();
    drawCover(ctx, photo.image, x, y, w, h2);
    ctx.restore();
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.55)";
    ctx.lineWidth = 1.5;
    roundRect(ctx, x, y, w, h2, radius);
    ctx.stroke();
    ctx.restore();
    ctx.restore();
  }

  // ../shared/render-engine/src/arrangements/registry.ts
  var REGISTRY2 = /* @__PURE__ */ new Map();
  function registerArrangement(r) {
    REGISTRY2.set(r.id, r);
  }
  function getArrangement(id) {
    const r = REGISTRY2.get(id ?? "classic");
    return r ?? REGISTRY2.get("classic");
  }

  // ../shared/render-engine/src/arrangements/classic.ts
  var ClassicArrangement = {
    id: "classic",
    label: "Classic",
    minPhotos: 1,
    maxPhotos: 50,
    render({ ctx, W, H, contentTop, rng, input }, photos) {
      const margin = 40;
      const innerW = W - margin * 2;
      const supporting = photos.slice(1);
      const heroY = Math.max(140, contentTop);
      const heroH = 360;
      const heroBot = heroY + heroH;
      const cols = 8;
      const rows = 5;
      const gap = 6;
      const gridTop = heroBot + 8;
      const gridBot = H - 20;
      const gridH = gridBot - gridTop;
      const cellW = (innerW - gap * (cols - 1)) / cols;
      const cellH = (gridH - gap * (rows - 1)) / rows;
      const drawList = tileToCount(supporting, cols * rows);
      drawList.forEach((p, i) => {
        const r = Math.floor(i / cols);
        const c = i % cols;
        const x = margin + c * (cellW + gap);
        const y = gridTop + r * (cellH + gap);
        drawPhotoFramed(ctx, input, p, x, y, cellW, cellH, {
          rotation: photoRot(rng, 1.5),
          shadow: false
        });
      });
      drawHero3D(ctx, input, photos[0], margin, heroY, innerW, heroH);
    }
  };
  registerArrangement(ClassicArrangement);

  // ../shared/render-engine/src/arrangements/magazine.ts
  var MagazineArrangement = {
    id: "magazine",
    label: "Magazine",
    minPhotos: 3,
    maxPhotos: 25,
    render({ ctx, W, H, contentTop, rng, input }, photos) {
      const supporting = photos.slice(1);
      const gap = 8;
      const heroX = 40;
      const heroY = Math.max(128, contentTop);
      const heroW = 460;
      const heroH = 420;
      const leftBelowY = heroY + heroH + gap;
      const leftBelowH = 1170 - leftBelowY;
      const leftCols = 3;
      const leftRows = 4;
      const leftCellW = (460 - gap * (leftCols - 1)) / leftCols;
      const leftCellH = (leftBelowH - gap * (leftRows - 1)) / leftRows;
      const rightX = 508;
      const rightY = heroY;
      const rightW = 252;
      const rightH = 1170 - rightY;
      const rightCols = 2;
      const rightRows = 6;
      const rightCellW = (rightW - gap * (rightCols - 1)) / rightCols;
      const rightCellH = (rightH - gap * (rightRows - 1)) / rightRows;
      const total = leftCols * leftRows + rightCols * rightRows;
      const drawList = tileToCount(supporting, total);
      for (let i = 0; i < rightCols * rightRows; i++) {
        const p = drawList[i];
        const r = Math.floor(i / rightCols);
        const c = i % rightCols;
        drawPhotoFramed(
          ctx,
          input,
          p,
          rightX + c * (rightCellW + gap),
          rightY + r * (rightCellH + gap),
          rightCellW,
          rightCellH,
          { rotation: photoRot(rng, 1), shadow: false }
        );
      }
      for (let i = 0; i < leftCols * leftRows; i++) {
        const p = drawList[rightCols * rightRows + i];
        const r = Math.floor(i / leftCols);
        const c = i % leftCols;
        drawPhotoFramed(
          ctx,
          input,
          p,
          40 + c * (leftCellW + gap),
          leftBelowY + r * (leftCellH + gap),
          leftCellW,
          leftCellH,
          { rotation: photoRot(rng, 1), shadow: false }
        );
      }
      drawHero3D(ctx, input, photos[0], heroX, heroY, heroW, heroH);
    }
  };
  registerArrangement(MagazineArrangement);

  // ../shared/render-engine/src/arrangements/pyramid.ts
  var PyramidArrangement = {
    id: "pyramid",
    label: "Pyramid",
    minPhotos: 3,
    maxPhotos: 28,
    render({ ctx, W, H, contentTop, rng, input }, photos) {
      const margin = 40;
      const innerW = W - margin * 2;
      const innerH = H - contentTop - 60;
      const supporting = photos.slice(1);
      const heroSize = Math.min(innerW * 0.45, innerH * 0.4);
      const heroX = (W - heroSize) / 2;
      const heroY = contentTop + 8;
      const heroBot = heroY + heroSize + 32;
      const rowCounts = [];
      let remaining = supporting.length;
      let rowCols = 2;
      while (remaining > 0) {
        const take = Math.min(rowCols, remaining);
        rowCounts.push(take);
        remaining -= take;
        rowCols++;
      }
      if (rowCounts.length === 0) rowCounts.push(0);
      const pyTop = heroBot;
      const pyBottom = H - 50;
      const pyH = Math.max(60, pyBottom - pyTop);
      const rowH = pyH / rowCounts.length;
      const widestRow = Math.max(...rowCounts);
      const maxCellByWidth = (innerW - 10 * (widestRow - 1)) / Math.max(1, widestRow);
      const cellSize = Math.max(28, Math.min(rowH * 0.85, maxCellByWidth));
      const drawList = tileToCount(supporting, supporting.length);
      let idx = 0;
      rowCounts.forEach((count, r) => {
        if (count === 0) return;
        const totalW = count * cellSize + (count - 1) * 10;
        let xCursor = (W - totalW) / 2;
        const yTop = pyTop + r * rowH + (rowH - cellSize) / 2;
        for (let c = 0; c < count; c++) {
          drawPhotoFramed(ctx, input, drawList[idx], 0, 0, cellSize, cellSize, {
            cx: xCursor + cellSize / 2,
            cy: yTop + cellSize / 2,
            rotation: photoRot(rng, 2.5),
            shadow: false
          });
          idx++;
          xCursor += cellSize + 10;
        }
      });
      drawHero3D(ctx, input, photos[0], heroX, heroY, heroSize, heroSize);
    }
  };
  registerArrangement(PyramidArrangement);

  // ../shared/render-engine/src/arrangements/scattered.ts
  var ScatteredArrangement = {
    id: "scattered",
    label: "Scattered",
    minPhotos: 5,
    maxPhotos: 40,
    render({ ctx, W, H, contentTop, rng, input }, photos) {
      const supporting = photos.slice(1);
      const tileSize = 130;
      const safeTop = contentTop + 20;
      const contentBottom = H - 60;
      const contentH = contentBottom - safeTop;
      const heroW = 340;
      const heroH = 380;
      const heroX = (W - heroW) / 2;
      const heroY = safeTop + (contentH - heroH) / 2;
      const basePositions = [
        [60, safeTop + 20],
        [180, safeTop + 40],
        [60, safeTop + 155],
        [175, safeTop + 170],
        [470, safeTop + 20],
        [590, safeTop + 40],
        [475, safeTop + 155],
        [590, safeTop + 170],
        [55, safeTop + 720],
        [175, safeTop + 700],
        [60, safeTop + 840],
        [180, safeTop + 855],
        [470, safeTop + 720],
        [590, safeTop + 700],
        [475, safeTop + 840],
        [590, safeTop + 855]
      ];
      const drawList = tileToCount(supporting, basePositions.length);
      drawList.forEach((p, i) => {
        const [bx, by] = basePositions[i];
        const cx = bx + tileSize / 2;
        const cy = by + tileSize / 2;
        const rot = (rng() * 14 - 7) * (Math.PI / 180);
        drawPhoto3D(ctx, input, p, cx, cy, tileSize, tileSize, rot, 8 + rng() * 14, 18 + rng() * 16);
      });
      drawHero3D(ctx, input, photos[0], heroX, heroY, heroW, heroH);
    }
  };
  registerArrangement(ScatteredArrangement);

  // ../shared/render-engine/src/arrangements/mosaic.ts
  var MosaicArrangement = {
    id: "mosaic",
    label: "Mosaic",
    minPhotos: 8,
    maxPhotos: 40,
    render({ ctx, W, H, contentTop, rng, input }, photos) {
      const supporting = photos.slice(1);
      const margin = 40;
      const gap = 8;
      const contentBottom = H - margin;
      const heroW = 320;
      const heroH = 380;
      const heroX = (W - heroW) / 2;
      const heroY = contentTop + Math.floor((contentBottom - contentTop) * 0.22);
      const topH = heroY - gap - contentTop;
      const topW = (720 - 4 * gap) / 5;
      const topXs = [40, 184, 328, 472, 616];
      const sideRows = 3;
      const sideW = 192;
      const sideH = (heroH - gap * (sideRows - 1)) / sideRows;
      const botTop = heroY + heroH + gap;
      const botBandH = contentBottom - botTop;
      const botRows = 3;
      const botRowH = (botBandH - gap * (botRows - 1)) / botRows;
      const slots = [];
      topXs.forEach((tx) => slots.push({ x: tx, y: contentTop, w: topW, h: topH }));
      for (let i = 0; i < sideRows; i++) {
        slots.push({ x: 40, y: heroY + i * (sideH + gap), w: sideW, h: sideH });
        slots.push({ x: W - margin - sideW, y: heroY + i * (sideH + gap), w: sideW, h: sideH });
      }
      for (let r = 0; r < botRows; r++) {
        topXs.forEach((tx) => slots.push({ x: tx, y: botTop + r * (botRowH + gap), w: topW, h: botRowH }));
      }
      const drawList = tileToCount(supporting, slots.length);
      drawList.forEach((p, i) => {
        const s = slots[i];
        drawPhotoFramed(ctx, input, p, s.x, s.y, s.w, s.h, {
          rotation: photoRot(rng, 0.5),
          shadow: false
        });
      });
      drawHero3D(ctx, input, photos[0], heroX, heroY, heroW, heroH);
    }
  };
  registerArrangement(MosaicArrangement);

  // ../shared/render-engine/src/mockups/registry.ts
  var REGISTRY3 = /* @__PURE__ */ new Map();
  function registerMockup(r) {
    REGISTRY3.set(r.id, r);
  }

  // ../shared/render-engine/src/mockups/retractable-stand.ts
  var RetractableStandMockup = {
    id: "retractable-stand",
    label: "Retractable banner stand",
    render(target, banner, opts) {
      const dpr = opts?.dpr ?? 2;
      const W = opts?.width ?? 600;
      const H = opts?.height ?? 900;
      target.width = W * dpr;
      target.height = H * dpr;
      const ctx = target.getContext("2d");
      ctx.scale(dpr, dpr);
      ctx.fillStyle = "#F8F8F8";
      ctx.fillRect(0, 0, W, H);
      const margin = 30;
      const topBarH = Math.round(H * 0.015);
      const banH = Math.round(H * 0.78);
      const baseH = Math.round(banH * 0.06);
      const poleW = Math.max(5, Math.round(W * 0.01));
      const bannerL = margin;
      const bannerR = W - margin;
      const bannerW = bannerR - bannerL;
      const bannerT = margin + topBarH;
      const bannerB = bannerT + banH;
      const tb = ctx.createLinearGradient(bannerL, 0, bannerR, 0);
      tb.addColorStop(0, "#E0E0E0");
      tb.addColorStop(0.5, "#FFFFFF");
      tb.addColorStop(1, "#C0C0C0");
      ctx.fillStyle = tb;
      ctx.fillRect(bannerL, margin, bannerW, topBarH);
      ctx.fillStyle = "#7B7F86";
      const capR = topBarH * 0.85;
      ctx.beginPath();
      ctx.arc(bannerL, margin + topBarH / 2, capR, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(bannerR, margin + topBarH / 2, capR, 0, Math.PI * 2);
      ctx.fill();
      const taper = bannerW * 0.02;
      const topLx = bannerL + taper;
      const topRx = bannerR - taper;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(topLx, bannerT);
      ctx.lineTo(topRx, bannerT);
      ctx.lineTo(bannerR, bannerB);
      ctx.lineTo(bannerL, bannerB);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(banner, bannerL, bannerT, bannerW, banH);
      const spec = ctx.createLinearGradient(bannerL, bannerT, bannerL + bannerW * 0.55, bannerT + banH * 0.5);
      spec.addColorStop(0, "rgba(255,255,255,0.18)");
      spec.addColorStop(0.5, "rgba(255,255,255,0.06)");
      spec.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = spec;
      ctx.fillRect(bannerL, bannerT, bannerW, banH);
      ctx.restore();
      ctx.save();
      ctx.strokeStyle = "rgba(0,0,0,0.45)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(topLx, bannerT);
      ctx.lineTo(topRx, bannerT);
      ctx.lineTo(bannerR, bannerB);
      ctx.lineTo(bannerL, bannerB);
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
      const poleX = bannerR - poleW / 2;
      const poleTop = margin + topBarH;
      const poleBot = bannerB + baseH * 0.85;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(poleX, poleTop);
      ctx.lineTo(poleX + poleW, poleTop);
      ctx.lineTo(poleX + poleW * 1.25, poleBot);
      ctx.lineTo(poleX - poleW * 0.25, poleBot);
      ctx.closePath();
      const pg = ctx.createLinearGradient(poleX - poleW, 0, poleX + poleW * 2, 0);
      pg.addColorStop(0, "#3F4654");
      pg.addColorStop(0.5, "#FFFFFF");
      pg.addColorStop(1, "#9CA3AF");
      ctx.fillStyle = pg;
      ctx.fill();
      const knobCy = poleTop + (poleBot - poleTop) * 0.5;
      ctx.fillStyle = "#374151";
      ctx.beginPath();
      ctx.ellipse(poleX + poleW / 2, knobCy, poleW * 1.6, poleW * 0.8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      const baseW = Math.round(bannerW * 0.7);
      const baseCx = (bannerL + bannerR) / 2;
      const baseCy = bannerB + baseH;
      ctx.save();
      ctx.fillStyle = "rgba(0,0,0,0.40)";
      ctx.filter = "blur(14px)";
      ctx.beginPath();
      ctx.ellipse(baseCx + 6, baseCy + baseH * 0.6, baseW / 2 + 18, baseH * 0.85, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.filter = "none";
      ctx.restore();
      const baseGrad = ctx.createRadialGradient(
        baseCx - baseW * 0.12,
        baseCy - baseH * 0.5,
        4,
        baseCx,
        baseCy + baseH * 0.2,
        baseW / 2
      );
      baseGrad.addColorStop(0, "#FFFFFF");
      baseGrad.addColorStop(0.18, "#E5E7EB");
      baseGrad.addColorStop(0.45, "#9CA3AF");
      baseGrad.addColorStop(0.78, "#4B5563");
      baseGrad.addColorStop(1, "#1F2937");
      ctx.fillStyle = baseGrad;
      ctx.beginPath();
      ctx.ellipse(baseCx, baseCy, baseW / 2, baseH, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(baseCx, baseCy, baseW / 2, baseH, 0, 0, Math.PI * 2);
      ctx.clip();
      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.lineWidth = 0.6;
      for (let yy = baseCy - baseH; yy <= baseCy + baseH; yy += 2) {
        ctx.beginPath();
        ctx.moveTo(baseCx - baseW / 2, yy);
        ctx.lineTo(baseCx + baseW / 2, yy);
        ctx.stroke();
      }
      ctx.restore();
      ctx.save();
      ctx.fillStyle = "rgba(255,255,255,0.40)";
      ctx.beginPath();
      ctx.ellipse(baseCx - baseW * 0.18, baseCy - baseH * 0.35, baseW * 0.3, baseH * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      const floorTop = baseCy + baseH;
      const floorH = H - floorTop;
      if (floorH > 6) {
        const fg = ctx.createLinearGradient(0, floorTop, 0, floorTop + floorH);
        fg.addColorStop(0, "rgba(0,0,0,0.06)");
        fg.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = fg;
        ctx.fillRect(0, floorTop, W, floorH);
      }
    }
  };
  registerMockup(RetractableStandMockup);

  // ../shared/render-engine/src/theme/background.ts
  function drawBannerBackground(ctx, W, H, palette) {
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, lightenHex(palette.bg, 12));
    grad.addColorStop(1, palette.bg);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = palette.accent;
    ctx.lineWidth = 8;
    ctx.strokeRect(20, 20, W - 40, H - 40);
  }

  // ../shared/render-engine/src/theme/text.ts
  function renderBannerText(ctx, W, topY, theme, bannerText) {
    const fields = theme.fields ?? [];
    const palette = theme.palette;
    let y = topY;
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    fields.forEach((key, i) => {
      const value = (bannerText[key] ?? "").trim();
      if (i === 0) {
        if (value) {
          ctx.fillStyle = palette.text;
          ctx.font = 'bold 64px "Cormorant Garamond", serif';
          ctx.fillText(value, W / 2, y + 56);
        } else {
          const meta = theme.fieldMeta?.[key];
          const placeholder = meta?.placeholder || `Your ${key}`;
          ctx.fillStyle = hexToRgba(palette.text, 0.45);
          ctx.font = 'italic 600 56px "Cormorant Garamond", serif';
          ctx.fillText(placeholder, W / 2, y + 56);
        }
        y += 74;
      } else if (i === 1) {
        if (!value) return;
        ctx.fillStyle = palette.accent;
        ctx.font = 'italic 600 30px "Cormorant Garamond", serif';
        ctx.fillText(value, W / 2, y + 30);
        y += 40;
      } else {
        if (!value) return;
        ctx.fillStyle = hexToRgba(palette.text, 0.78);
        ctx.font = "500 18px Outfit, sans-serif";
        ctx.fillText(value, W / 2, y + 20);
        y += 28;
      }
    });
    return y;
  }

  // ../shared/render-engine/src/pipeline/render.ts
  function renderBanner(ctx, input) {
    const { width: W, height: H, theme, bannerText, arrangement, photos, heroId } = input;
    drawBannerBackground(ctx, W, H, theme.palette);
    ctx.save();
    ctx.globalCompositeOperation = "source-over";
    const textBottomY = renderBannerText(ctx, W, 56, theme, bannerText);
    ctx.restore();
    if (photos.length === 0) return;
    const heroIdx = heroId ? photos.findIndex((p) => p.id === heroId) : 0;
    const orderedPhotos = heroIdx > 0 ? [photos[heroIdx], ...photos.slice(0, heroIdx), ...photos.slice(heroIdx + 1)] : photos;
    const contentTop = textBottomY + 24;
    const seed = (input.seed ?? 12345) >>> 0;
    const rng = mulberry32(seed ^ 41244);
    const env = { ctx, W, H, contentTop, rng, input };
    const arr = getArrangement(arrangement);
    arr.render(env, orderedPhotos);
    ctx.save();
    ctx.globalCompositeOperation = "source-over";
    renderBannerText(ctx, W, 56, theme, bannerText);
    ctx.restore();
  }

  // ../shared/render-engine/src/pipeline/preview.ts
  function renderPreview(target, input, opts = {}) {
    const W = opts.previewWidth ?? 800;
    const H = opts.previewHeight ?? 1200;
    const dpr = opts.dpr ?? 1;
    target.width = W * dpr;
    target.height = H * dpr;
    const ctx = target.getContext("2d");
    if (dpr !== 1) ctx.scale(dpr, dpr);
    renderBanner(ctx, { ...input, width: W, height: H });
  }

  // ../shared/image-intelligence/src/orientation.ts
  var SQUARE_TOLERANCE = 0.02;
  function detectOrientation(width, height, tolerance = SQUARE_TOLERANCE) {
    if (!(width > 0) || !(height > 0)) return "square";
    const ratio = width / height;
    if (Math.abs(ratio - 1) <= tolerance) return "square";
    return ratio > 1 ? "landscape" : "portrait";
  }
  function normalizeQuarterTurns(value) {
    const n = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(n)) return 0;
    const turns = Math.abs(n) >= 45 ? Math.round(n / 90) : Math.round(n);
    const wrapped = (turns % 4 + 4) % 4;
    return wrapped;
  }
  function applyQuarterTurns(width, height, turns) {
    return turns % 2 === 1 ? { width: height, height: width } : { width, height };
  }
  var norm = (o) => o === "portrait" || o === "landscape" || o === "square" ? o : null;
  function planOrientationCorrection(input) {
    const { width, height } = input;
    if (!(width > 0) || !(height > 0) || !Number.isFinite(width) || !Number.isFinite(height)) {
      return {
        quarterTurns: 0,
        corrected: false,
        reason: "Dimensions unavailable \u2014 orientation left untouched.",
        effective: { width: width || 0, height: height || 0, orientation: "square" }
      };
    }
    const reasons = [];
    let turns = normalizeQuarterTurns(input.userRotationDegrees);
    let eff = applyQuarterTurns(width, height, turns);
    if (turns !== 0) {
      reasons.push(`Honored the customer's ${turns * 90}\xB0 rotation.`);
    } else {
      const declared = norm(input.declaredOrientation);
      const actual = detectOrientation(eff.width, eff.height);
      if (declared && declared !== "square" && actual !== "square" && declared !== actual) {
        turns = 1;
        eff = applyQuarterTurns(width, height, turns);
        reasons.push(`Corrected a ${actual} image the pipeline expected to be ${declared}.`);
      }
    }
    return {
      quarterTurns: turns,
      corrected: turns !== 0,
      reason: reasons.length ? reasons.join(" ") : "Orientation already correct \u2014 no change.",
      effective: { width: eff.width, height: eff.height, orientation: detectOrientation(eff.width, eff.height) }
    };
  }

  // ../shared/image-intelligence/src/hero.ts
  var FACE_SAFE_FOCUS_Y = 0.1;
  var aspect = (width, height) => width > 0 && height > 0 ? width / height : 1;
  function heroBoxAspect(arrangement, canvasWidth, _canvasHeight) {
    switch (arrangement) {
      case "classic": {
        const inner = canvasWidth - 80;
        return inner > 0 ? aspect(inner, 360) : 1;
      }
      case "pyramid":
        return 1;
      case "mosaic":
        return aspect(320, 380);
      case "magazine":
        return aspect(460, 420);
      default:
        return 1;
    }
  }
  var SUPPORTING_ASPECT = 1;
  function coverCropRect(srcWidth, srcHeight, targetAspect, focusY = FACE_SAFE_FOCUS_Y) {
    const w = srcWidth > 0 ? srcWidth : 1;
    const h2 = srcHeight > 0 ? srcHeight : 1;
    const target = targetAspect > 0 ? targetAspect : 1;
    const srcAspect = w / h2;
    const clamp2 = (v, lo, hi) => v < lo ? lo : v > hi ? hi : v;
    if (srcAspect > target) {
      const sw = h2 * target;
      return { sx: (w - sw) / 2, sy: 0, sw, sh: h2 };
    }
    const sh = w / target;
    const sy = clamp2((h2 - sh) * clamp2(focusY, 0, 1), 0, Math.max(0, h2 - sh));
    return { sx: 0, sy, sw: w, sh };
  }

  // demo/renderer-binding.ts
  var FRAME_MAP = {
    "thin-gold": "double-gold",
    gold: "gold",
    soft: "rounded",
    minimal: "white"
  };
  function toFrame(name) {
    return name && FRAME_MAP[name] || "rounded";
  }
  function nowMs() {
    if (typeof performance !== "undefined" && typeof performance.now === "function") return performance.now();
    return Date.now();
  }
  function capDims(w, h2, maxEdge) {
    const longEdge = Math.max(w, h2);
    if (longEdge <= maxEdge) return { w: Math.max(1, Math.round(w)), h: Math.max(1, Math.round(h2)) };
    const s = maxEdge / longEdge;
    return { w: Math.max(1, Math.round(w * s)), h: Math.max(1, Math.round(h2 * s)) };
  }
  var HERO_MAX_EDGE = 800;
  var SUPPORTING_MAX_EDGE = 384;
  function prepareImage(doc, src, quarterTurns, targetAspect, grade, maxEdge) {
    const iw = (src.naturalWidth ?? src.width) || 1;
    const ih = (src.naturalHeight ?? src.height) || 1;
    const turns = (quarterTurns % 4 + 4) % 4;
    const rw = turns % 2 === 1 ? ih : iw;
    const rh = turns % 2 === 1 ? iw : ih;
    const crop = coverCropRect(rw, rh, targetAspect);
    const scale = Math.min(1, maxEdge / Math.max(crop.sw, crop.sh));
    const outW = Math.max(1, Math.round(crop.sw * scale));
    const outH = Math.max(1, Math.round(crop.sh * scale));
    const c = doc.createElement("canvas");
    c.width = outW;
    c.height = outH;
    const ctx = c.getContext("2d");
    if (!ctx) return src;
    ctx.save();
    if (grade) {
      try {
        ctx.filter = `contrast(${grade.contrast}) saturate(${grade.saturate}) brightness(${grade.brightness})`;
      } catch {
      }
    }
    ctx.scale(outW / crop.sw, outH / crop.sh);
    ctx.translate(-crop.sx, -crop.sy);
    ctx.translate(rw / 2, rh / 2);
    ctx.rotate(turns * Math.PI / 2);
    ctx.drawImage(src, -iw / 2, -ih / 2, iw, ih);
    ctx.restore();
    if (grade && grade.vignette > 0) {
      const g = ctx.createRadialGradient(outW / 2, outH / 2, Math.min(outW, outH) * 0.32, outW / 2, outH / 2, Math.max(outW, outH) * 0.72);
      g.addColorStop(0, "rgba(12,14,20,0)");
      g.addColorStop(1, `rgba(12,14,20,${grade.vignette})`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, outW, outH);
    }
    return c;
  }
  function makePlaceholderPhoto(doc, filename, targetAspect, theme) {
    const base = 800;
    const w = targetAspect >= 1 ? base : Math.round(base * targetAspect);
    const h2 = targetAspect >= 1 ? Math.round(base / targetAspect) : base;
    const c = doc.createElement("canvas");
    c.width = w;
    c.height = h2;
    const ctx = c.getContext("2d");
    const g = ctx.createLinearGradient(0, 0, w, h2);
    g.addColorStop(0, theme.accent || "#C9A84C");
    g.addColorStop(1, theme.ground || "#0C0E14");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h2);
    ctx.fillStyle = "rgba(255,255,255,0.14)";
    ctx.fillRect(0, Math.round(h2 * 0.5) - 1, w, 2);
    ctx.fillStyle = theme.neutral || "#FAF8F3";
    ctx.font = `600 ${Math.round(w * 0.06)}px "Outfit", system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(filename, w / 2, h2 / 2);
    return c;
  }
  function toRenderInput(doc, req, w, h2, options, cache) {
    const { resolveImage, rotationFor } = options;
    const curate = options.curate !== false;
    const photos = [];
    const frames = {};
    const t = options.treatmentFor?.(req.conceptName);
    const supportingGrade = curate ? { contrast: t?.grade.contrast ?? 1.05, saturate: t?.grade.saturate ?? 0.94, brightness: t?.grade.brightness ?? 0.97, vignette: t?.vignette ?? 0.3 } : null;
    const heroAspect = heroBoxAspect(req.arrangement, w, h2);
    const supportingAspect = t?.supportingAspect ?? SUPPORTING_ASPECT;
    const imageFor = (ref, targetAspect, grade, maxEdge) => {
      const src = resolveImage && resolveImage(ref);
      if (!src) return makePlaceholderPhoto(doc, ref.filename ?? ref.photoId, targetAspect, req.theme);
      if (!curate) return src;
      const correction = planOrientationCorrection({
        width: (src.naturalWidth ?? src.width) || 0,
        height: (src.naturalHeight ?? src.height) || 0,
        declaredOrientation: ref.orientation,
        userRotationDegrees: rotationFor ? rotationFor(ref) : 0
      });
      const key = `${ref.photoId}|${correction.quarterTurns}|${targetAspect.toFixed(4)}|${grade ? `${grade.contrast}:${grade.saturate}:${grade.brightness}:${grade.vignette}` : "raw"}|${maxEdge}`;
      const hit = cache.get(key);
      if (hit) return hit;
      try {
        const prepared = prepareImage(doc, src, correction.quarterTurns, targetAspect, grade, maxEdge);
        cache.set(key, prepared);
        return prepared;
      } catch {
        return src;
      }
    };
    if (req.hero) {
      photos.push({ id: req.hero.photoId, image: imageFor(req.hero, heroAspect, null, HERO_MAX_EDGE) });
      frames[req.hero.photoId] = toFrame(t?.heroFrame ?? req.hero.frame);
    }
    for (const s of req.supporting) {
      photos.push({ id: s.photoId, image: imageFor(s, supportingAspect, supportingGrade, SUPPORTING_MAX_EDGE) });
      frames[s.photoId] = toFrame(s.frame);
    }
    const theme = {
      id: req.occasion,
      fields: Object.keys(req.bannerText),
      palette: { bg: req.theme.ground, accent: req.theme.accent, text: req.theme.neutral }
    };
    return {
      width: w,
      height: h2,
      arrangement: req.arrangement,
      theme,
      bannerText: req.bannerText,
      photos,
      heroId: req.hero?.photoId ?? null,
      frames,
      defaultFrame: "rounded",
      seed: req.seed,
      cinematicHero: t ? t.cinematicHero : req.cinematicHero
    };
  }
  function createCanvasRenderer(options = {}) {
    const doc = options.document ?? (typeof document !== "undefined" ? document : void 0);
    if (!doc) throw new Error("createCanvasRenderer requires a DOM document (browser only).");
    const previewMaxEdge = options.previewMaxEdge ?? 900;
    const exportMaxEdge = options.exportMaxEdge ?? 1400;
    const preparedCache = /* @__PURE__ */ new Map();
    return {
      render(req) {
        const maxEdge = req.kind === "export" ? exportMaxEdge : previewMaxEdge;
        const { w, h: h2 } = capDims(req.widthPx, req.heightPx, maxEdge);
        const canvas = doc.createElement("canvas");
        const input = toRenderInput(doc, req, w, h2, options, preparedCache);
        const t0 = nowMs();
        renderPreview(canvas, input, { previewWidth: w, previewHeight: h2, dpr: 1 });
        const format = req.kind === "export" ? "jpg" : "png";
        const uri = canvas.toDataURL(format === "jpg" ? "image/jpeg" : "image/png");
        const renderMs = Math.max(1, Math.round(nowMs() - t0));
        return {
          targetId: req.targetId,
          kind: req.kind,
          format,
          widthPx: w,
          heightPx: h2,
          colorMode: req.colorMode,
          uri,
          byteSize: uri.length,
          renderMs
        };
      }
    };
  }

  // ../shared/render-adapter/src/types.ts
  var SCHEMA_VERSION6 = "1.0.0";
  var REQUIRED_EXPORT_TARGETS = [
    "digital",
    "poster_18x24",
    "poster_24x36",
    "framed_24x36"
  ];

  // ../shared/render-adapter/src/mapper.ts
  var PREVIEW_LONG_EDGE = 1200;
  var THUMBNAIL_LONG_EDGE = 400;
  var PREVIEW_DPI = 72;
  function hashString(s) {
    let h2 = 2166136261 >>> 0;
    for (let i = 0; i < s.length; i++) {
      h2 ^= s.charCodeAt(i);
      h2 = Math.imul(h2, 16777619);
    }
    return h2 >>> 0;
  }
  function deriveSeed(plan) {
    return hashString(`${plan.occasion}::${plan.conceptName}::${plan.renderInstructions.arrangement}`);
  }
  function scaleToLongEdge(widthPx, heightPx, longEdge) {
    const w = widthPx > 0 ? widthPx : 2;
    const h2 = heightPx > 0 ? heightPx : 3;
    const scale = longEdge / Math.max(w, h2);
    return { width: Math.max(1, Math.round(w * scale)), height: Math.max(1, Math.round(h2 * scale)) };
  }
  function referenceTarget(plan) {
    return plan.exportTargets.find((t) => t.id === "digital") ?? plan.exportTargets[0];
  }
  function heroRef(plan) {
    if (!plan.heroPhoto) return null;
    const hp = plan.renderInstructions.heroPlacement;
    return {
      photoId: plan.heroPhoto.photoId,
      filename: plan.heroPhoto.filename ?? null,
      orientation: plan.heroPhoto.orientation,
      role: "hero",
      frame: hp.frame,
      dominanceRatio: hp.dominanceRatio
    };
  }
  function supportingRefs(plan) {
    const count = plan.renderInstructions.supportingPlacement.count;
    return plan.supportingPhotos.slice(0, count).map((p) => ({
      photoId: p.photoId,
      filename: p.filename ?? null,
      orientation: p.orientation,
      role: "supporting",
      frame: null,
      // supporting tiles use the renderer's default frame
      dominanceRatio: null
    }));
  }
  function themeSpec(plan) {
    const cp = plan.renderInstructions.colorPalette;
    return {
      ground: cp.ground,
      accent: cp.accent,
      neutral: cp.neutral,
      swatches: cp.palette.map((p) => ({ hex: p.hex, role: p.role })),
      source: cp.source
    };
  }
  function typographySpec(plan) {
    const tp = plan.renderInstructions.typographyPlacement;
    return {
      displayFont: tp.displayFont,
      supportingFont: tp.supportingFont,
      alignment: tp.alignment,
      titleZone: tp.titleZone,
      subtitleZone: tp.subtitleZone,
      headlineTreatment: tp.headlineTreatment,
      labelTreatment: tp.labelTreatment
    };
  }
  function backgroundSpec(plan) {
    const bg = plan.renderInstructions.backgroundSelection;
    return { style: bg.style, decorationTheme: bg.decorationTheme, vignette: bg.vignette };
  }
  function dimsFor(kind, plan, target, opts) {
    const ref = referenceTarget(plan);
    const refW = ref ? ref.widthPx : 2;
    const refH = ref ? ref.heightPx : 3;
    if (kind === "preview") {
      const { width, height } = scaleToLongEdge(refW, refH, opts.previewLongEdge ?? PREVIEW_LONG_EDGE);
      return { targetId: "preview", label: "Live Preview", widthPx: width, heightPx: height, dpi: PREVIEW_DPI, colorMode: "RGB", formats: ["png"] };
    }
    if (kind === "thumbnail") {
      const { width, height } = scaleToLongEdge(refW, refH, opts.thumbnailLongEdge ?? THUMBNAIL_LONG_EDGE);
      return { targetId: "thumbnail", label: "Thumbnail", widthPx: width, heightPx: height, dpi: PREVIEW_DPI, colorMode: "RGB", formats: ["png"] };
    }
    if (!target) throw new Error('buildRenderRequest: an export target is required for kind "export".');
    return {
      targetId: target.id,
      label: target.label,
      widthPx: target.widthPx,
      heightPx: target.heightPx,
      dpi: target.dpi,
      colorMode: target.colorMode,
      formats: target.formats
    };
  }
  function buildRenderRequest(plan, kind, target, options = {}) {
    const ri = plan.renderInstructions;
    const d = dimsFor(kind, plan, target, options);
    return {
      kind,
      targetId: d.targetId,
      label: d.label,
      occasion: plan.occasion,
      conceptName: plan.conceptName,
      arrangement: ri.arrangement,
      widthPx: d.widthPx,
      heightPx: d.heightPx,
      dpi: d.dpi,
      colorMode: d.colorMode,
      formats: [...d.formats],
      hero: heroRef(plan),
      supporting: supportingRefs(plan),
      theme: themeSpec(plan),
      typography: typographySpec(plan),
      background: backgroundSpec(plan),
      decorativeElements: [...ri.decorativeElements],
      spacing: { marginRatio: ri.spacing.marginRatio, gapRatio: ri.spacing.gapRatio, whitespace: ri.spacing.whitespace },
      layering: [...ri.layering.order],
      bannerText: { ...options.bannerText ?? {} },
      heroSpotlight: ri.heroPlacement.spotlight,
      cinematicHero: true,
      // matches the existing renderer's default (index.html)
      seed: options.seed ?? deriveSeed(plan)
    };
  }

  // ../shared/render-adapter/src/validator.ts
  function imageValid(img) {
    return !!img && typeof img.uri === "string" && img.uri.length > 0 && img.widthPx > 0 && img.heightPx > 0 && img.byteSize > 0;
  }
  function exportsAvailable(plan, rendered) {
    if (!Array.isArray(rendered) || rendered.length !== plan.exportTargets.length) return false;
    const ids = new Set(rendered.map((t) => t.id));
    const allRequired = REQUIRED_EXPORT_TARGETS.every((id) => ids.has(id));
    const allImaged = rendered.every((t) => imageValid(t.image));
    return allRequired && allImaged;
  }
  function validateRendered(plan, previewImage, thumbnailImage, exportTargets, status) {
    const reasons = [];
    const renderCompleted = status === "completed";
    const previewExists = imageValid(previewImage);
    const thumbnailExists = imageValid(thumbnailImage);
    const exportTargetsAvailable = exportsAvailable(plan, exportTargets);
    const qualityChecksPassed = plan.accepted === true && plan.qualityChecks.passed === true;
    if (!qualityChecksPassed) {
      const upstream = plan.qualityChecks.reasons;
      reasons.push(upstream.length ? `Render plan was not accepted: ${upstream.join(" ")}` : "Render plan was not accepted by the orchestrator.");
    }
    if (!renderCompleted) reasons.push(`Render did not complete (status: ${status}).`);
    if (!previewExists) reasons.push("Preview image was not produced.");
    if (!thumbnailExists) reasons.push("Thumbnail image was not produced.");
    if (!exportTargetsAvailable) reasons.push("Export targets were not fully rendered.");
    const passed = renderCompleted && previewExists && thumbnailExists && exportTargetsAvailable && qualityChecksPassed;
    return {
      passed,
      renderCompleted,
      previewExists,
      thumbnailExists,
      exportTargetsAvailable,
      qualityChecksPassed,
      reasons
    };
  }

  // ../shared/render-adapter/src/engine.ts
  function renderConcept(renderPlan, renderer, options = {}) {
    const arrangement = renderPlan.renderInstructions.arrangement;
    const base = {
      schemaVersion: SCHEMA_VERSION6,
      conceptName: renderPlan.conceptName,
      occasion: renderPlan.occasion,
      arrangement
    };
    if (!renderPlan.accepted) {
      return {
        ...base,
        renderStatus: "skipped",
        renderTime: 0,
        previewImage: null,
        thumbnailImage: null,
        exportTargets: [],
        qualityChecks: validateRendered(renderPlan, null, null, [], "skipped")
      };
    }
    const renderExports = options.renderExports ?? true;
    let previewImage = null;
    let thumbnailImage = null;
    let exportTargets = [];
    let threw = false;
    try {
      previewImage = renderer.render(buildRenderRequest(renderPlan, "preview", void 0, options));
      thumbnailImage = renderer.render(buildRenderRequest(renderPlan, "thumbnail", void 0, options));
      if (renderExports) {
        exportTargets = renderPlan.exportTargets.map((t) => ({
          id: t.id,
          label: t.label,
          product: t.product,
          widthPx: t.widthPx,
          heightPx: t.heightPx,
          dpi: t.dpi,
          colorMode: t.colorMode,
          formats: [...t.formats],
          framed: t.framed,
          matte: t.matte,
          image: renderer.render(buildRenderRequest(renderPlan, "export", t, options))
        }));
      }
    } catch {
      threw = true;
    }
    const images = [
      previewImage,
      thumbnailImage,
      ...exportTargets.map((e) => e.image)
    ].filter((i) => i != null);
    const renderTime = images.reduce((sum, i) => sum + (i.renderMs || 0), 0);
    const exportsOk = !renderExports || exportTargets.length === renderPlan.exportTargets.length && exportTargets.every((e) => imageValid(e.image));
    const completed = !threw && imageValid(previewImage) && imageValid(thumbnailImage) && exportsOk;
    const renderStatus = completed ? "completed" : "failed";
    return {
      ...base,
      renderStatus,
      renderTime,
      previewImage,
      thumbnailImage,
      exportTargets,
      qualityChecks: validateRendered(renderPlan, previewImage, thumbnailImage, exportTargets, renderStatus)
    };
  }

  // demo/concept-previews.ts
  var msg = (err) => err instanceof Error ? err.message : String(err);
  function renderConceptPreview(result, conceptName, renderer, options = {}) {
    let plan;
    try {
      plan = renderPlanForConcept(result, conceptName);
    } catch (err) {
      return { conceptName, status: "failed", previewUri: null, thumbnailUri: null, renderStatus: "error", renderTime: 0, reasons: [msg(err)] };
    }
    try {
      const rc = renderConcept(plan, renderer, options);
      if (rc.renderStatus === "completed" && rc.previewImage && rc.previewImage.uri) {
        return {
          conceptName,
          status: "rendered",
          previewUri: rc.previewImage.uri,
          thumbnailUri: rc.thumbnailImage?.uri ?? null,
          renderStatus: rc.renderStatus,
          renderTime: rc.renderTime,
          reasons: []
        };
      }
      return {
        conceptName,
        status: "fallback",
        previewUri: null,
        thumbnailUri: null,
        renderStatus: rc.renderStatus,
        renderTime: rc.renderTime,
        reasons: rc.qualityChecks.reasons
      };
    } catch (err) {
      return { conceptName, status: "fallback", previewUri: null, thumbnailUri: null, renderStatus: "error", renderTime: 0, reasons: [msg(err)] };
    }
  }
  async function renderConceptPreviewsProgressive(result, renderer, options = {}) {
    const concepts = result.wowPresentation.concepts;
    const total = concepts.length;
    const now = options.now ?? (() => typeof performance !== "undefined" ? performance.now() : Date.now());
    const scheduleYield = options.scheduleYield ?? (() => Promise.resolve());
    const budget = options.perConceptTimeoutMs ?? Infinity;
    const { perConceptTimeoutMs: _t, onProgress: _p, scheduleYield: _y, now: _n, ...renderOptions } = options;
    const out = [];
    for (let i = 0; i < total; i++) {
      await scheduleYield();
      const t0 = now();
      let preview = renderConceptPreview(result, concepts[i].conceptName, renderer, renderOptions);
      const elapsed = now() - t0;
      if (preview.status === "rendered" && elapsed > budget) {
        preview = {
          ...preview,
          status: "fallback",
          previewUri: null,
          thumbnailUri: null,
          reasons: [`Render exceeded the ${budget}ms budget (${Math.round(elapsed)}ms) \u2014 showing placeholder.`]
        };
      }
      out.push(preview);
      options.onProgress?.(i + 1, total, preview);
    }
    return out;
  }

  // ../shared/memory-profile/fixtures/graduation.json
  var graduation_default = {
    schema_version: "1.0.0",
    occasion: "graduation",
    style: "editorial-classic",
    story: "A graduation celebration anchored by one standout portrait photo, supported by 3 favorite moments.",
    mood: "proud",
    primary_subject: {
      type: "individual",
      faceCount: 1,
      sourcePhotoId: "g1"
    },
    hero_photo: {
      photoId: "g1",
      filename: "grad_portrait.jpg",
      orientation: "portrait",
      score: 93,
      faceCount: 1,
      width: 4032,
      height: 5040
    },
    supporting_photos: [
      {
        photoId: "g2",
        filename: "cap_toss.jpg",
        orientation: "landscape",
        score: 84,
        faceCount: 3,
        width: 6e3,
        height: 4e3
      },
      {
        photoId: "g3",
        filename: "family_hug.jpg",
        orientation: "landscape",
        score: 83,
        faceCount: 4,
        width: 4e3,
        height: 3e3
      },
      {
        photoId: "g4",
        filename: "blurry_walk.jpg",
        orientation: "portrait",
        score: 64,
        faceCount: 1,
        width: 3024,
        height: 4032
      }
    ],
    photo_rankings: [
      {
        photoId: "g1",
        rank: 1,
        compositeScore: 93,
        role: "hero"
      },
      {
        photoId: "g5",
        rank: 2,
        compositeScore: 84,
        role: "excluded"
      },
      {
        photoId: "g2",
        rank: 3,
        compositeScore: 84,
        role: "supporting"
      },
      {
        photoId: "g3",
        rank: 4,
        compositeScore: 83,
        role: "supporting"
      },
      {
        photoId: "g4",
        rank: 5,
        compositeScore: 64,
        role: "supporting"
      }
    ],
    family_members: [],
    groups: [
      {
        label: "2026-05-20",
        photoIds: [
          "g1",
          "g2",
          "g3",
          "g4",
          "g5"
        ],
        size: 5
      }
    ],
    dominant_colors: [
      {
        hex: "#C9A84C",
        weight: 0.42
      },
      {
        hex: "#0C0E14",
        weight: 0.33
      },
      {
        hex: "#FAF8F3",
        weight: 0.25
      }
    ],
    photo_quality_scores: [
      {
        photoId: "g1",
        quality: 89,
        resolutionScore: 1,
        exposureScore: 0.95,
        sharpness: 0.9
      },
      {
        photoId: "g2",
        quality: 84,
        resolutionScore: 1,
        exposureScore: 0.91,
        sharpness: 0.8
      },
      {
        photoId: "g3",
        quality: 83,
        resolutionScore: 1,
        exposureScore: 1,
        sharpness: 0.72
      },
      {
        photoId: "g4",
        quality: 59,
        resolutionScore: 1,
        exposureScore: 0.73,
        sharpness: 0.22
      },
      {
        photoId: "g5",
        quality: 84,
        resolutionScore: 1,
        exposureScore: 0.91,
        sharpness: 0.79
      }
    ],
    face_count: 12,
    portrait_count: 2,
    landscape_count: 3,
    square_count: 0,
    duplicate_candidates: [
      {
        group: [
          "g2",
          "g5"
        ],
        keep: "g2",
        reason: "near-identical (burst)"
      }
    ],
    restoration_candidates: [
      {
        photoId: "g4",
        reasons: [
          "low_sharpness"
        ]
      }
    ],
    recommended_concept: "Signature Edition",
    confidence_score: 100,
    warnings: [
      {
        code: "duplicates_detected",
        message: "1 duplicate group(s) detected; kept the strongest of each.",
        severity: "info"
      },
      {
        code: "restoration_recommended",
        message: "1 photo(s) may benefit from enhancement/restoration.",
        severity: "info"
      }
    ],
    future_extension_fields: {
      faceRecognition: null,
      aiVision: null,
      expressionAnalysis: null,
      textDetection: null
    }
  };

  // ../shared/memory-profile/fixtures/championship.json
  var championship_default = {
    schema_version: "1.0.0",
    occasion: "championship",
    style: "opulent",
    story: "A championship celebration anchored by one standout portrait photo, supported by 3 favorite moments.",
    mood: "triumphant",
    primary_subject: {
      type: "individual",
      faceCount: 1,
      sourcePhotoId: "c1"
    },
    hero_photo: {
      photoId: "c1",
      filename: "trophy_lift.jpg",
      orientation: "portrait",
      score: 93,
      faceCount: 1,
      width: 5e3,
      height: 6250
    },
    supporting_photos: [
      {
        photoId: "c2",
        filename: "team_celebrate.jpg",
        orientation: "landscape",
        score: 83,
        faceCount: 8,
        width: 6e3,
        height: 4e3
      },
      {
        photoId: "c3",
        filename: "final_whistle.jpg",
        orientation: "landscape",
        score: 79,
        faceCount: 5,
        width: 5472,
        height: 3648
      },
      {
        photoId: "c4",
        filename: "scoreboard.jpg",
        orientation: "landscape",
        score: 63,
        faceCount: 0,
        width: 4e3,
        height: 2250
      }
    ],
    photo_rankings: [
      {
        photoId: "c1",
        rank: 1,
        compositeScore: 93,
        role: "hero"
      },
      {
        photoId: "c2",
        rank: 2,
        compositeScore: 83,
        role: "supporting"
      },
      {
        photoId: "c3",
        rank: 3,
        compositeScore: 79,
        role: "supporting"
      },
      {
        photoId: "c4",
        rank: 4,
        compositeScore: 63,
        role: "supporting"
      }
    ],
    family_members: [],
    groups: [],
    dominant_colors: [
      {
        hex: "#0C0E14",
        weight: 0.61
      },
      {
        hex: "#C9A84C",
        weight: 0.39
      }
    ],
    photo_quality_scores: [
      {
        photoId: "c1",
        quality: 90,
        resolutionScore: 1,
        exposureScore: 0.91,
        sharpness: 0.92
      },
      {
        photoId: "c2",
        quality: 86,
        resolutionScore: 1,
        exposureScore: 0.95,
        sharpness: 0.8
      },
      {
        photoId: "c3",
        quality: 82,
        resolutionScore: 1,
        exposureScore: 0.87,
        sharpness: 0.74
      },
      {
        photoId: "c4",
        quality: 75,
        resolutionScore: 1,
        exposureScore: 0.82,
        sharpness: 0.6
      }
    ],
    face_count: 14,
    portrait_count: 1,
    landscape_count: 3,
    square_count: 0,
    duplicate_candidates: [],
    restoration_candidates: [],
    recommended_concept: "Luxury Gold",
    confidence_score: 100,
    warnings: [],
    future_extension_fields: {
      faceRecognition: null,
      aiVision: null,
      expressionAnalysis: null,
      textDetection: null
    }
  };

  // ../shared/memory-profile/fixtures/family.json
  var family_default = {
    schema_version: "1.0.0",
    occasion: "family_reunion",
    style: "heartfelt",
    story: "A family reunion celebration anchored by one standout portrait photo, supported by 4 favorite moments.",
    mood: "warm",
    primary_subject: {
      type: "small_group",
      faceCount: 2,
      sourcePhotoId: "f1"
    },
    hero_photo: {
      photoId: "f1",
      filename: "grandparents.jpg",
      orientation: "portrait",
      score: 85,
      faceCount: 2,
      width: 4e3,
      height: 5e3
    },
    supporting_photos: [
      {
        photoId: "f2",
        filename: "whole_family.jpg",
        orientation: "landscape",
        score: 81,
        faceCount: 14,
        width: 6e3,
        height: 4e3
      },
      {
        photoId: "f3",
        filename: "kids_playing.jpg",
        orientation: "landscape",
        score: 78,
        faceCount: 4,
        width: 4032,
        height: 3024
      },
      {
        photoId: "f4",
        filename: "cousins.jpg",
        orientation: "landscape",
        score: 78,
        faceCount: 6,
        width: 4e3,
        height: 3e3
      },
      {
        photoId: "f5",
        filename: "old_photo_1980.jpg",
        orientation: "portrait",
        score: 57,
        faceCount: 3,
        width: 1200,
        height: 1600
      }
    ],
    photo_rankings: [
      {
        photoId: "f1",
        rank: 1,
        compositeScore: 85,
        role: "hero"
      },
      {
        photoId: "f2",
        rank: 2,
        compositeScore: 81,
        role: "supporting"
      },
      {
        photoId: "f4",
        rank: 3,
        compositeScore: 78,
        role: "supporting"
      },
      {
        photoId: "f3",
        rank: 4,
        compositeScore: 78,
        role: "supporting"
      },
      {
        photoId: "f5",
        rank: 5,
        compositeScore: 57,
        role: "supporting"
      }
    ],
    family_members: [],
    groups: [
      {
        label: "1980-06-01",
        photoIds: [
          "f5"
        ],
        size: 1
      },
      {
        label: "2026-07-04",
        photoIds: [
          "f1",
          "f2",
          "f3",
          "f4"
        ],
        size: 4
      }
    ],
    dominant_colors: [
      {
        hex: "#0C0E14",
        weight: 0.5
      },
      {
        hex: "#C9A84C",
        weight: 0.33
      },
      {
        hex: "#FAF8F3",
        weight: 0.17
      }
    ],
    photo_quality_scores: [
      {
        photoId: "f1",
        quality: 83,
        resolutionScore: 1,
        exposureScore: 0.91,
        sharpness: 0.78
      },
      {
        photoId: "f2",
        quality: 84,
        resolutionScore: 1,
        exposureScore: 0.87,
        sharpness: 0.82
      },
      {
        photoId: "f3",
        quality: 77,
        resolutionScore: 1,
        exposureScore: 0.8,
        sharpness: 0.7
      },
      {
        photoId: "f4",
        quality: 80,
        resolutionScore: 1,
        exposureScore: 0.95,
        sharpness: 0.68
      },
      {
        photoId: "f5",
        quality: 48,
        resolutionScore: 0.32,
        exposureScore: 0.82,
        sharpness: 0.4
      }
    ],
    face_count: 29,
    portrait_count: 2,
    landscape_count: 3,
    square_count: 0,
    duplicate_candidates: [],
    restoration_candidates: [
      {
        photoId: "f5",
        reasons: [
          "monochrome_old"
        ]
      }
    ],
    recommended_concept: "Family Legacy",
    confidence_score: 90,
    warnings: [
      {
        code: "no_color_data",
        message: "No per-photo color data supplied; used the occasion default palette.",
        severity: "info"
      },
      {
        code: "restoration_recommended",
        message: "1 photo(s) may benefit from enhancement/restoration.",
        severity: "info"
      }
    ],
    future_extension_fields: {
      faceRecognition: null,
      aiVision: null,
      expressionAnalysis: null,
      textDetection: null
    }
  };

  // ../shared/memory-profile/fixtures/wedding.json
  var wedding_default = {
    schema_version: "1.0.0",
    occasion: "wedding",
    style: "editorial-classic",
    story: "A wedding celebration anchored by one standout portrait photo, supported by 3 favorite moments.",
    mood: "romantic",
    primary_subject: {
      type: "small_group",
      faceCount: 2,
      sourcePhotoId: "w1"
    },
    hero_photo: {
      photoId: "w1",
      filename: "first_kiss.jpg",
      orientation: "portrait",
      score: 88,
      faceCount: 2,
      width: 4480,
      height: 6720
    },
    supporting_photos: [
      {
        photoId: "w3",
        filename: "first_dance.jpg",
        orientation: "landscape",
        score: 82,
        faceCount: 2,
        width: 6e3,
        height: 4e3
      },
      {
        photoId: "w4",
        filename: "bridal_party.jpg",
        orientation: "landscape",
        score: 80,
        faceCount: 8,
        width: 6e3,
        height: 4e3
      },
      {
        photoId: "w2",
        filename: "rings.jpg",
        orientation: "square",
        score: 74,
        faceCount: 0,
        width: 4e3,
        height: 4e3
      }
    ],
    photo_rankings: [
      {
        photoId: "w1",
        rank: 1,
        compositeScore: 88,
        role: "hero"
      },
      {
        photoId: "w3",
        rank: 2,
        compositeScore: 82,
        role: "supporting"
      },
      {
        photoId: "w4",
        rank: 3,
        compositeScore: 80,
        role: "supporting"
      },
      {
        photoId: "w2",
        rank: 4,
        compositeScore: 74,
        role: "supporting"
      }
    ],
    family_members: [],
    groups: [],
    dominant_colors: [
      {
        hex: "#FAF8F3",
        weight: 0.63
      },
      {
        hex: "#C9A84C",
        weight: 0.38
      }
    ],
    photo_quality_scores: [
      {
        photoId: "w1",
        quality: 87,
        resolutionScore: 1,
        exposureScore: 0.8,
        sharpness: 0.94
      },
      {
        photoId: "w2",
        quality: 86,
        resolutionScore: 1,
        exposureScore: 0.91,
        sharpness: 0.88
      },
      {
        photoId: "w3",
        quality: 82,
        resolutionScore: 1,
        exposureScore: 0.73,
        sharpness: 0.8
      },
      {
        photoId: "w4",
        quality: 82,
        resolutionScore: 1,
        exposureScore: 0.85,
        sharpness: 0.79
      }
    ],
    face_count: 12,
    portrait_count: 1,
    landscape_count: 2,
    square_count: 1,
    duplicate_candidates: [],
    restoration_candidates: [],
    recommended_concept: "Signature Edition",
    confidence_score: 100,
    warnings: [],
    future_extension_fields: {
      faceRecognition: null,
      aiVision: null,
      expressionAnalysis: null,
      textDetection: null
    }
  };

  // ../shared/memory-profile/fixtures/memorial.json
  var memorial_default = {
    schema_version: "1.0.0",
    occasion: "memorial",
    style: "heartfelt",
    story: "A memorial celebration anchored by one standout portrait photo, supported by 3 favorite moments.",
    mood: "reverent",
    primary_subject: {
      type: "individual",
      faceCount: 1,
      sourcePhotoId: "m1"
    },
    hero_photo: {
      photoId: "m1",
      filename: "portrait_smiling.jpg",
      orientation: "portrait",
      score: 85,
      faceCount: 1,
      width: 3e3,
      height: 3750
    },
    supporting_photos: [
      {
        photoId: "m3",
        filename: "with_family.jpg",
        orientation: "landscape",
        score: 73,
        faceCount: 5,
        width: 3200,
        height: 2400
      },
      {
        photoId: "m4",
        filename: "garden.jpg",
        orientation: "landscape",
        score: 69,
        faceCount: 1,
        width: 2400,
        height: 1800
      },
      {
        photoId: "m2",
        filename: "young_years_bw.jpg",
        orientation: "portrait",
        score: 54,
        faceCount: 1,
        width: 1e3,
        height: 1400
      }
    ],
    photo_rankings: [
      {
        photoId: "m1",
        rank: 1,
        compositeScore: 85,
        role: "hero"
      },
      {
        photoId: "m3",
        rank: 2,
        compositeScore: 73,
        role: "supporting"
      },
      {
        photoId: "m4",
        rank: 3,
        compositeScore: 69,
        role: "supporting"
      },
      {
        photoId: "m2",
        rank: 4,
        compositeScore: 54,
        role: "supporting"
      }
    ],
    family_members: [],
    groups: [
      {
        label: "1968-01-01",
        photoIds: [
          "m2"
        ],
        size: 1
      },
      {
        label: "1995-08-15",
        photoIds: [
          "m3"
        ],
        size: 1
      },
      {
        label: "2001-04-10",
        photoIds: [
          "m1"
        ],
        size: 1
      },
      {
        label: "2010-05-01",
        photoIds: [
          "m4"
        ],
        size: 1
      }
    ],
    dominant_colors: [
      {
        hex: "#0C0E14",
        weight: 0.5
      },
      {
        hex: "#C9A84C",
        weight: 0.33
      },
      {
        hex: "#FAF8F3",
        weight: 0.17
      }
    ],
    photo_quality_scores: [
      {
        photoId: "m1",
        quality: 79,
        resolutionScore: 1,
        exposureScore: 0.91,
        sharpness: 0.7
      },
      {
        photoId: "m2",
        quality: 40,
        resolutionScore: 0.23,
        exposureScore: 0.76,
        sharpness: 0.3
      },
      {
        photoId: "m3",
        quality: 75,
        resolutionScore: 1,
        exposureScore: 0.87,
        sharpness: 0.6
      },
      {
        photoId: "m4",
        quality: 62,
        resolutionScore: 0.72,
        exposureScore: 0.69,
        sharpness: 0.55
      }
    ],
    face_count: 8,
    portrait_count: 2,
    landscape_count: 2,
    square_count: 0,
    duplicate_candidates: [],
    restoration_candidates: [
      {
        photoId: "m2",
        reasons: [
          "low_sharpness",
          "monochrome_old"
        ]
      }
    ],
    recommended_concept: "Family Legacy",
    confidence_score: 90,
    warnings: [
      {
        code: "no_color_data",
        message: "No per-photo color data supplied; used the occasion default palette.",
        severity: "info"
      },
      {
        code: "restoration_recommended",
        message: "1 photo(s) may benefit from enhancement/restoration.",
        severity: "info"
      }
    ],
    future_extension_fields: {
      faceRecognition: null,
      aiVision: null,
      expressionAnalysis: null,
      textDetection: null
    }
  };

  // demo/premium-reveal-demo.entry.ts
  function yieldToBrowser() {
    return new Promise((resolve) => {
      if (typeof requestAnimationFrame === "function") requestAnimationFrame(() => resolve());
      else setTimeout(resolve, 0);
    });
  }
  var monotonic = () => typeof performance !== "undefined" ? performance.now() : Date.now();
  var PROFILES = {
    graduation: graduation_default,
    championship: championship_default,
    family: family_default,
    wedding: wedding_default,
    memorial: memorial_default
  };
  var $ = (id) => document.getElementById(id);
  function toast(msg2) {
    let el = $("demo-toast");
    if (!el) {
      el = document.createElement("div");
      el.id = "demo-toast";
      document.body.appendChild(el);
    }
    el.textContent = msg2;
    el.classList.add("show");
    window.clearTimeout(toast._t);
    toast._t = window.setTimeout(() => el.classList.remove("show"), 2200);
  }
  function jsonInto(id, obj) {
    const el = $(id);
    if (el) el.textContent = JSON.stringify(obj, null, 2);
  }
  function row(label2, value) {
    const r = document.createElement("div");
    r.className = "pd-row";
    const k = document.createElement("span");
    k.className = "pd-key";
    k.textContent = label2;
    const v = document.createElement("span");
    v.className = "pd-val";
    v.textContent = value;
    r.append(k, v);
    return r;
  }
  function renderPlanDetails(plan) {
    const host = $("plan-details");
    if (!host) return;
    host.innerHTML = "";
    const q = plan.qualityChecks;
    const head = document.createElement("div");
    head.className = "pd-head";
    const h2 = document.createElement("h3");
    h2.textContent = "Render Plan Details";
    const status = document.createElement("span");
    status.id = "plan-status";
    status.className = `pd-status ${plan.accepted ? "pd-status--ok" : "pd-status--err"}`;
    status.textContent = plan.accepted ? "ACCEPTED" : "REJECTED";
    head.append(h2, status);
    const hero = plan.heroPhoto ? `${plan.heroPhoto.photoId}${plan.heroPhoto.filename ? ` \xB7 ${plan.heroPhoto.filename}` : ""}` : "\u2014";
    const facts = document.createElement("div");
    facts.className = "pd-facts";
    facts.append(
      row("Concept", plan.conceptName),
      row("Arrangement", plan.renderInstructions.arrangement),
      row("Hero photo", hero),
      row("Supporting photos", String(plan.supportingPhotos.length))
    );
    const targets = document.createElement("div");
    targets.className = "pd-block";
    targets.innerHTML = `<div class="pd-sub">Export targets (${plan.exportTargets.length})</div>`;
    for (const t of plan.exportTargets) {
      const el = document.createElement("div");
      el.className = "pd-target";
      el.textContent = `${t.label} \u2014 ${t.widthPx}\xD7${t.heightPx}px @${t.dpi} \xB7 ${t.colorMode}${t.framed ? " \xB7 framed" : ""}`;
      targets.appendChild(el);
    }
    const checks = document.createElement("div");
    checks.className = "pd-block";
    checks.innerHTML = `<div class="pd-sub">Quality checks</div>`;
    const CHECKS = [
      ["Hero photo", q.heroPhoto],
      ["Supporting photos", q.supportingPhotos],
      ["WOW score \u2265 90", q.wowScore],
      ["Masterpiece passed", q.masterpiecePassed],
      ["Layout recipe", q.layoutRecipeComplete],
      ["Typography recipe", q.typographyRecipeComplete],
      ["Export targets", q.exportTargetsDefined]
    ];
    const grid = document.createElement("div");
    grid.className = "pd-checks";
    for (const [label2, ok] of CHECKS) {
      const c = document.createElement("span");
      c.className = `pd-check ${ok ? "pd-check--ok" : "pd-check--err"}`;
      c.textContent = `${ok ? "\u2713" : "\u2717"} ${label2}`;
      grid.appendChild(c);
    }
    checks.appendChild(grid);
    host.append(head, facts, targets, checks);
    if (plan.qualityChecks.reasons.length) {
      const reasons = document.createElement("div");
      reasons.className = "pd-block pd-reasons";
      reasons.innerHTML = `<div class="pd-sub">Rejection reasons</div>` + plan.qualityChecks.reasons.map((r) => `<div class="pd-reason">\u2022 ${r}</div>`).join("");
      host.appendChild(reasons);
    }
  }
  var CURRENT = null;
  var RENDERER = null;
  var RENDERER_TRIED = false;
  function getRenderer(directions) {
    if (!RENDERER_TRIED) {
      RENDERER_TRIED = true;
      try {
        RENDERER = createCanvasRenderer({ previewMaxEdge: 900, treatmentFor: (n) => directions.get(n)?.treatment });
      } catch {
        RENDERER = null;
      }
    }
    return RENDERER;
  }
  function paintCard(p) {
    const card = document.querySelector(`.pr-card[data-concept="${p.conceptName}"]`);
    if (!card) return false;
    const media = card.querySelector(".pr-card-media");
    const previewEl = card.querySelector(".pr-card-preview");
    card.dataset.renderStatus = p.status;
    if (media) {
      media.dataset.renderStatus = p.status;
      media.title = p.reasons.join(" ") || `${p.status} (${p.renderTime}ms)`;
    }
    if (p.status === "rendered" && p.previewUri && previewEl) {
      const img = document.createElement("img");
      img.className = "pr-card-preview-img";
      img.alt = `${p.conceptName} preview`;
      img.src = p.previewUri;
      previewEl.replaceChildren(img);
      previewEl.classList.add("is-rendered");
      return true;
    }
    return false;
  }
  async function paintPreviews(result) {
    const directions = new Map(result.artDirection.directions.map((d) => [d.conceptName, d]));
    const renderer = getRenderer(directions);
    const total = result.wowPresentation.concepts.length;
    const summary = $("render-summary");
    const setSummary = (text, state) => {
      if (summary) {
        summary.textContent = text;
        summary.dataset.state = state;
      }
    };
    if (!renderer) {
      for (const c of result.wowPresentation.concepts) {
        paintCard({ conceptName: c.conceptName, status: "fallback", previewUri: null, thumbnailUri: null, renderStatus: "error", renderTime: 0, reasons: ["No canvas available in this environment."] });
      }
      setSummary(`Rendered 0/${total} concepts \xB7 placeholder fallback`, "fallback");
      return;
    }
    const previews = await renderConceptPreviewsProgressive(result, renderer, {
      renderExports: false,
      perConceptTimeoutMs: 2e3,
      now: monotonic,
      scheduleYield: yieldToBrowser,
      onProgress: (done, t, preview) => {
        paintCard(preview);
        if (done < t) setSummary(`Rendering concept ${done} of ${t}\u2026`, "partial");
      }
    });
    const rendered = previews.filter((p) => p.status === "rendered").length;
    setSummary(
      rendered === total ? `Real artwork rendered for all ${total} concepts` : `Rendered ${rendered}/${total} concepts \xB7 ${total - rendered} on placeholder fallback`,
      rendered === total ? "ok" : rendered === 0 ? "fallback" : "partial"
    );
  }
  function render(key, skipLoading, focusConcept) {
    const mp = PROFILES[key];
    const result = runPipeline(mp);
    CURRENT = result;
    jsonInto("stage-mp", result.memoryProfile);
    jsonInto("stage-cb", result.creativeBrief);
    jsonInto("stage-wp", result.wowPresentation);
    jsonInto("stage-plan", result.renderPlan);
    renderPlanDetails(focusConcept ? renderPlanForConcept(result, focusConcept) : result.renderPlan);
    const host = $("reveal");
    if (host) {
      const directions = new Map(result.artDirection.directions.map((d) => [d.conceptName, d]));
      mountPremiumReveal(host, {
        presentation: result.wowPresentation,
        copyFor: (name) => directions.get(name)?.copy,
        skipLoading,
        loadingIntervalMs: 650,
        onRevealed: () => {
          toast(`Revealed: ${key}`);
          paintPreviews(result);
        },
        handlers: {
          onChoose: (c) => {
            focus(c);
            toast(`\u2713 Chosen: ${c.conceptName}`);
          },
          onDetails: (c) => {
            focus(c);
            toast(`\u{1F50D} Render plan: ${c.conceptName}`);
          }
        }
      });
    }
  }
  function focus(concept) {
    if (CURRENT) renderPlanDetails(renderPlanForConcept(CURRENT, concept.conceptName));
  }
  function init() {
    const sel = $("fixture");
    const current = () => sel ? sel.value : "graduation";
    sel?.addEventListener("change", () => render(current(), false));
    $("replay")?.addEventListener("click", () => render(current(), false));
    $("skip")?.addEventListener("click", () => render(current(), true));
    render(current(), false);
  }
  if (document.readyState !== "loading") init();
  else document.addEventListener("DOMContentLoaded", init);
})();
