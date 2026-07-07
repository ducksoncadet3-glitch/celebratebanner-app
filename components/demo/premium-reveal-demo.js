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
.pr-card-preview { aspect-ratio:4/3; background:
  linear-gradient(135deg, rgba(201,168,76,0.10), rgba(12,14,20,0.6)); display:grid; place-items:center;
  color:var(--pr-muted); font-size:13px; letter-spacing:.1em; text-transform:uppercase;
  border-bottom:1px solid var(--pr-border); }
.pr-card-preview-mark { text-align:center; }
.pr-card-topline { display:flex; align-items:center; justify-content:space-between; gap:12px;
  position:absolute; top:12px; left:12px; right:12px; }
.pr-card-body { padding:18px 20px 20px; display:flex; flex-direction:column; gap:12px; flex:1; }
.pr-card-name { font-family:var(--pr-serif); font-weight:700; font-size:24px; margin:0; }
.pr-card-title { color:var(--pr-gold2); font-size:14px; margin:-6px 0 0; }
.pr-card-explanation { color:rgba(250,248,243,0.82); font-size:13.5px; line-height:1.5; margin:0; }
.pr-card-product { font-size:12.5px; color:var(--pr-ivory); }
.pr-card-product b { color:var(--pr-gold2); }
.pr-card-psychology { font-size:12.5px; color:var(--pr-muted); font-style:italic; line-height:1.45; margin:0; }
.pr-card-actions { display:flex; flex-wrap:wrap; gap:8px; margin-top:auto; padding-top:6px; }

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
.pr-btn { font-family:var(--pr-sans); font-size:12.5px; font-weight:700; padding:9px 14px;
  border-radius:999px; cursor:pointer; border:1px solid var(--pr-border); background:transparent;
  color:var(--pr-ivory); transition:all .2s ease; }
.pr-btn:hover { border-color:var(--pr-gold); }
.pr-btn:focus-visible { outline:2px solid var(--pr-gold2); outline-offset:2px; }
.pr-btn--love { background:linear-gradient(135deg,var(--pr-gold),var(--pr-gold2)); color:var(--pr-obsidian);
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
    if (passed) {
      return h(
        "span",
        { class: "pr-badge", role: "img", "aria-label": "Masterpiece \u2014 passed the WOW quality gate" },
        h("span", { "aria-hidden": "true" }, "\u2728"),
        "Masterpiece"
      );
    }
    return h(
      "span",
      { class: "pr-badge pr-badge--pending", role: "img", "aria-label": "In review \u2014 not yet a masterpiece" },
      "In review"
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

  // src/ConceptCard/index.ts
  function createConceptCard(props) {
    const { concept, index, isDirectorsChoice, handlers = {} } = props;
    const labelBits = [`${concept.conceptName} concept`, `WOW score ${Math.round(concept.wowScore)} of 100`];
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
    const button = (cls, text, ariaVerb, cb) => h(
      "button",
      { type: "button", class: `pr-btn ${cls}`, "aria-label": `${ariaVerb}: ${concept.conceptName}`, onClick: () => cb?.(concept) },
      text
    );
    const actions = h(
      "div",
      { class: "pr-card-actions" },
      button("pr-btn--love", "Love This", "Love this concept", handlers.onLove),
      button("pr-btn--details", "See Details", "See details for", handlers.onDetails),
      button("pr-btn--another", "Try Another Direction", "Try another direction than", handlers.onTryAnother)
    );
    const body = h(
      "div",
      { class: "pr-card-body" },
      h("h3", { class: "pr-card-name" }, concept.conceptName),
      concept.title ? h("p", { class: "pr-card-title" }, concept.title) : null,
      createMasterpieceBadge(concept.masterpiecePassed),
      h("p", { class: "pr-card-explanation" }, concept.creativeExplanation),
      h("p", { class: "pr-card-product" }, "Recommended as ", h("b", {}, concept.recommendedProduct)),
      h("p", { class: "pr-card-psychology" }, concept.purchasePsychology),
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
    const { presentation, handlers } = props;
    const cards = presentation.concepts.map(
      (concept, i) => createConceptCard({
        concept,
        index: i,
        isDirectorsChoice: concept.conceptName === presentation.recommendedConcept,
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

  // src/types.ts
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
    const { presentation, handlers, skipLoading = false, loadingIntervalMs = 900, onRevealed } = props;
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
      root.appendChild(createRevealGallery({ presentation, handlers }));
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

  // demo/pipeline.ts
  function runPipeline(memoryProfile) {
    const creativeBrief = generateCreativeBrief(memoryProfile);
    const wowPresentation = generateWOWPresentation(memoryProfile, creativeBrief);
    const renderPlan = generateRenderPlan(memoryProfile, creativeBrief, wowPresentation);
    return { memoryProfile, creativeBrief, wowPresentation, renderPlan };
  }
  function renderPlanForConcept(result, conceptName) {
    return generateRenderPlan(result.memoryProfile, result.creativeBrief, result.wowPresentation, { conceptName });
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
  var PROFILES = {
    graduation: graduation_default,
    championship: championship_default,
    family: family_default,
    wedding: wedding_default,
    memorial: memorial_default
  };
  var $ = (id) => document.getElementById(id);
  function toast(msg) {
    let el = $("demo-toast");
    if (!el) {
      el = document.createElement("div");
      el.id = "demo-toast";
      document.body.appendChild(el);
    }
    el.textContent = msg;
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
      mountPremiumReveal(host, {
        presentation: result.wowPresentation,
        skipLoading,
        loadingIntervalMs: 650,
        onRevealed: () => toast(`Revealed: ${key}`),
        handlers: {
          onLove: (c) => {
            focus(c);
            toast(`\u2764 Loved: ${c.conceptName}`);
          },
          onDetails: (c) => {
            focus(c);
            toast(`\u{1F50D} Render plan: ${c.conceptName}`);
          },
          onTryAnother: (c) => toast(`\u21BB Try another than: ${c.conceptName}`)
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
