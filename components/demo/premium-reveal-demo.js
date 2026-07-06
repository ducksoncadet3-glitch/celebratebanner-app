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
      (label, i) => h(
        "li",
        { class: "pr-stage pr-stage--pending", dataset: { index: String(i) } },
        h("span", { class: "pr-stage-dot", "aria-hidden": "true" }),
        h("span", { class: "pr-stage-label" }, label)
      )
    );
    for (const r of rows) list.appendChild(r);
    let index = -1;
    let done = false;
    let timer = null;
    function render2() {
      rows.forEach((row, i) => {
        const state = done || i < index ? "done" : i === index ? "active" : "pending";
        row.className = `pr-stage pr-stage--${state}`;
        if (state === "active") row.setAttribute("aria-current", "step");
        else row.removeAttribute("aria-current");
      });
    }
    function goTo(i) {
      index = Math.max(0, Math.min(stages.length - 1, i));
      done = false;
      render2();
      const label = stages[index];
      live.textContent = label;
      props.onStageChange?.(index, label);
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

  // ../shared/wow-engine/fixtures/graduation.json
  var graduation_default = {
    schemaVersion: "1.0.0",
    version: "0.1.0",
    createdAt: null,
    occasion: "graduation",
    recommendedConcept: "Signature Edition",
    masterpiecePassed: true,
    overallWOWScore: 94,
    concepts: [
      {
        conceptName: "Signature Edition",
        title: "{Graduate Name}",
        subtitle: "Class of {Year}",
        creativeExplanation: "We made \u201Cgrad_portrait.jpg\u201D (portrait, quality 93/100) the star. Photo g1 (grad_portrait.jpg) is strongest: portrait, score 93, 1 clear subject. Signature Edition centers it with symmetrical balance and generous whitespace, framed with restraint in #C9A84C on #C9A84C \u2014 timeless, so this graduation still feels right in ten years. 3 supporting photos were chosen only because they strengthen the hero and lead the eye back to it \u2014 beauty over quantity, nothing added for its own sake. Everything serves one feeling: pride. Celebrate the pride of a milestone earned and the promise of what's next.",
        purchasePsychology: "The version most families choose \u2014 timeless and universally loved. A natural centerpiece for a graduation party. Recommended as a Standard print. Made for the graduate and immediate family. (graduation)",
        heroPhoto: {
          photoId: "g1",
          filename: "grad_portrait.jpg",
          orientation: "portrait",
          score: 93,
          faceCount: 1,
          width: 4032,
          height: 5040
        },
        supportingPhotos: [
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
        layoutRecipe: {
          arrangement: "Central hero with a disciplined supporting grid",
          heroPlacement: "centered",
          heroDominanceRatio: 0.62,
          supportingLayout: "symmetrical grid beneath the hero",
          balance: "symmetrical",
          whitespace: "generous margins",
          focalPath: "single clear centered path",
          maxSupporting: 4
        },
        colorRecipe: {
          ground: "#C9A84C",
          accent: "#C9A84C",
          neutral: "#FAF8F3",
          palette: [
            {
              hex: "#C9A84C",
              role: "primary"
            },
            {
              hex: "#0C0E14",
              role: "support"
            },
            {
              hex: "#FAF8F3",
              role: "support"
            }
          ],
          source: "photos",
          guidance: "Restrained gold on obsidian; refined, high-contrast, timeless. Gold as a hairline accent only."
        },
        typographyRecipe: {
          style: "elegant",
          displayFont: "Cormorant Garamond",
          supportingFont: "Outfit",
          headlineTreatment: "elegant Cormorant Garamond display, high contrast, one headline",
          labelTreatment: "refined gold small-caps label",
          guidance: "Classic, confident hierarchy; distance- and print-readable."
        },
        recommendedProduct: "Standard print",
        sharePreview: {
          headline: "Celebrate the pride of a milestone earned and the promise of what's next.",
          caption: "I can\u2019t believe this came from our photos. \u{1F62E}",
          altText: "A Signature Edition CelebrateBanner graduation design, centered on the chosen hero photo with 3 supporting photos."
        },
        wowScore: 94,
        masterpiecePassed: true,
        scoreBreakdown: {
          heroStrength: 13.8,
          emotionalImpact: 20,
          storytelling: 12.4,
          layoutBalance: 15,
          typography: 9.9,
          colorHarmony: 9.9,
          luxuryFinish: 8.6,
          shareability: 4.5,
          total: 94
        },
        failureReasons: []
      },
      {
        conceptName: "Luxury Gold",
        title: "{Graduate Name}",
        subtitle: "Class of {Year}",
        creativeExplanation: "We made \u201Cgrad_portrait.jpg\u201D (portrait, quality 93/100) the star. Photo g1 (grad_portrait.jpg) is strongest: portrait, score 93, 1 clear subject. Luxury Gold lifts it into a cinematic spotlight with luxurious negative space and gold framing in #C9A84C, so the graduation feels as big as it was. 3 supporting photos were chosen only because they strengthen the hero and lead the eye back to it \u2014 beauty over quantity, nothing added for its own sake. Everything serves one feeling: pride. Celebrate the pride of a milestone earned and the promise of what's next.",
        purchasePsychology: "Best displayed as a framed keepsake; the gold reads richest at a large size, so it looks strongest at 24\xD736. Recommended as a Framed. Made for the graduate and immediate family. (graduation)",
        heroPhoto: {
          photoId: "g1",
          filename: "grad_portrait.jpg",
          orientation: "portrait",
          score: 93,
          faceCount: 1,
          width: 4032,
          height: 5040
        },
        supportingPhotos: [
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
        layoutRecipe: {
          arrangement: "Dramatic spotlighted hero with luxurious negative space",
          heroPlacement: "centered, spotlit",
          heroDominanceRatio: 0.68,
          supportingLayout: "minimal framed supporting row",
          balance: "symmetrical grandeur",
          whitespace: "luxurious",
          focalPath: "spotlight leads straight to the hero",
          maxSupporting: 3
        },
        colorRecipe: {
          ground: "#C9A84C",
          accent: "#C9A84C",
          neutral: "#FAF8F3",
          palette: [
            {
              hex: "#C9A84C",
              role: "primary"
            },
            {
              hex: "#0C0E14",
              role: "support"
            },
            {
              hex: "#FAF8F3",
              role: "support"
            }
          ],
          source: "photos",
          guidance: "Gold-forward on deep obsidian with glow accents on the hero \u2014 radiant metallic, never flooded."
        },
        typographyRecipe: {
          style: "elegant",
          displayFont: "Cormorant Garamond",
          supportingFont: "Outfit",
          headlineTreatment: "large Cormorant Garamond in gold gradient",
          labelTreatment: "letter-spaced small-caps gold label",
          guidance: "Formal and radiant; the most decorative type voice, still restrained."
        },
        recommendedProduct: "Framed",
        sharePreview: {
          headline: "Celebrate the pride of a milestone earned and the promise of what's next.",
          caption: "I can\u2019t believe this came from our photos. \u{1F62E}",
          altText: "A Luxury Gold CelebrateBanner graduation design, centered on the chosen hero photo with 3 supporting photos."
        },
        wowScore: 94,
        masterpiecePassed: true,
        scoreBreakdown: {
          heroStrength: 13.7,
          emotionalImpact: 20,
          storytelling: 12.2,
          layoutBalance: 14.5,
          typography: 9.7,
          colorHarmony: 10,
          luxuryFinish: 9.9,
          shareability: 4.6,
          total: 94
        },
        failureReasons: []
      },
      {
        conceptName: "Family Legacy",
        title: "{Graduate Name}",
        subtitle: "Class of {Year}",
        creativeExplanation: "We made \u201Cgrad_portrait.jpg\u201D (portrait, quality 93/100) the star. Photo g1 (grad_portrait.jpg) is strongest: portrait, score 93, 1 clear subject. Family Legacy arranges the memories as a warm story \u2014 anchor moments, then story builders \u2014 with room around every face, honoring the graduation across time. 3 supporting photos were chosen only because they strengthen the hero and lead the eye back to it \u2014 beauty over quantity, nothing added for its own sake. Everything serves one feeling: pride. Celebrate the pride of a milestone earned and the promise of what's next.",
        purchasePsychology: "Grandparents and extended family tend to love this one. It\u2019s made to be handed down. Recommended as a Framed. Made for the graduate and immediate family. (graduation)",
        heroPhoto: {
          photoId: "g1",
          filename: "grad_portrait.jpg",
          orientation: "portrait",
          score: 93,
          faceCount: 1,
          width: 4032,
          height: 5040
        },
        supportingPhotos: [
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
        layoutRecipe: {
          arrangement: "Narrative gathered-memories flow",
          heroPlacement: "anchored",
          heroDominanceRatio: 0.56,
          supportingLayout: "tiered story clusters (anchors \u2192 builders \u2192 accents)",
          balance: "balanced",
          whitespace: "warm, room around every face",
          focalPath: "hero first, then the journey",
          maxSupporting: 6
        },
        colorRecipe: {
          ground: "#C9A84C",
          accent: "#C9A84C",
          neutral: "#FAF8F3",
          palette: [
            {
              hex: "#C9A84C",
              role: "primary"
            },
            {
              hex: "#0C0E14",
              role: "support"
            },
            {
              hex: "#FAF8F3",
              role: "support"
            }
          ],
          source: "photos",
          guidance: "Warm layer within the brand core; soft, unifying, nostalgic. Gold used as gentle detail."
        },
        typographyRecipe: {
          style: "elegant",
          displayFont: "Cormorant Garamond",
          supportingFont: "Outfit",
          headlineTreatment: "warm classic serif display, approachable",
          labelTreatment: "humanist supporting labels, tasteful dates",
          guidance: "Heartfelt, legible; room to breathe around names."
        },
        recommendedProduct: "Framed",
        sharePreview: {
          headline: "Celebrate the pride of a milestone earned and the promise of what's next.",
          caption: "I can\u2019t believe this came from our photos. \u{1F62E}",
          altText: "A Family Legacy CelebrateBanner graduation design, centered on the chosen hero photo with 3 supporting photos."
        },
        wowScore: 94,
        masterpiecePassed: true,
        scoreBreakdown: {
          heroStrength: 13.3,
          emotionalImpact: 20,
          storytelling: 14.4,
          layoutBalance: 14.2,
          typography: 9.3,
          colorHarmony: 9.7,
          luxuryFinish: 8.4,
          shareability: 4.6,
          total: 94
        },
        failureReasons: []
      },
      {
        conceptName: "Modern Editorial",
        title: "{Graduate Name}",
        subtitle: "Class of {Year}",
        creativeExplanation: "We made \u201Cgrad_portrait.jpg\u201D (portrait, quality 93/100) the star. Photo g1 (grad_portrait.jpg) is strongest: portrait, score 93, 1 clear subject. Modern Editorial gives it magazine-cover scale and deliberate asymmetry, with bold negative space and strong type \u2014 the graduation, styled like a cover. 3 supporting photos were chosen only because they strengthen the hero and lead the eye back to it \u2014 beauty over quantity, nothing added for its own sake. Everything serves one feeling: pride. Celebrate the pride of a milestone earned and the promise of what's next.",
        purchasePsychology: "Made to share \u2014 it looks strongest on a phone screen and social feed before it ever reaches a wall. Recommended as a Digital download. Made for the graduate and immediate family. (graduation)",
        heroPhoto: {
          photoId: "g1",
          filename: "grad_portrait.jpg",
          orientation: "portrait",
          score: 93,
          faceCount: 1,
          width: 4032,
          height: 5040
        },
        supportingPhotos: [
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
        layoutRecipe: {
          arrangement: "Editorial asymmetry with an oversized hero",
          heroPlacement: "off-center",
          heroDominanceRatio: 0.66,
          supportingLayout: "off-grid supporting blocks",
          balance: "deliberate asymmetry",
          whitespace: "bold negative space",
          focalPath: "scale-led diagonal path",
          maxSupporting: 4
        },
        colorRecipe: {
          ground: "#C9A84C",
          accent: "#C9A84C",
          neutral: "#FAF8F3",
          palette: [
            {
              hex: "#C9A84C",
              role: "primary"
            },
            {
              hex: "#0C0E14",
              role: "support"
            },
            {
              hex: "#FAF8F3",
              role: "support"
            }
          ],
          source: "photos",
          guidance: "Sharpest contrast, a single disciplined accent; gold as highlight only."
        },
        typographyRecipe: {
          style: "elegant",
          displayFont: "Cormorant Garamond",
          supportingFont: "Outfit",
          headlineTreatment: "oversized confident display, tight tracking",
          labelTreatment: "bold sans labels; refined serif accent",
          guidance: "Type as composition; strong scale contrast, magazine-grade."
        },
        recommendedProduct: "Digital download",
        sharePreview: {
          headline: "Celebrate the pride of a milestone earned and the promise of what's next.",
          caption: "I can\u2019t believe this came from our photos. \u{1F62E}",
          altText: "A Modern Editorial CelebrateBanner graduation design, centered on the chosen hero photo with 3 supporting photos."
        },
        wowScore: 93,
        masterpiecePassed: true,
        scoreBreakdown: {
          heroStrength: 13.5,
          emotionalImpact: 20,
          storytelling: 12.2,
          layoutBalance: 14.8,
          typography: 10,
          colorHarmony: 9.5,
          luxuryFinish: 8.2,
          shareability: 5,
          total: 93
        },
        failureReasons: []
      }
    ]
  };

  // ../shared/wow-engine/fixtures/championship.json
  var championship_default = {
    schemaVersion: "1.0.0",
    version: "0.1.0",
    createdAt: null,
    occasion: "championship",
    recommendedConcept: "Luxury Gold",
    masterpiecePassed: true,
    overallWOWScore: 92,
    concepts: [
      {
        conceptName: "Signature Edition",
        title: "{Team} \u2014 Champions",
        subtitle: "{Year} {Title}",
        creativeExplanation: "We made \u201Ctrophy_lift.jpg\u201D (portrait, quality 93/100) the star. Photo c1 (trophy_lift.jpg) is strongest: portrait, score 93, 1 clear subject. Signature Edition centers it with symmetrical balance and expansive whitespace, framed with restraint in #C9A84C on #0C0E14 \u2014 timeless, so this championship still feels right in ten years. 3 supporting photos were chosen only because they strengthen the hero and lead the eye back to it \u2014 beauty over quantity, nothing added for its own sake. Everything serves one feeling: victory. Capture the roar of victory and the unity that earned it.",
        purchasePsychology: "The version most families choose \u2014 timeless and universally loved. A natural centerpiece for a championship celebration. Recommended as a Standard print. Made for the team, players, and their families. (championship)",
        heroPhoto: {
          photoId: "c1",
          filename: "trophy_lift.jpg",
          orientation: "portrait",
          score: 93,
          faceCount: 1,
          width: 5e3,
          height: 6250
        },
        supportingPhotos: [
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
        layoutRecipe: {
          arrangement: "Central hero with a disciplined supporting grid",
          heroPlacement: "centered",
          heroDominanceRatio: 0.62,
          supportingLayout: "symmetrical grid beneath the hero",
          balance: "symmetrical",
          whitespace: "generous margins",
          focalPath: "single clear centered path",
          maxSupporting: 4
        },
        colorRecipe: {
          ground: "#0C0E14",
          accent: "#C9A84C",
          neutral: "#FAF8F3",
          palette: [
            {
              hex: "#0C0E14",
              role: "primary"
            },
            {
              hex: "#C9A84C",
              role: "accent"
            },
            {
              hex: "#FAF8F3",
              role: "neutral"
            }
          ],
          source: "photos",
          guidance: "Restrained gold on obsidian; refined, high-contrast, timeless. Gold as a hairline accent only."
        },
        typographyRecipe: {
          style: "bold",
          displayFont: "Cormorant Garamond",
          supportingFont: "Outfit",
          headlineTreatment: "elegant Cormorant Garamond display, high contrast, one headline",
          labelTreatment: "refined gold small-caps label",
          guidance: "Classic, confident hierarchy; distance- and print-readable."
        },
        recommendedProduct: "Standard print",
        sharePreview: {
          headline: "Capture the roar of victory and the unity that earned it.",
          caption: "I can\u2019t believe this came from our photos. \u{1F62E}",
          altText: "A Signature Edition CelebrateBanner championship design, centered on the chosen hero photo with 3 supporting photos."
        },
        wowScore: 92,
        masterpiecePassed: true,
        scoreBreakdown: {
          heroStrength: 13.8,
          emotionalImpact: 20,
          storytelling: 11.7,
          layoutBalance: 14.4,
          typography: 9.9,
          colorHarmony: 9.9,
          luxuryFinish: 8.2,
          shareability: 4.5,
          total: 92
        },
        failureReasons: []
      },
      {
        conceptName: "Luxury Gold",
        title: "{Team} \u2014 Champions",
        subtitle: "{Year} {Title}",
        creativeExplanation: "We made \u201Ctrophy_lift.jpg\u201D (portrait, quality 93/100) the star. Photo c1 (trophy_lift.jpg) is strongest: portrait, score 93, 1 clear subject. Luxury Gold lifts it into a cinematic spotlight with luxurious negative space and gold framing in #C9A84C, so the championship feels as big as it was. 3 supporting photos were chosen only because they strengthen the hero and lead the eye back to it \u2014 beauty over quantity, nothing added for its own sake. Everything serves one feeling: victory. Capture the roar of victory and the unity that earned it.",
        purchasePsychology: "Best displayed as a framed keepsake; the gold reads richest at a large size, so it looks strongest at 24\xD736. Recommended as a Framed. Made for the team, players, and their families. (championship)",
        heroPhoto: {
          photoId: "c1",
          filename: "trophy_lift.jpg",
          orientation: "portrait",
          score: 93,
          faceCount: 1,
          width: 5e3,
          height: 6250
        },
        supportingPhotos: [
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
        layoutRecipe: {
          arrangement: "Dramatic spotlighted hero with luxurious negative space",
          heroPlacement: "centered, spotlit",
          heroDominanceRatio: 0.68,
          supportingLayout: "minimal framed supporting row",
          balance: "symmetrical grandeur",
          whitespace: "luxurious",
          focalPath: "spotlight leads straight to the hero",
          maxSupporting: 3
        },
        colorRecipe: {
          ground: "#0C0E14",
          accent: "#C9A84C",
          neutral: "#FAF8F3",
          palette: [
            {
              hex: "#0C0E14",
              role: "primary"
            },
            {
              hex: "#C9A84C",
              role: "accent"
            },
            {
              hex: "#FAF8F3",
              role: "neutral"
            }
          ],
          source: "photos",
          guidance: "Gold-forward on deep obsidian with glow accents on the hero \u2014 radiant metallic, never flooded."
        },
        typographyRecipe: {
          style: "bold",
          displayFont: "Cormorant Garamond",
          supportingFont: "Outfit",
          headlineTreatment: "large Cormorant Garamond in gold gradient",
          labelTreatment: "letter-spaced small-caps gold label",
          guidance: "Formal and radiant; the most decorative type voice, still restrained."
        },
        recommendedProduct: "Framed",
        sharePreview: {
          headline: "Capture the roar of victory and the unity that earned it.",
          caption: "I can\u2019t believe this came from our photos. \u{1F62E}",
          altText: "A Luxury Gold CelebrateBanner championship design, centered on the chosen hero photo with 3 supporting photos."
        },
        wowScore: 92,
        masterpiecePassed: true,
        scoreBreakdown: {
          heroStrength: 13.7,
          emotionalImpact: 20,
          storytelling: 11.5,
          layoutBalance: 13.6,
          typography: 9.7,
          colorHarmony: 10,
          luxuryFinish: 9.4,
          shareability: 4.6,
          total: 92
        },
        failureReasons: []
      },
      {
        conceptName: "Family Legacy",
        title: "{Team} \u2014 Champions",
        subtitle: "{Year} {Title}",
        creativeExplanation: "We made \u201Ctrophy_lift.jpg\u201D (portrait, quality 93/100) the star. Photo c1 (trophy_lift.jpg) is strongest: portrait, score 93, 1 clear subject. Family Legacy arranges the memories as a warm story \u2014 anchor moments, then story builders \u2014 with room around every face, honoring the championship across time. 3 supporting photos were chosen only because they strengthen the hero and lead the eye back to it \u2014 beauty over quantity, nothing added for its own sake. Everything serves one feeling: victory. Capture the roar of victory and the unity that earned it.",
        purchasePsychology: "Grandparents and extended family tend to love this one. It\u2019s made to be handed down. Recommended as a Framed. Made for the team, players, and their families. (championship)",
        heroPhoto: {
          photoId: "c1",
          filename: "trophy_lift.jpg",
          orientation: "portrait",
          score: 93,
          faceCount: 1,
          width: 5e3,
          height: 6250
        },
        supportingPhotos: [
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
        layoutRecipe: {
          arrangement: "Narrative gathered-memories flow",
          heroPlacement: "anchored",
          heroDominanceRatio: 0.56,
          supportingLayout: "tiered story clusters (anchors \u2192 builders \u2192 accents)",
          balance: "balanced",
          whitespace: "warm, room around every face",
          focalPath: "hero first, then the journey",
          maxSupporting: 6
        },
        colorRecipe: {
          ground: "#0C0E14",
          accent: "#C9A84C",
          neutral: "#FAF8F3",
          palette: [
            {
              hex: "#0C0E14",
              role: "primary"
            },
            {
              hex: "#C9A84C",
              role: "accent"
            },
            {
              hex: "#FAF8F3",
              role: "neutral"
            }
          ],
          source: "photos",
          guidance: "Warm layer within the brand core; soft, unifying, nostalgic. Gold used as gentle detail."
        },
        typographyRecipe: {
          style: "bold",
          displayFont: "Cormorant Garamond",
          supportingFont: "Outfit",
          headlineTreatment: "warm classic serif display, approachable",
          labelTreatment: "humanist supporting labels, tasteful dates",
          guidance: "Heartfelt, legible; room to breathe around names."
        },
        recommendedProduct: "Framed",
        sharePreview: {
          headline: "Capture the roar of victory and the unity that earned it.",
          caption: "I can\u2019t believe this came from our photos. \u{1F62E}",
          altText: "A Family Legacy CelebrateBanner championship design, centered on the chosen hero photo with 3 supporting photos."
        },
        wowScore: 92,
        masterpiecePassed: true,
        scoreBreakdown: {
          heroStrength: 13.3,
          emotionalImpact: 20,
          storytelling: 13.6,
          layoutBalance: 13.3,
          typography: 9.3,
          colorHarmony: 9.7,
          luxuryFinish: 8,
          shareability: 4.6,
          total: 92
        },
        failureReasons: []
      },
      {
        conceptName: "Modern Editorial",
        title: "{Team} \u2014 Champions",
        subtitle: "{Year} {Title}",
        creativeExplanation: "We made \u201Ctrophy_lift.jpg\u201D (portrait, quality 93/100) the star. Photo c1 (trophy_lift.jpg) is strongest: portrait, score 93, 1 clear subject. Modern Editorial gives it magazine-cover scale and deliberate asymmetry, with bold negative space and strong type \u2014 the championship, styled like a cover. 3 supporting photos were chosen only because they strengthen the hero and lead the eye back to it \u2014 beauty over quantity, nothing added for its own sake. Everything serves one feeling: victory. Capture the roar of victory and the unity that earned it.",
        purchasePsychology: "Made to share \u2014 it looks strongest on a phone screen and social feed before it ever reaches a wall. Recommended as a Digital download. Made for the team, players, and their families. (championship)",
        heroPhoto: {
          photoId: "c1",
          filename: "trophy_lift.jpg",
          orientation: "portrait",
          score: 93,
          faceCount: 1,
          width: 5e3,
          height: 6250
        },
        supportingPhotos: [
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
        layoutRecipe: {
          arrangement: "Editorial asymmetry with an oversized hero",
          heroPlacement: "off-center",
          heroDominanceRatio: 0.66,
          supportingLayout: "off-grid supporting blocks",
          balance: "deliberate asymmetry",
          whitespace: "bold negative space",
          focalPath: "scale-led diagonal path",
          maxSupporting: 4
        },
        colorRecipe: {
          ground: "#0C0E14",
          accent: "#C9A84C",
          neutral: "#FAF8F3",
          palette: [
            {
              hex: "#0C0E14",
              role: "primary"
            },
            {
              hex: "#C9A84C",
              role: "accent"
            },
            {
              hex: "#FAF8F3",
              role: "neutral"
            }
          ],
          source: "photos",
          guidance: "Sharpest contrast, a single disciplined accent; gold as highlight only."
        },
        typographyRecipe: {
          style: "bold",
          displayFont: "Cormorant Garamond",
          supportingFont: "Outfit",
          headlineTreatment: "oversized confident display, tight tracking",
          labelTreatment: "bold sans labels; refined serif accent",
          guidance: "Type as composition; strong scale contrast, magazine-grade."
        },
        recommendedProduct: "Digital download",
        sharePreview: {
          headline: "Capture the roar of victory and the unity that earned it.",
          caption: "I can\u2019t believe this came from our photos. \u{1F62E}",
          altText: "A Modern Editorial CelebrateBanner championship design, centered on the chosen hero photo with 3 supporting photos."
        },
        wowScore: 91,
        masterpiecePassed: true,
        scoreBreakdown: {
          heroStrength: 13.5,
          emotionalImpact: 20,
          storytelling: 11.5,
          layoutBalance: 13.9,
          typography: 10,
          colorHarmony: 9.5,
          luxuryFinish: 7.8,
          shareability: 5,
          total: 91
        },
        failureReasons: []
      }
    ]
  };

  // ../shared/wow-engine/fixtures/family.json
  var family_default = {
    schemaVersion: "1.0.0",
    version: "0.1.0",
    createdAt: null,
    occasion: "family_reunion",
    recommendedConcept: "Family Legacy",
    masterpiecePassed: true,
    overallWOWScore: 93,
    concepts: [
      {
        conceptName: "Signature Edition",
        title: "The {Family} Family",
        subtitle: "{Year} Reunion",
        creativeExplanation: "We made \u201Cgrandparents.jpg\u201D (portrait, quality 85/100) the star. Photo f1 (grandparents.jpg) is strongest: portrait, score 85, 2 subjects. Signature Edition centers it with organic balance and warm-generous whitespace, framed with restraint in #C9A84C on #0C0E14 \u2014 timeless, so this family reunion still feels right in ten years. 4 supporting photos were chosen only because they strengthen the hero and lead the eye back to it \u2014 beauty over quantity, nothing added for its own sake. Everything serves one feeling: warmth. Gather generations in warmth and belonging.",
        purchasePsychology: "The version most families choose \u2014 timeless and universally loved. A natural centerpiece for a family reunion. Recommended as a Framed. Made for the extended family. (family reunion)",
        heroPhoto: {
          photoId: "f1",
          filename: "grandparents.jpg",
          orientation: "portrait",
          score: 85,
          faceCount: 2,
          width: 4e3,
          height: 5e3
        },
        supportingPhotos: [
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
        layoutRecipe: {
          arrangement: "Central hero with a disciplined supporting grid",
          heroPlacement: "centered",
          heroDominanceRatio: 0.55,
          supportingLayout: "symmetrical grid beneath the hero",
          balance: "symmetrical",
          whitespace: "generous margins",
          focalPath: "single clear centered path",
          maxSupporting: 4
        },
        colorRecipe: {
          ground: "#0C0E14",
          accent: "#C9A84C",
          neutral: "#FAF8F3",
          palette: [
            {
              hex: "#0C0E14",
              role: "primary"
            },
            {
              hex: "#C9A84C",
              role: "accent"
            },
            {
              hex: "#FAF8F3",
              role: "support"
            }
          ],
          source: "occasion-default",
          guidance: "Restrained gold on obsidian; refined, high-contrast, timeless. Gold as a hairline accent only."
        },
        typographyRecipe: {
          style: "legacy",
          displayFont: "Cormorant Garamond",
          supportingFont: "Outfit",
          headlineTreatment: "elegant Cormorant Garamond display, high contrast, one headline",
          labelTreatment: "refined gold small-caps label",
          guidance: "Classic, confident hierarchy; distance- and print-readable."
        },
        recommendedProduct: "Framed",
        sharePreview: {
          headline: "Gather generations in warmth and belonging.",
          caption: "I can\u2019t believe this came from our photos. \u{1F62E}",
          altText: "A Signature Edition CelebrateBanner family reunion design, centered on the chosen hero photo with 4 supporting photos."
        },
        wowScore: 93,
        masterpiecePassed: true,
        scoreBreakdown: {
          heroStrength: 12.6,
          emotionalImpact: 19.7,
          storytelling: 14,
          layoutBalance: 15,
          typography: 9.9,
          colorHarmony: 9,
          luxuryFinish: 8.4,
          shareability: 4.5,
          total: 93
        },
        failureReasons: []
      },
      {
        conceptName: "Luxury Gold",
        title: "The {Family} Family",
        subtitle: "{Year} Reunion",
        creativeExplanation: "We made \u201Cgrandparents.jpg\u201D (portrait, quality 85/100) the star. Photo f1 (grandparents.jpg) is strongest: portrait, score 85, 2 subjects. Luxury Gold lifts it into a cinematic spotlight with luxurious negative space and gold framing in #C9A84C, so the family reunion feels as big as it was. 4 supporting photos were chosen only because they strengthen the hero and lead the eye back to it \u2014 beauty over quantity, nothing added for its own sake. Everything serves one feeling: warmth. Gather generations in warmth and belonging.",
        purchasePsychology: "Best displayed as a framed keepsake; the gold reads richest at a large size, so it looks strongest at 24\xD736. Recommended as a Framed. Made for the extended family. (family reunion)",
        heroPhoto: {
          photoId: "f1",
          filename: "grandparents.jpg",
          orientation: "portrait",
          score: 85,
          faceCount: 2,
          width: 4e3,
          height: 5e3
        },
        supportingPhotos: [
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
          }
        ],
        layoutRecipe: {
          arrangement: "Dramatic spotlighted hero with luxurious negative space",
          heroPlacement: "centered, spotlit",
          heroDominanceRatio: 0.61,
          supportingLayout: "minimal framed supporting row",
          balance: "symmetrical grandeur",
          whitespace: "luxurious",
          focalPath: "spotlight leads straight to the hero",
          maxSupporting: 3
        },
        colorRecipe: {
          ground: "#0C0E14",
          accent: "#C9A84C",
          neutral: "#FAF8F3",
          palette: [
            {
              hex: "#0C0E14",
              role: "primary"
            },
            {
              hex: "#C9A84C",
              role: "accent"
            },
            {
              hex: "#FAF8F3",
              role: "support"
            }
          ],
          source: "occasion-default",
          guidance: "Gold-forward on deep obsidian with glow accents on the hero \u2014 radiant metallic, never flooded."
        },
        typographyRecipe: {
          style: "legacy",
          displayFont: "Cormorant Garamond",
          supportingFont: "Outfit",
          headlineTreatment: "large Cormorant Garamond in gold gradient",
          labelTreatment: "letter-spaced small-caps gold label",
          guidance: "Formal and radiant; the most decorative type voice, still restrained."
        },
        recommendedProduct: "Framed",
        sharePreview: {
          headline: "Gather generations in warmth and belonging.",
          caption: "I can\u2019t believe this came from our photos. \u{1F62E}",
          altText: "A Luxury Gold CelebrateBanner family reunion design, centered on the chosen hero photo with 4 supporting photos."
        },
        wowScore: 94,
        masterpiecePassed: true,
        scoreBreakdown: {
          heroStrength: 12.4,
          emotionalImpact: 20,
          storytelling: 13.7,
          layoutBalance: 14.2,
          typography: 9.7,
          colorHarmony: 9.2,
          luxuryFinish: 9.8,
          shareability: 4.5,
          total: 94
        },
        failureReasons: []
      },
      {
        conceptName: "Family Legacy",
        title: "The {Family} Family",
        subtitle: "{Year} Reunion",
        creativeExplanation: "We made \u201Cgrandparents.jpg\u201D (portrait, quality 85/100) the star. Photo f1 (grandparents.jpg) is strongest: portrait, score 85, 2 subjects. Family Legacy arranges the memories as a warm story \u2014 anchor moments, then story builders \u2014 with room around every face, honoring the family reunion across time. 4 supporting photos were chosen only because they strengthen the hero and lead the eye back to it \u2014 beauty over quantity, nothing added for its own sake. Everything serves one feeling: warmth. Gather generations in warmth and belonging.",
        purchasePsychology: "Grandparents and extended family tend to love this one. It\u2019s made to be handed down. Recommended as a Framed. Made for the extended family. (family reunion)",
        heroPhoto: {
          photoId: "f1",
          filename: "grandparents.jpg",
          orientation: "portrait",
          score: 85,
          faceCount: 2,
          width: 4e3,
          height: 5e3
        },
        supportingPhotos: [
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
        layoutRecipe: {
          arrangement: "Narrative gathered-memories flow",
          heroPlacement: "anchored",
          heroDominanceRatio: 0.49,
          supportingLayout: "tiered story clusters (anchors \u2192 builders \u2192 accents)",
          balance: "balanced",
          whitespace: "warm, room around every face",
          focalPath: "hero first, then the journey",
          maxSupporting: 6
        },
        colorRecipe: {
          ground: "#0C0E14",
          accent: "#C9A84C",
          neutral: "#FAF8F3",
          palette: [
            {
              hex: "#0C0E14",
              role: "primary"
            },
            {
              hex: "#C9A84C",
              role: "accent"
            },
            {
              hex: "#FAF8F3",
              role: "support"
            }
          ],
          source: "occasion-default",
          guidance: "Warm layer within the brand core; soft, unifying, nostalgic. Gold used as gentle detail."
        },
        typographyRecipe: {
          style: "legacy",
          displayFont: "Cormorant Garamond",
          supportingFont: "Outfit",
          headlineTreatment: "warm classic serif display, approachable",
          labelTreatment: "humanist supporting labels, tasteful dates",
          guidance: "Heartfelt, legible; room to breathe around names."
        },
        recommendedProduct: "Framed",
        sharePreview: {
          headline: "Gather generations in warmth and belonging.",
          caption: "I can\u2019t believe this came from our photos. \u{1F62E}",
          altText: "A Family Legacy CelebrateBanner family reunion design, centered on the chosen hero photo with 4 supporting photos."
        },
        wowScore: 92,
        masterpiecePassed: true,
        scoreBreakdown: {
          heroStrength: 12.1,
          emotionalImpact: 20,
          storytelling: 15,
          layoutBalance: 13.9,
          typography: 9.3,
          colorHarmony: 8.9,
          luxuryFinish: 8.3,
          shareability: 4.5,
          total: 92
        },
        failureReasons: []
      },
      {
        conceptName: "Modern Editorial",
        title: "The {Family} Family",
        subtitle: "{Year} Reunion",
        creativeExplanation: "We made \u201Cgrandparents.jpg\u201D (portrait, quality 85/100) the star. Photo f1 (grandparents.jpg) is strongest: portrait, score 85, 2 subjects. Modern Editorial gives it magazine-cover scale and deliberate asymmetry, with bold negative space and strong type \u2014 the family reunion, styled like a cover. 4 supporting photos were chosen only because they strengthen the hero and lead the eye back to it \u2014 beauty over quantity, nothing added for its own sake. Everything serves one feeling: warmth. Gather generations in warmth and belonging.",
        purchasePsychology: "Made to share \u2014 it looks strongest on a phone screen and social feed before it ever reaches a wall. Recommended as a Digital download. Made for the extended family. (family reunion)",
        heroPhoto: {
          photoId: "f1",
          filename: "grandparents.jpg",
          orientation: "portrait",
          score: 85,
          faceCount: 2,
          width: 4e3,
          height: 5e3
        },
        supportingPhotos: [
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
        layoutRecipe: {
          arrangement: "Editorial asymmetry with an oversized hero",
          heroPlacement: "off-center",
          heroDominanceRatio: 0.59,
          supportingLayout: "off-grid supporting blocks",
          balance: "deliberate asymmetry",
          whitespace: "bold negative space",
          focalPath: "scale-led diagonal path",
          maxSupporting: 4
        },
        colorRecipe: {
          ground: "#0C0E14",
          accent: "#C9A84C",
          neutral: "#FAF8F3",
          palette: [
            {
              hex: "#0C0E14",
              role: "primary"
            },
            {
              hex: "#C9A84C",
              role: "accent"
            },
            {
              hex: "#FAF8F3",
              role: "support"
            }
          ],
          source: "occasion-default",
          guidance: "Sharpest contrast, a single disciplined accent; gold as highlight only."
        },
        typographyRecipe: {
          style: "legacy",
          displayFont: "Cormorant Garamond",
          supportingFont: "Outfit",
          headlineTreatment: "oversized confident display, tight tracking",
          labelTreatment: "bold sans labels; refined serif accent",
          guidance: "Type as composition; strong scale contrast, magazine-grade."
        },
        recommendedProduct: "Digital download",
        sharePreview: {
          headline: "Gather generations in warmth and belonging.",
          caption: "I can\u2019t believe this came from our photos. \u{1F62E}",
          altText: "A Modern Editorial CelebrateBanner family reunion design, centered on the chosen hero photo with 4 supporting photos."
        },
        wowScore: 92,
        masterpiecePassed: true,
        scoreBreakdown: {
          heroStrength: 12.3,
          emotionalImpact: 19.7,
          storytelling: 13.7,
          layoutBalance: 14.5,
          typography: 10,
          colorHarmony: 8.7,
          luxuryFinish: 8.1,
          shareability: 5,
          total: 92
        },
        failureReasons: []
      }
    ]
  };

  // ../shared/wow-engine/fixtures/wedding.json
  var wedding_default = {
    schemaVersion: "1.0.0",
    version: "0.1.0",
    createdAt: null,
    occasion: "wedding",
    recommendedConcept: "Signature Edition",
    masterpiecePassed: true,
    overallWOWScore: 93,
    concepts: [
      {
        conceptName: "Signature Edition",
        title: "{Couple Names}",
        subtitle: "{Wedding Date}",
        creativeExplanation: "We made \u201Cfirst_kiss.jpg\u201D (portrait, quality 88/100) the star. Photo w1 (first_kiss.jpg) is strongest: portrait, score 88, 2 subjects. Signature Edition centers it with symmetrical balance and generous whitespace, framed with restraint in #FAF8F3 on #FAF8F3 \u2014 timeless, so this wedding day still feels right in ten years. 3 supporting photos were chosen only because they strengthen the hero and lead the eye back to it \u2014 beauty over quantity, nothing added for its own sake. Everything serves one feeling: romance. Tell a love story with elegance and timeless grace.",
        purchasePsychology: "The version most families choose \u2014 timeless and universally loved. A natural centerpiece for a wedding reception. Recommended as a Framed. Made for the couple and their families. (wedding day)",
        heroPhoto: {
          photoId: "w1",
          filename: "first_kiss.jpg",
          orientation: "portrait",
          score: 88,
          faceCount: 2,
          width: 4480,
          height: 6720
        },
        supportingPhotos: [
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
        layoutRecipe: {
          arrangement: "Central hero with a disciplined supporting grid",
          heroPlacement: "centered",
          heroDominanceRatio: 0.62,
          supportingLayout: "symmetrical grid beneath the hero",
          balance: "symmetrical",
          whitespace: "generous margins",
          focalPath: "single clear centered path",
          maxSupporting: 4
        },
        colorRecipe: {
          ground: "#FAF8F3",
          accent: "#FAF8F3",
          neutral: "#FAF8F3",
          palette: [
            {
              hex: "#FAF8F3",
              role: "primary"
            },
            {
              hex: "#C9A84C",
              role: "support"
            },
            {
              hex: "#0C0E14",
              role: "ground"
            }
          ],
          source: "photos",
          guidance: "Restrained gold on obsidian; refined, high-contrast, timeless. Gold as a hairline accent only."
        },
        typographyRecipe: {
          style: "elegant",
          displayFont: "Cormorant Garamond",
          supportingFont: "Outfit",
          headlineTreatment: "elegant Cormorant Garamond display, high contrast, one headline",
          labelTreatment: "refined gold small-caps label",
          guidance: "Classic, confident hierarchy; distance- and print-readable."
        },
        recommendedProduct: "Framed",
        sharePreview: {
          headline: "Tell a love story with elegance and timeless grace.",
          caption: "I can\u2019t believe this came from our photos. \u{1F62E}",
          altText: "A Signature Edition CelebrateBanner wedding day design, centered on the chosen hero photo with 3 supporting photos."
        },
        wowScore: 93,
        masterpiecePassed: true,
        scoreBreakdown: {
          heroStrength: 13.1,
          emotionalImpact: 20,
          storytelling: 11.7,
          layoutBalance: 15,
          typography: 9.9,
          colorHarmony: 9.9,
          luxuryFinish: 8.6,
          shareability: 4.5,
          total: 93
        },
        failureReasons: []
      },
      {
        conceptName: "Luxury Gold",
        title: "{Couple Names}",
        subtitle: "{Wedding Date}",
        creativeExplanation: "We made \u201Cfirst_kiss.jpg\u201D (portrait, quality 88/100) the star. Photo w1 (first_kiss.jpg) is strongest: portrait, score 88, 2 subjects. Luxury Gold lifts it into a cinematic spotlight with luxurious negative space and gold framing in #FAF8F3, so the wedding day feels as big as it was. 3 supporting photos were chosen only because they strengthen the hero and lead the eye back to it \u2014 beauty over quantity, nothing added for its own sake. Everything serves one feeling: romance. Tell a love story with elegance and timeless grace.",
        purchasePsychology: "Best displayed as a framed keepsake; the gold reads richest at a large size, so it looks strongest at 24\xD736. Recommended as a Framed. Made for the couple and their families. (wedding day)",
        heroPhoto: {
          photoId: "w1",
          filename: "first_kiss.jpg",
          orientation: "portrait",
          score: 88,
          faceCount: 2,
          width: 4480,
          height: 6720
        },
        supportingPhotos: [
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
        layoutRecipe: {
          arrangement: "Dramatic spotlighted hero with luxurious negative space",
          heroPlacement: "centered, spotlit",
          heroDominanceRatio: 0.68,
          supportingLayout: "minimal framed supporting row",
          balance: "symmetrical grandeur",
          whitespace: "luxurious",
          focalPath: "spotlight leads straight to the hero",
          maxSupporting: 3
        },
        colorRecipe: {
          ground: "#FAF8F3",
          accent: "#FAF8F3",
          neutral: "#FAF8F3",
          palette: [
            {
              hex: "#FAF8F3",
              role: "primary"
            },
            {
              hex: "#C9A84C",
              role: "support"
            },
            {
              hex: "#0C0E14",
              role: "ground"
            }
          ],
          source: "photos",
          guidance: "Gold-forward on deep obsidian with glow accents on the hero \u2014 radiant metallic, never flooded."
        },
        typographyRecipe: {
          style: "elegant",
          displayFont: "Cormorant Garamond",
          supportingFont: "Outfit",
          headlineTreatment: "large Cormorant Garamond in gold gradient",
          labelTreatment: "letter-spaced small-caps gold label",
          guidance: "Formal and radiant; the most decorative type voice, still restrained."
        },
        recommendedProduct: "Framed",
        sharePreview: {
          headline: "Tell a love story with elegance and timeless grace.",
          caption: "I can\u2019t believe this came from our photos. \u{1F62E}",
          altText: "A Luxury Gold CelebrateBanner wedding day design, centered on the chosen hero photo with 3 supporting photos."
        },
        wowScore: 93,
        masterpiecePassed: true,
        scoreBreakdown: {
          heroStrength: 13,
          emotionalImpact: 20,
          storytelling: 11.5,
          layoutBalance: 14.5,
          typography: 9.7,
          colorHarmony: 10,
          luxuryFinish: 9.9,
          shareability: 4.6,
          total: 93
        },
        failureReasons: []
      },
      {
        conceptName: "Family Legacy",
        title: "{Couple Names}",
        subtitle: "{Wedding Date}",
        creativeExplanation: "We made \u201Cfirst_kiss.jpg\u201D (portrait, quality 88/100) the star. Photo w1 (first_kiss.jpg) is strongest: portrait, score 88, 2 subjects. Family Legacy arranges the memories as a warm story \u2014 anchor moments, then story builders \u2014 with room around every face, honoring the wedding day across time. 3 supporting photos were chosen only because they strengthen the hero and lead the eye back to it \u2014 beauty over quantity, nothing added for its own sake. Everything serves one feeling: romance. Tell a love story with elegance and timeless grace.",
        purchasePsychology: "Grandparents and extended family tend to love this one. It\u2019s made to be handed down. Recommended as a Framed. Made for the couple and their families. (wedding day)",
        heroPhoto: {
          photoId: "w1",
          filename: "first_kiss.jpg",
          orientation: "portrait",
          score: 88,
          faceCount: 2,
          width: 4480,
          height: 6720
        },
        supportingPhotos: [
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
        layoutRecipe: {
          arrangement: "Narrative gathered-memories flow",
          heroPlacement: "anchored",
          heroDominanceRatio: 0.56,
          supportingLayout: "tiered story clusters (anchors \u2192 builders \u2192 accents)",
          balance: "balanced",
          whitespace: "warm, room around every face",
          focalPath: "hero first, then the journey",
          maxSupporting: 6
        },
        colorRecipe: {
          ground: "#FAF8F3",
          accent: "#FAF8F3",
          neutral: "#FAF8F3",
          palette: [
            {
              hex: "#FAF8F3",
              role: "primary"
            },
            {
              hex: "#C9A84C",
              role: "support"
            },
            {
              hex: "#0C0E14",
              role: "ground"
            }
          ],
          source: "photos",
          guidance: "Warm layer within the brand core; soft, unifying, nostalgic. Gold used as gentle detail."
        },
        typographyRecipe: {
          style: "elegant",
          displayFont: "Cormorant Garamond",
          supportingFont: "Outfit",
          headlineTreatment: "warm classic serif display, approachable",
          labelTreatment: "humanist supporting labels, tasteful dates",
          guidance: "Heartfelt, legible; room to breathe around names."
        },
        recommendedProduct: "Framed",
        sharePreview: {
          headline: "Tell a love story with elegance and timeless grace.",
          caption: "I can\u2019t believe this came from our photos. \u{1F62E}",
          altText: "A Family Legacy CelebrateBanner wedding day design, centered on the chosen hero photo with 3 supporting photos."
        },
        wowScore: 92,
        masterpiecePassed: true,
        scoreBreakdown: {
          heroStrength: 12.6,
          emotionalImpact: 20,
          storytelling: 13.6,
          layoutBalance: 14.2,
          typography: 9.3,
          colorHarmony: 9.7,
          luxuryFinish: 8.4,
          shareability: 4.6,
          total: 92
        },
        failureReasons: []
      },
      {
        conceptName: "Modern Editorial",
        title: "{Couple Names}",
        subtitle: "{Wedding Date}",
        creativeExplanation: "We made \u201Cfirst_kiss.jpg\u201D (portrait, quality 88/100) the star. Photo w1 (first_kiss.jpg) is strongest: portrait, score 88, 2 subjects. Modern Editorial gives it magazine-cover scale and deliberate asymmetry, with bold negative space and strong type \u2014 the wedding day, styled like a cover. 3 supporting photos were chosen only because they strengthen the hero and lead the eye back to it \u2014 beauty over quantity, nothing added for its own sake. Everything serves one feeling: romance. Tell a love story with elegance and timeless grace.",
        purchasePsychology: "Made to share \u2014 it looks strongest on a phone screen and social feed before it ever reaches a wall. Recommended as a Digital download. Made for the couple and their families. (wedding day)",
        heroPhoto: {
          photoId: "w1",
          filename: "first_kiss.jpg",
          orientation: "portrait",
          score: 88,
          faceCount: 2,
          width: 4480,
          height: 6720
        },
        supportingPhotos: [
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
        layoutRecipe: {
          arrangement: "Editorial asymmetry with an oversized hero",
          heroPlacement: "off-center",
          heroDominanceRatio: 0.66,
          supportingLayout: "off-grid supporting blocks",
          balance: "deliberate asymmetry",
          whitespace: "bold negative space",
          focalPath: "scale-led diagonal path",
          maxSupporting: 4
        },
        colorRecipe: {
          ground: "#FAF8F3",
          accent: "#FAF8F3",
          neutral: "#FAF8F3",
          palette: [
            {
              hex: "#FAF8F3",
              role: "primary"
            },
            {
              hex: "#C9A84C",
              role: "support"
            },
            {
              hex: "#0C0E14",
              role: "ground"
            }
          ],
          source: "photos",
          guidance: "Sharpest contrast, a single disciplined accent; gold as highlight only."
        },
        typographyRecipe: {
          style: "elegant",
          displayFont: "Cormorant Garamond",
          supportingFont: "Outfit",
          headlineTreatment: "oversized confident display, tight tracking",
          labelTreatment: "bold sans labels; refined serif accent",
          guidance: "Type as composition; strong scale contrast, magazine-grade."
        },
        recommendedProduct: "Digital download",
        sharePreview: {
          headline: "Tell a love story with elegance and timeless grace.",
          caption: "I can\u2019t believe this came from our photos. \u{1F62E}",
          altText: "A Modern Editorial CelebrateBanner wedding day design, centered on the chosen hero photo with 3 supporting photos."
        },
        wowScore: 92,
        masterpiecePassed: true,
        scoreBreakdown: {
          heroStrength: 12.9,
          emotionalImpact: 20,
          storytelling: 11.5,
          layoutBalance: 14.8,
          typography: 10,
          colorHarmony: 9.5,
          luxuryFinish: 8.2,
          shareability: 5,
          total: 92
        },
        failureReasons: []
      }
    ]
  };

  // ../shared/wow-engine/fixtures/memorial.json
  var memorial_default = {
    schemaVersion: "1.0.0",
    version: "0.1.0",
    createdAt: null,
    occasion: "memorial",
    recommendedConcept: "Family Legacy",
    masterpiecePassed: true,
    overallWOWScore: 93,
    concepts: [
      {
        conceptName: "Signature Edition",
        title: "{Full Name}",
        subtitle: "{Birth Year} \u2013 {Year}",
        creativeExplanation: "We made \u201Cportrait_smiling.jpg\u201D (portrait, quality 85/100) the star. Photo m1 (portrait_smiling.jpg) is strongest: portrait, score 85, 1 clear subject. Signature Edition centers it with organic balance and warm-generous whitespace, framed with restraint in #C9A84C on #0C0E14 \u2014 timeless, so this life and legacy still feels right in ten years. 3 supporting photos were chosen only because they strengthen the hero and lead the eye back to it \u2014 beauty over quantity, nothing added for its own sake. Everything serves one feeling: respect. Remember a life with respect, peace, and love.",
        purchasePsychology: "The version most families choose \u2014 timeless and universally loved. A natural centerpiece for a celebration of life. Recommended as a Framed. Made for the family and loved ones. (life and legacy)",
        heroPhoto: {
          photoId: "m1",
          filename: "portrait_smiling.jpg",
          orientation: "portrait",
          score: 85,
          faceCount: 1,
          width: 3e3,
          height: 3750
        },
        supportingPhotos: [
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
        layoutRecipe: {
          arrangement: "Central hero with a disciplined supporting grid",
          heroPlacement: "centered",
          heroDominanceRatio: 0.55,
          supportingLayout: "symmetrical grid beneath the hero",
          balance: "symmetrical",
          whitespace: "generous margins",
          focalPath: "single clear centered path",
          maxSupporting: 4
        },
        colorRecipe: {
          ground: "#0C0E14",
          accent: "#C9A84C",
          neutral: "#FAF8F3",
          palette: [
            {
              hex: "#0C0E14",
              role: "primary"
            },
            {
              hex: "#C9A84C",
              role: "accent"
            },
            {
              hex: "#FAF8F3",
              role: "support"
            }
          ],
          source: "occasion-default",
          guidance: "Restrained gold on obsidian; refined, high-contrast, timeless. Gold as a hairline accent only."
        },
        typographyRecipe: {
          style: "respectful",
          displayFont: "Cormorant Garamond",
          supportingFont: "Outfit",
          headlineTreatment: "elegant Cormorant Garamond display, high contrast, one headline",
          labelTreatment: "refined gold small-caps label",
          guidance: "Classic, confident hierarchy; distance- and print-readable."
        },
        recommendedProduct: "Framed",
        sharePreview: {
          headline: "Honoring a life \u2014 our life and legacy.",
          caption: "We turned our favorite photos into something worth keeping forever. \u{1F90D}",
          altText: "A Signature Edition CelebrateBanner life and legacy design, centered on the chosen hero photo with 3 supporting photos."
        },
        wowScore: 93,
        masterpiecePassed: true,
        scoreBreakdown: {
          heroStrength: 12.6,
          emotionalImpact: 19.7,
          storytelling: 13.8,
          layoutBalance: 15,
          typography: 9.9,
          colorHarmony: 9,
          luxuryFinish: 8.4,
          shareability: 4.5,
          total: 93
        },
        failureReasons: []
      },
      {
        conceptName: "Luxury Gold",
        title: "{Full Name}",
        subtitle: "{Birth Year} \u2013 {Year}",
        creativeExplanation: "We made \u201Cportrait_smiling.jpg\u201D (portrait, quality 85/100) the star. Photo m1 (portrait_smiling.jpg) is strongest: portrait, score 85, 1 clear subject. Luxury Gold lifts it into a cinematic spotlight with luxurious negative space and gold framing in #C9A84C, so the life and legacy feels as big as it was. 3 supporting photos were chosen only because they strengthen the hero and lead the eye back to it \u2014 beauty over quantity, nothing added for its own sake. Everything serves one feeling: respect. Remember a life with respect, peace, and love.",
        purchasePsychology: "Best displayed as a framed keepsake; the gold reads richest at a large size, so it looks strongest at 24\xD736. Recommended as a Framed. Made for the family and loved ones. (life and legacy)",
        heroPhoto: {
          photoId: "m1",
          filename: "portrait_smiling.jpg",
          orientation: "portrait",
          score: 85,
          faceCount: 1,
          width: 3e3,
          height: 3750
        },
        supportingPhotos: [
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
        layoutRecipe: {
          arrangement: "Dramatic spotlighted hero with luxurious negative space",
          heroPlacement: "centered, spotlit",
          heroDominanceRatio: 0.61,
          supportingLayout: "minimal framed supporting row",
          balance: "symmetrical grandeur",
          whitespace: "luxurious",
          focalPath: "spotlight leads straight to the hero",
          maxSupporting: 3
        },
        colorRecipe: {
          ground: "#0C0E14",
          accent: "#C9A84C",
          neutral: "#FAF8F3",
          palette: [
            {
              hex: "#0C0E14",
              role: "primary"
            },
            {
              hex: "#C9A84C",
              role: "accent"
            },
            {
              hex: "#FAF8F3",
              role: "support"
            }
          ],
          source: "occasion-default",
          guidance: "Gold-forward on deep obsidian with glow accents on the hero \u2014 radiant metallic, never flooded."
        },
        typographyRecipe: {
          style: "respectful",
          displayFont: "Cormorant Garamond",
          supportingFont: "Outfit",
          headlineTreatment: "large Cormorant Garamond in gold gradient",
          labelTreatment: "letter-spaced small-caps gold label",
          guidance: "Formal and radiant; the most decorative type voice, still restrained."
        },
        recommendedProduct: "Framed",
        sharePreview: {
          headline: "Honoring a life \u2014 our life and legacy.",
          caption: "We turned our favorite photos into something worth keeping forever. \u{1F90D}",
          altText: "A Luxury Gold CelebrateBanner life and legacy design, centered on the chosen hero photo with 3 supporting photos."
        },
        wowScore: 93,
        masterpiecePassed: true,
        scoreBreakdown: {
          heroStrength: 12.4,
          emotionalImpact: 20,
          storytelling: 13.5,
          layoutBalance: 14.2,
          typography: 9.7,
          colorHarmony: 9.2,
          luxuryFinish: 9.8,
          shareability: 4.5,
          total: 93
        },
        failureReasons: []
      },
      {
        conceptName: "Family Legacy",
        title: "{Full Name}",
        subtitle: "{Birth Year} \u2013 {Year}",
        creativeExplanation: "We made \u201Cportrait_smiling.jpg\u201D (portrait, quality 85/100) the star. Photo m1 (portrait_smiling.jpg) is strongest: portrait, score 85, 1 clear subject. Family Legacy arranges the memories as a warm story \u2014 anchor moments, then story builders \u2014 with room around every face, honoring the life and legacy across time. 3 supporting photos were chosen only because they strengthen the hero and lead the eye back to it \u2014 beauty over quantity, nothing added for its own sake. Everything serves one feeling: respect. Remember a life with respect, peace, and love.",
        purchasePsychology: "Grandparents and extended family tend to love this one. It\u2019s made to be handed down. Recommended as a Framed. Made for the family and loved ones. (life and legacy)",
        heroPhoto: {
          photoId: "m1",
          filename: "portrait_smiling.jpg",
          orientation: "portrait",
          score: 85,
          faceCount: 1,
          width: 3e3,
          height: 3750
        },
        supportingPhotos: [
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
        layoutRecipe: {
          arrangement: "Narrative gathered-memories flow",
          heroPlacement: "anchored",
          heroDominanceRatio: 0.49,
          supportingLayout: "tiered story clusters (anchors \u2192 builders \u2192 accents)",
          balance: "balanced",
          whitespace: "warm, room around every face",
          focalPath: "hero first, then the journey",
          maxSupporting: 6
        },
        colorRecipe: {
          ground: "#0C0E14",
          accent: "#C9A84C",
          neutral: "#FAF8F3",
          palette: [
            {
              hex: "#0C0E14",
              role: "primary"
            },
            {
              hex: "#C9A84C",
              role: "accent"
            },
            {
              hex: "#FAF8F3",
              role: "support"
            }
          ],
          source: "occasion-default",
          guidance: "Warm layer within the brand core; soft, unifying, nostalgic. Gold used as gentle detail."
        },
        typographyRecipe: {
          style: "respectful",
          displayFont: "Cormorant Garamond",
          supportingFont: "Outfit",
          headlineTreatment: "warm classic serif display, approachable",
          labelTreatment: "humanist supporting labels, tasteful dates",
          guidance: "Heartfelt, legible; room to breathe around names."
        },
        recommendedProduct: "Framed",
        sharePreview: {
          headline: "Honoring a life \u2014 our life and legacy.",
          caption: "We turned our favorite photos into something worth keeping forever. \u{1F90D}",
          altText: "A Family Legacy CelebrateBanner life and legacy design, centered on the chosen hero photo with 3 supporting photos."
        },
        wowScore: 92,
        masterpiecePassed: true,
        scoreBreakdown: {
          heroStrength: 12.1,
          emotionalImpact: 20,
          storytelling: 15,
          layoutBalance: 13.9,
          typography: 9.3,
          colorHarmony: 8.9,
          luxuryFinish: 8.3,
          shareability: 4.5,
          total: 92
        },
        failureReasons: []
      },
      {
        conceptName: "Modern Editorial",
        title: "{Full Name}",
        subtitle: "{Birth Year} \u2013 {Year}",
        creativeExplanation: "We made \u201Cportrait_smiling.jpg\u201D (portrait, quality 85/100) the star. Photo m1 (portrait_smiling.jpg) is strongest: portrait, score 85, 1 clear subject. Modern Editorial gives it magazine-cover scale and deliberate asymmetry, with bold negative space and strong type \u2014 the life and legacy, styled like a cover. 3 supporting photos were chosen only because they strengthen the hero and lead the eye back to it \u2014 beauty over quantity, nothing added for its own sake. Everything serves one feeling: respect. Remember a life with respect, peace, and love.",
        purchasePsychology: "Made to share \u2014 it looks strongest on a phone screen and social feed before it ever reaches a wall. Recommended as a Digital download. Made for the family and loved ones. (life and legacy)",
        heroPhoto: {
          photoId: "m1",
          filename: "portrait_smiling.jpg",
          orientation: "portrait",
          score: 85,
          faceCount: 1,
          width: 3e3,
          height: 3750
        },
        supportingPhotos: [
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
        layoutRecipe: {
          arrangement: "Editorial asymmetry with an oversized hero",
          heroPlacement: "off-center",
          heroDominanceRatio: 0.59,
          supportingLayout: "off-grid supporting blocks",
          balance: "deliberate asymmetry",
          whitespace: "bold negative space",
          focalPath: "scale-led diagonal path",
          maxSupporting: 4
        },
        colorRecipe: {
          ground: "#0C0E14",
          accent: "#C9A84C",
          neutral: "#FAF8F3",
          palette: [
            {
              hex: "#0C0E14",
              role: "primary"
            },
            {
              hex: "#C9A84C",
              role: "accent"
            },
            {
              hex: "#FAF8F3",
              role: "support"
            }
          ],
          source: "occasion-default",
          guidance: "Sharpest contrast, a single disciplined accent; gold as highlight only."
        },
        typographyRecipe: {
          style: "respectful",
          displayFont: "Cormorant Garamond",
          supportingFont: "Outfit",
          headlineTreatment: "oversized confident display, tight tracking",
          labelTreatment: "bold sans labels; refined serif accent",
          guidance: "Type as composition; strong scale contrast, magazine-grade."
        },
        recommendedProduct: "Digital download",
        sharePreview: {
          headline: "Honoring a life \u2014 our life and legacy.",
          caption: "We turned our favorite photos into something worth keeping forever. \u{1F90D}",
          altText: "A Modern Editorial CelebrateBanner life and legacy design, centered on the chosen hero photo with 3 supporting photos."
        },
        wowScore: 92,
        masterpiecePassed: true,
        scoreBreakdown: {
          heroStrength: 12.3,
          emotionalImpact: 19.7,
          storytelling: 13.5,
          layoutBalance: 14.5,
          typography: 10,
          colorHarmony: 8.7,
          luxuryFinish: 8.1,
          shareability: 5,
          total: 92
        },
        failureReasons: []
      }
    ]
  };

  // demo/premium-reveal-demo.entry.ts
  var FIXTURES = {
    graduation: graduation_default,
    championship: championship_default,
    family: family_default,
    wedding: wedding_default,
    memorial: memorial_default
  };
  function toast(msg) {
    let el = document.getElementById("demo-toast");
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
  function render(key, skipLoading) {
    const host = document.getElementById("reveal");
    if (!host) return;
    mountPremiumReveal(host, {
      presentation: FIXTURES[key],
      skipLoading,
      loadingIntervalMs: 650,
      onRevealed: () => toast(`Revealed: ${key}`),
      handlers: {
        onLove: (c) => toast(`\u2764 Loved: ${c.conceptName}`),
        onDetails: (c) => toast(`\u{1F50D} Details: ${c.conceptName}`),
        onTryAnother: (c) => toast(`\u21BB Try another than: ${c.conceptName}`)
      }
    });
  }
  function init() {
    const sel = document.getElementById("fixture");
    const replay = document.getElementById("replay");
    const skip = document.getElementById("skip");
    const current = () => sel ? sel.value : "graduation";
    sel?.addEventListener("change", () => render(current(), false));
    replay?.addEventListener("click", () => render(current(), false));
    skip?.addEventListener("click", () => render(current(), true));
    render(current(), false);
  }
  if (document.readyState !== "loading") init();
  else document.addEventListener("DOMContentLoaded", init);
})();
