/* ============================================================================
 * AI 发展历程全景图 — 逻辑层 (app.js)
 * 负责渲染 5 大视图、视图切换、搜索过滤、下钻弹窗。
 * 数据见 data.js (DATA 全局对象)。
 * ========================================================================== */

(function () {
  "use strict";

  /* ----------------------------- 应用状态 ----------------------------- */
  const state = {
    view: "timeline",
    searchQuery: "",
    activeFilters: new Set(), // timeline 类别过滤
    modalStack: [], // 下钻历史栈 (支持返回)
    glossaryQuery: "", // 术语速查搜索
  };

  /* ----------------------------- 工具函数 ----------------------------- */
  const $ = (id) => document.getElementById(id);
  const ce = (tag, cls, html) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    return e;
  };
  const esc = (s) =>
    String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  // 高亮搜索词
  const hl = (text, q) => {
    if (!q) return esc(text);
    const safe = esc(text);
    const re = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
    return safe.replace(re, '<mark>$1</mark>');
  };
  const matches = (node, q) => {
    if (!q) return true;
    const haystack = [node.title, node.summary, node.detail, node.why, node.detail]
      .concat(node.people || [])
      .concat(node.examples || [])
      .concat((node.links || []).map((l) => l.label))
      .join(" ")
      .toLowerCase();
    return haystack.includes(q.toLowerCase());
  };

  // 架构层图标映射 (icon name -> emoji)
  const LAYER_ICON = {
    chip: "⚙️",
    database: "🗄️",
    brain: "🧠",
    wrench: "🔧",
    gauge: "⚡",
    apps: "🧩",
    share: "🌐",
  };

  /* ============================ 初始化 ============================ */
  function init() {
    renderMeta();
    renderTimeline();
    renderArchitecture();
    renderArchDiagram();
    renderApplications();
    renderAppDiagram();
    renderFuture();
    renderLearn();
    renderGlossary();
    renderUpdates();
    attachListeners();
    console.log("[AI Roadmap] 初始化完成 —", DATA.timeline.eras.length, "eras,", countEvents(), "events");
  }

  function countEvents() {
    return DATA.timeline.eras.reduce((s, e) => s + e.events.length, 0);
  }

  /* ----------------------------- 元信息渲染 ----------------------------- */
  function renderMeta() {
    const m = DATA.meta;
    $("metaChip").innerHTML = `更新于 <b>${esc(m.lastUpdated)}</b> · ${esc(m.updateCadence)}`;
    $("introTimeline").textContent = DATA.timeline.description;
    $("introArchitecture").textContent = DATA.architecture.description;
    $("introApplications").textContent = DATA.applications.description;
    $("introFuture").textContent = DATA.future.description;
    $("introLearn").textContent = DATA.learn.description;
    if ($("introGlossary")) $("introGlossary").textContent = DATA.glossary.description;
    if ($("introUpdates")) $("introUpdates").textContent = DATA.updateMechanism.description;
    // 页脚来源
    const src = $("footerSrc");
    src.innerHTML = "<b>主要参考:</b> ";
    m.sources.forEach((s, i) => {
      if (i > 0) src.appendChild(document.createTextNode(" · "));
      const a = ce("a");
      a.href = s.url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.textContent = s.label;
      a.addEventListener("click", (e) => {
        if (window.self !== window.top) {
          e.preventDefault();
          window.open(s.url, "_blank", "noopener,noreferrer");
        }
      });
      src.appendChild(a);
    });
  }

  /* ============================ 时间线视图 ============================ */
  function renderTimeline() {
    const root = $("timelineRoot");
    root.innerHTML = "";

    // 收集所有类别 → 过滤条
    const cats = new Set();
    DATA.timeline.eras.forEach((era) =>
      era.events.forEach((ev) => ev.category && cats.add(ev.category))
    );
    const bar = $("filterBar");
    bar.innerHTML = '<span class="lbl">类别筛选:</span>';
    const allChip = ce("button", "filter-chip active", "全部");
    allChip.dataset.cat = "__all";
    allChip.onclick = () => setFilter("__all");
    bar.appendChild(allChip);
    [...cats].forEach((c) => {
      const chip = ce("button", "filter-chip", esc(c));
      chip.dataset.cat = c;
      chip.onclick = () => setFilter(c);
      bar.appendChild(chip);
    });

    // 渲染各 era
    DATA.timeline.eras.forEach((era) => {
      const eraEl = ce("div", "era");
      eraEl.style.setProperty("--era-color", era.color);
      eraEl.dataset.eraId = era.id;

      const head = ce("div", "era-header");
      head.innerHTML = `
        <div class="era-dot"></div>
        <div class="era-title">${esc(era.name)} <span class="period">${esc(era.period)}</span></div>
        <div class="era-summary">${esc(era.summary)}</div>`;
      eraEl.appendChild(head);

      const grid = ce("div", "event-grid");
      era.events.forEach((ev) => {
        const card = ce("div", "event-card" + (era.isFuture ? " future" : ""));
        card.dataset.id = ev.id;
        card.style.setProperty("--era-color", era.color);
        card.innerHTML = `
          <div class="ev-year">${esc(ev.date)} <span class="ev-tag">${esc(ev.category || "")}</span></div>
          <div class="ev-title">${esc(ev.title)}</div>
          <div class="ev-summary">${esc(ev.summary)}</div>
          ${ev.analogy ? `<div class="ev-analogy">💡 ${esc(ev.analogy)}</div>` : ""}`;
        card.onclick = () => openModal(ev, { eyebrow: ev.date + " · " + (ev.category || ""), color: era.color });
        grid.appendChild(card);
      });
      eraEl.appendChild(grid);
      root.appendChild(eraEl);
    });
  }

  function setFilter(cat) {
    if (cat === "__all") state.activeFilters.clear();
    else state.activeFilters = new Set([cat]);
    // 更新 chip 状态
    document.querySelectorAll(".filter-chip").forEach((c) => {
      c.classList.toggle("active", cat === "__all" ? c.dataset.cat === "__all" : c.dataset.cat === cat);
    });
    applyTimelineFilter();
  }

  function applyTimelineFilter() {
    const q = state.searchQuery.trim();
    let totalVisible = 0;
    document.querySelectorAll("#timelineRoot .era").forEach((eraEl) => {
      let visibleInEra = 0;
      eraEl.querySelectorAll(".event-card").forEach((card) => {
        const id = card.dataset.id;
        const ev = findEventById(id);
        const catOk = state.activeFilters.size === 0 || (ev.category && state.activeFilters.has(ev.category));
        const qOk = matches(ev, q);
        const show = catOk && qOk;
        card.style.display = show ? "" : "none";
        if (show) { visibleInEra++; totalVisible++; }
        card.querySelector(".ev-title").innerHTML = hl(ev.title, q);
        card.querySelector(".ev-summary").innerHTML = hl(ev.summary, q);
      });
      eraEl.style.display = visibleInEra === 0 && q ? "none" : "";
    });
    showNoMatchHint("timelineRoot", q, totalVisible);
  }

  function findEventById(id) {
    for (const era of DATA.timeline.eras) {
      const f = era.events.find((e) => e.id === id);
      if (f) return f;
    }
    return null;
  }

  /* ============================ 架构视图 ============================ */
  function renderArchitecture() {
    const root = $("archRoot");
    root.innerHTML = "";
    // column-reverse 让底层在底部; 数据顺序已是 1→7, 渲染保持原序即可
    DATA.architecture.layers.forEach((layer) => {
      const lay = ce("div", "arch-layer");
      lay.dataset.id = layer.id;

      const head = ce("div", "arch-layer-head");
      head.innerHTML = `
        <div class="layer-icon">${LAYER_ICON[layer.icon] || "📦"}</div>
        <div class="layer-info">
          <div class="layer-name">${esc(layer.name)}</div>
          <div class="layer-summary">${esc(layer.summary)}</div>
        </div>
        <div class="layer-toggle">▾</div>`;
      head.onclick = () => lay.classList.toggle("expanded");
      lay.appendChild(head);

      const body = ce("div", "arch-layer-body");
      body.innerHTML = `<div class="layer-detail">${esc(layer.detail)}</div>`;
      const grid = ce("div", "comp-grid");
      (layer.components || []).forEach((c) => {
        const card = ce("div", "comp-card");
        card.dataset.id = c.id;
        card.innerHTML = `
          <div class="comp-name">${esc(c.name)}</div>
          <div class="comp-summary">${esc(c.summary)}</div>
          ${c.analogy ? `<div class="comp-analogy">💡 ${esc(c.analogy)}</div>` : ""}`;
        card.onclick = () =>
          openModal(c, { eyebrow: layer.name + " · 组件", color: "var(--accent-2)" });
        grid.appendChild(card);
      });
      body.appendChild(grid);
      lay.appendChild(body);
      root.appendChild(lay);
    });
  }

  function applyArchFilter() {
    const q = state.searchQuery.trim();
    let totalVisible = 0;
    document.querySelectorAll("#archRoot .arch-layer").forEach((lay) => {
      const layer = DATA.architecture.layers.find((l) => l.id === lay.dataset.id);
      let anyVisible = matches(layer, q);
      lay.querySelectorAll(".comp-card").forEach((card) => {
        const c = layer.components.find((x) => x.id === card.dataset.id);
        const show = matches(c, q);
        card.style.display = show ? "" : "none";
        if (show) { anyVisible = true; totalVisible++; }
        card.querySelector(".comp-name").innerHTML = hl(c.name, q);
        card.querySelector(".comp-summary").innerHTML = hl(c.summary, q);
      });
      lay.querySelector(".layer-name").innerHTML = hl(layer.name, q);
      lay.querySelector(".layer-summary").innerHTML = hl(layer.summary, q);
      lay.style.display = anyVisible || !q ? "" : "none";
      if (q && anyVisible) lay.classList.add("expanded");
    });
    // 架构图模式过滤
    document.querySelectorAll("#archDiagram .diagram-row").forEach((row) => {
      const layer = DATA.architecture.layers.find((l) => l.id === row.dataset.id);
      let anyVisible = matches(layer, q);
      row.querySelectorAll(".diagram-node").forEach((node) => {
        const c = layer.components.find((x) => x.id === node.dataset.id);
        const show = matches(c, q);
        node.style.display = show ? "" : "none";
        if (show) { anyVisible = true; totalVisible++; }
        node.querySelector(".d-node-name").innerHTML = hl(c.name, q);
      });
      row.style.display = anyVisible || !q ? "" : "none";
    });
    showNoMatchHint("archRoot", q, totalVisible);
  }

  /* ============================ 应用视图 ============================ */
  function renderApplications() {
    const root = $("appRoot");
    root.innerHTML = "";
    DATA.applications.categories.forEach((cat) => {
      const card = ce("div", "app-card");
      card.style.setProperty("--cat-color", cat.color);
      card.dataset.id = cat.id;
      card.innerHTML = `
        <div class="app-icon">${cat.icon}</div>
        <div class="app-name">${esc(cat.name)}</div>
        <div class="app-summary">${esc(cat.summary)}</div>
        <div class="app-count">${cat.useCases.length} 个用例 · 点击下钻</div>`;
      card.onclick = () =>
        openModal(cat, { eyebrow: "应用类别", color: cat.color, childField: "useCases", childLabel: "用例" });
      root.appendChild(card);
    });
  }

  function applyAppFilter() {
    const q = state.searchQuery.trim();
    let totalVisible = 0;
    document.querySelectorAll("#appRoot .app-card").forEach((card) => {
      const cat = DATA.applications.categories.find((c) => c.id === card.dataset.id);
      let anyVisible = matches(cat, q);
      cat.useCases.forEach((uc) => {
        if (matches(uc, q)) anyVisible = true;
      });
      card.style.display = anyVisible || !q ? "" : "none";
      if (anyVisible || !q) totalVisible++;
      card.querySelector(".app-name").innerHTML = hl(cat.name, q);
      card.querySelector(".app-summary").innerHTML = hl(cat.summary, q);
    });
    // 应用图模式过滤
    document.querySelectorAll("#appDiagram .app-zone").forEach((zone) => {
      const cat = DATA.applications.categories.find((c) => c.id === zone.dataset.id);
      let anyVisible = matches(cat, q);
      zone.querySelectorAll(".app-zone-node").forEach((node) => {
        const uc = cat.useCases.find((u) => u.name === node.textContent.trim());
        const show = matches(uc, q);
        node.style.display = show ? "" : "none";
        if (show) anyVisible = true;
      });
      zone.style.display = anyVisible || !q ? "" : "none";
      if (anyVisible || !q) totalVisible++;
    });
    showNoMatchHint("appRoot", q, totalVisible);
  }

  /* ============================ 架构图渲染 ============================ */
  function renderArchDiagram() {
    const root = $("archDiagram");
    if (!root) return;
    root.innerHTML = "";
    const q = state.searchQuery.trim();

    // 画布
    const canvas = ce("div", "diagram-canvas");
    canvas.innerHTML = `<div class="diagram-title">🏗️ AI 技术架构全景图（数据驱动 · 与列表同源同步）</div>`;

    const stack = ce("div", "diagram-stack");
    // 从顶到底渲染（生态在顶，硬件在底），用 flex-direction: column-reverse 让硬件在底
    DATA.architecture.layers.forEach((layer, idx) => {
      const row = ce("div", "diagram-row");
      row.style.setProperty("--layer-color", layer.color || "var(--accent)");
      row.dataset.id = layer.id;

      // 左侧层标识
      const label = ce("div", "diagram-label");
      label.innerHTML = `
        <div class="d-label-num">L${idx + 1}</div>
        <div class="d-label-icon">${LAYER_ICON[layer.icon] || "📦"}</div>
        <div class="d-label-name">${esc(layer.name)}</div>`;

      // 中间组件区
      const comps = ce("div", "diagram-comps");
      (layer.components || []).forEach((c) => {
        const node = ce("div", "diagram-node");
        node.dataset.id = c.id;
        node.innerHTML = `<span class="d-node-name">${hl(c.name, q)}</span>`;
        node.title = c.summary || "";
        node.onclick = () =>
          openModal(c, { eyebrow: layer.name + " · 组件", color: "var(--accent-2)" });
        comps.appendChild(node);
      });

      row.appendChild(label);
      row.appendChild(comps);

      // 层间向上箭头（除了最顶层）
      if (idx < DATA.architecture.layers.length - 1) {
        const arrow = ce("div", "diagram-arrow", "▲");
        stack.appendChild(row);
        stack.appendChild(arrow);
      } else {
        stack.appendChild(row);
      }
    });

    canvas.appendChild(stack);

    // 图例
    const legend = ce("div", "diagram-legend");
    legend.innerHTML = `
      <span class="lg-item"><span class="lg-dot" style="background:var(--accent)"></span>架构层</span>
      <span class="lg-item"><span class="lg-dot" style="background:var(--accent-3)"></span>可点击组件</span>
      <span class="lg-item">▲ 数据流向上</span>
      <span class="lg-tip">点击任意组件可下钻查看详情 · 数据来自 data.js，与列表完全同步</span>`;
    canvas.appendChild(legend);

    root.appendChild(canvas);
  }

  function renderAppDiagram() {
    const root = $("appDiagram");
    if (!root) return;
    root.innerHTML = "";
    const q = state.searchQuery.trim();

    const canvas = ce("div", "diagram-canvas");
    canvas.innerHTML = `<div class="diagram-title">🗺️ AI 应用版图全景图（按领域分组 · 与列表同源同步）</div>`;

    const grid = ce("div", "app-diagram-grid");
    DATA.applications.categories.forEach((cat) => {
      const zone = ce("div", "app-zone");
      zone.style.setProperty("--cat-color", cat.color);
      zone.dataset.id = cat.id;

      const head = ce("div", "app-zone-head");
      head.innerHTML = `
        <span class="az-icon">${cat.icon}</span>
        <span class="az-name">${hl(cat.name, q)}</span>
        <span class="az-count">${cat.useCases.length} 用例</span>`;
      head.onclick = () =>
        openModal(cat, { eyebrow: "应用类别", color: cat.color, childField: "useCases", childLabel: "用例" });
      zone.appendChild(head);

      const nodes = ce("div", "app-zone-nodes");
      (cat.useCases || []).forEach((uc) => {
        const node = ce("div", "app-zone-node");
        node.innerHTML = `<span>${hl(uc.name, q)}</span>`;
        node.title = uc.summary || "";
        node.onclick = (e) => {
          e.stopPropagation();
          openModal(uc, { eyebrow: cat.name + " · 用例", color: cat.color });
        };
        nodes.appendChild(node);
      });
      zone.appendChild(nodes);
      grid.appendChild(zone);
    });

    canvas.appendChild(grid);

    const legend = ce("div", "diagram-legend");
    legend.innerHTML = `
      <span class="lg-item"><span class="lg-dot" style="background:var(--accent-4)"></span>应用领域</span>
      <span class="lg-item"><span class="lg-dot" style="background:var(--accent-3)"></span>可点击用例</span>
      <span class="lg-tip">点击领域标题查看全部用例 · 点击用例下钻详情 · 数据与列表完全同步</span>`;
    canvas.appendChild(legend);

    root.appendChild(canvas);
  }

  /* ============================ 未来视图 ============================ */
  function renderFuture() {
    const root = $("predRoot");
    root.innerHTML = "";
    DATA.future.predictions.forEach((p) => {
      const card = ce("div", "pred-card");
      card.dataset.id = p.id;
      const confClass = p.confidence && p.confidence.startsWith("低") ? " conf-低" : "";
      card.innerHTML = `
        <div class="pred-year">${esc(p.year)}</div>
        <div class="pred-title">${esc(p.title)}</div>
        <div class="pred-source">${esc(p.source)} · <span class="pred-conf${confClass}">${esc(p.confidence)} 置信</span></div>
        <div class="pred-detail">${esc(p.detail)}</div>`;
      card.onclick = () => openModal(p, { eyebrow: "未来预测 · " + p.year, color: "var(--accent-5)" });
      root.appendChild(card);
    });
  }

  function applyFutureFilter() {
    const q = state.searchQuery.trim();
    let totalVisible = 0;
    document.querySelectorAll("#predRoot .pred-card").forEach((card) => {
      const p = DATA.future.predictions.find((x) => x.id === card.dataset.id);
      const show = matches(p, q);
      card.style.display = show || !q ? "" : "none";
      if (show || !q) totalVisible++;
      card.querySelector(".pred-title").innerHTML = hl(p.title, q);
      card.querySelector(".pred-detail").innerHTML = hl(p.detail, q);
    });
    showNoMatchHint("predRoot", q, totalVisible);
  }

  /* ============================ 学习视图 ============================ */
  function renderLearn() {
    const root = $("learnRoot");
    root.innerHTML = "";
    DATA.learn.paths.forEach((p, i) => {
      const item = ce("div", "learn-path");
      item.innerHTML = `
        <div class="lp-num">${i + 1}</div>
        <div class="lp-body">
          <div class="lp-head">
            <span class="lp-layer">${esc(p.layer)}</span>
            <span class="lp-level">${esc(p.level)}</span>
          </div>
          <div class="lp-what">${esc(p.what)}</div>
          <div class="lp-res"></div>
          <div class="lp-drill-hint">点击下钻 ▾</div>
        </div>`;
      const resWrap = item.querySelector(".lp-res");
      (p.resources || []).forEach((r) => {
        const a = ce("a");
        a.href = r.url;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.textContent = "🔗 " + r.name;
        a.addEventListener("click", (e) => {
          e.stopPropagation();
          if (window.self !== window.top) {
            e.preventDefault();
            window.open(r.url, "_blank", "noopener,noreferrer");
          }
        });
        resWrap.appendChild(a);
      });
      // 下钻: 把 resources 转为 children + sources
      const children = (p.resources || []).map((r) => ({
        name: r.name,
        title: r.name,
        summary: r.desc || "学习资源",
        sources: [{ label: r.name, url: r.url }],
      }));
      item.onclick = () =>
        openModal(
          {
            name: p.what,
            title: p.what,
            summary: p.layer + " · " + p.level,
            detail: p.detail || p.what,
            children: children,
            sources: p.sources || [],
          },
          { eyebrow: "学习路径 · 第 " + (i + 1) + " 步", color: "var(--accent-3)" }
        );
      root.appendChild(item);
    });

    const prod = $("prodRoot");
    prod.innerHTML = "";
    DATA.learn.productivity.forEach((p) => {
      const c = ce("div", "prod-card");
      c.innerHTML = `<div class="prod-title">${esc(p.title)}</div><div class="prod-detail">${esc(p.detail)}</div><div class="lp-drill-hint">点击下钻 ▾</div>`;
      c.onclick = () =>
        openModal(
          {
            name: p.title,
            title: p.title,
            summary: p.detail,
            detail: p.detail,
            sources: p.sources || [],
          },
          { eyebrow: "生产力工具", color: "var(--accent-4)" }
        );
      prod.appendChild(c);
    });
  }

  /* ============================ 术语速查视图 ============================ */
  function renderGlossary() {
    const root = $("glossaryRoot");
    if (!root) return;
    root.innerHTML = "";
    const wrap = ce("div", "glossary-wrap");

    // 搜索框
    const search = ce("div", "glossary-search");
    search.innerHTML = `
      <span class="ic">🔍</span>
      <input id="glossaryInput" type="search" placeholder="搜术语或解释, 比如'AGI''Transformer''通俗来讲'…" autocomplete="off" />
      <span class="glossary-count" id="glossaryCount"></span>`;
    wrap.appendChild(search);

    // 字母分组容器
    const list = ce("div", "glossary-list");
    wrap.appendChild(list);
    root.appendChild(wrap);

    // 绑定搜索
    const input = search.querySelector("input");
    let t;
    input.addEventListener("input", (e) => {
      clearTimeout(t);
      t = setTimeout(() => {
        state.glossaryQuery = e.target.value.trim();
        applyGlossaryFilter();
      }, 120);
    });

    applyGlossaryFilter();
  }

  function applyGlossaryFilter() {
    const list = document.querySelector("#glossaryRoot .glossary-list");
    const countEl = document.getElementById("glossaryCount");
    if (!list) return;
    const q = state.glossaryQuery.toLowerCase();
    const terms = DATA.glossary.terms.filter((t) => {
      if (!q) return true;
      return (t.term + " " + t.definition + " " + (t.analogy || "")).toLowerCase().includes(q);
    });
    list.innerHTML = "";
    terms.forEach((t) => {
      const card = ce("div", "glossary-card");
      const safeTerm = esc(t.term);
      const safeDef = esc(t.definition);
      const safeAna = esc(t.analogy || "");
      card.innerHTML = `
        <div class="g-term">${safeTerm}</div>
        <div class="g-def">${safeDef}</div>
        ${safeAna ? `<div class="g-analogy">💡 ${safeAna}</div>` : ""}
        <div class="g-drill-hint">点击下钻 ▾</div>`;
      card.onclick = () =>
        openModal(
          {
            term: t.term,
            title: t.term,
            summary: t.definition,
            analogy: t.analogy,
            detail: t.detail || t.definition,
            sources: t.sources || [{ label: "搜索 " + t.term, url: "https://www.baidu.com/s?wd=" + encodeURIComponent(t.term) }],
            children: t.children,
          },
          { eyebrow: "术语速查", color: "var(--accent-2)" }
        );
      list.appendChild(card);
    });
    if (countEl) countEl.textContent = `${terms.length} / ${DATA.glossary.terms.length} 条`;
  }

  /* ============================ 下钻弹窗 ============================ */
  function openModal(node, opts = {}) {
    state.modalStack.push({ node, opts });
    renderModal();
    $("modalMask").classList.add("open");
    document.body.style.overflow = "hidden";
  }

  function renderModal() {
    const top = state.modalStack[state.modalStack.length - 1];
    if (!top) return;
    const { node, opts = {} } = top;
    const body = $("modalBody");
    const q = state.searchQuery.trim();
    body.innerHTML = "";
    body.style.borderTop = `3px solid ${opts.color || "var(--accent)"}`;

    // 面包屑路径 (多层下钻)
    if (state.modalStack.length > 1) {
      const crumb = ce("div", "modal-breadcrumb");
      state.modalStack.forEach((item, idx) => {
        if (idx > 0) {
          const sep = ce("span", "crumb-sep", "›");
          crumb.appendChild(sep);
        }
        const n = item.node;
        const label = n.title || n.name || n.term || "未知";
        const span = ce("span", idx === state.modalStack.length - 1 ? "crumb-current" : "crumb-link", label);
        if (idx < state.modalStack.length - 1) {
          span.onclick = () => {
            state.modalStack = state.modalStack.slice(0, idx + 1);
            renderModal();
          };
        }
        crumb.appendChild(span);
      });
      body.appendChild(crumb);
    }

    // eyebrow (年份/层级)
    if (opts.eyebrow) {
      const eb = ce("div", "modal-eyebrow");
      eb.innerHTML = `<span>${hl(opts.eyebrow, q)}</span>`;
      body.appendChild(eb);
    }

    // 标题
    body.appendChild(ce("h2", "modal-title", hl(node.title || node.name || node.term, q)));

    // summary
    if (node.summary) {
      body.appendChild(ce("div", "modal-summary", hl(node.summary, q)));
    }

    // analogy (通俗来讲 — 小白友好)
    if (node.analogy) {
      const an = ce("div", "modal-analogy");
      an.innerHTML = `<div class="analogy-tag">💡 通俗来讲</div><div class="analogy-text">${hl(node.analogy, q)}</div>`;
      body.appendChild(an);
    }

    // detail
    if (node.detail) {
      const s = ce("div", "modal-section");
      s.innerHTML = `<h4>详解</h4><div class="modal-detail">${hl(node.detail, q)}</div>`;
      body.appendChild(s);
    }

    // why it matters
    if (node.why) {
      const s = ce("div", "modal-section");
      s.innerHTML = `<h4>为什么重要</h4><div class="modal-why">${hl(node.why, q)}</div>`;
      body.appendChild(s);
    }

    // people / orgs (可点击下钻)
    if (node.people && node.people.length) {
      const s = ce("div", "modal-section");
      s.innerHTML = `<h4>关键人物 / 机构 (点击下钻)</h4><div class="people-chips"></div>`;
      const chips = s.querySelector(".people-chips");
      node.people.forEach((p) => {
        const chip = ce("span", "clickable-chip", hl(p, q));
        chip.onclick = () =>
          openModal(
            { name: p, title: p, summary: "相关人物/机构", detail: "该人物或机构与本条内容直接相关。", sources: [{ label: "搜索 " + p, url: "https://www.baidu.com/s?wd=" + encodeURIComponent(p) }] },
            { eyebrow: (opts.eyebrow || "详情") + " · 人物", color: "var(--accent)" }
          );
        chips.appendChild(chip);
      });
      body.appendChild(s);
    }

    // examples (可点击下钻)
    if (node.examples && node.examples.length) {
      const s = ce("div", "modal-section");
      s.innerHTML = `<h4>代表实现 (点击下钻)</h4><div class="people-chips"></div>`;
      const chips = s.querySelector(".people-chips");
      node.examples.forEach((x) => {
        const chip = ce("span", "clickable-chip", hl(x, q));
        chip.style.background = "rgba(6,214,160,0.10)";
        chip.style.color = "var(--accent-3)";
        chip.style.borderColor = "rgba(6,214,160,0.25)";
        chip.onclick = () =>
          openModal(
            { name: x, title: x, summary: "代表实现/产品", detail: "该实现是本条内容的典型落地产品或项目。", sources: [{ label: "搜索 " + x, url: "https://www.baidu.com/s?wd=" + encodeURIComponent(x) }] },
            { eyebrow: (opts.eyebrow || "详情") + " · 实现", color: "var(--accent-3)" }
          );
        chips.appendChild(chip);
      });
      body.appendChild(s);
    }

    // === 统一 children 下钻 === (兼容 childField 旧写法)
    const children = node.children || (opts.childField ? node[opts.childField] : null);
    if (children && children.length) {
      const s = ce("div", "modal-section");
      const label = opts.childLabel || "子项";
      s.innerHTML = `<h4>${esc(label)} (点击进一步下钻) · ${children.length} 项</h4>`;
      const grid = ce("div", "child-grid");
      children.forEach((child) => {
        const c = ce("div", "child-card");
        const hasChildren = (child.children && child.children.length) || (opts.childField && child[opts.childField] && child[opts.childField].length);
        const hasSources = (child.sources && child.sources.length) || (child.links && child.links.length);
        const badge = hasChildren ? '<span class="drill-badge">可下钻 ▾</span>' : (hasSources ? '<span class="source-badge">有来源 ↗</span>' : '');
        c.innerHTML = `<div class="child-head"><span class="child-name">${hl(child.name || child.title, q)}</span>${badge}</div><div class="child-summary">${hl(child.summary || "", q)}</div>`;
        c.onclick = () =>
          openModal(child, {
            eyebrow: (opts.eyebrow || "详情") + " · " + (opts.childLabel || "子项"),
            color: opts.color,
            childField: opts.childField,
            childLabel: opts.childLabel,
          });
        grid.appendChild(c);
      });
      s.appendChild(grid);
      body.appendChild(s);
    }

    // products (可点击)
    if (node.products && node.products.length) {
      const s = ce("div", "modal-section");
      s.innerHTML = `<h4>代表产品 (点击下钻)</h4><div class="people-chips"></div>`;
      const chips = s.querySelector(".people-chips");
      node.products.forEach((x) => {
        const chip = ce("span", "clickable-chip", hl(x, q));
        chip.style.background = "rgba(247,37,133,0.10)";
        chip.style.color = "var(--accent-4)";
        chip.style.borderColor = "rgba(247,37,133,0.25)";
        chip.onclick = () =>
          openModal(
            { name: x, title: x, summary: "代表产品", detail: "该产品是本条内容的典型落地应用。", sources: [{ label: "搜索 " + x, url: "https://www.baidu.com/s?wd=" + encodeURIComponent(x) }] },
            { eyebrow: (opts.eyebrow || "详情") + " · 产品", color: "var(--accent-4)" }
          );
        chips.appendChild(chip);
      });
      body.appendChild(s);
    }

    // === 末层原子内容：精准来源链接 ===
    // sources = 结构化来源 (优先), links = 旧字段 (兼容)
    const sources = (node.sources && node.sources.length) ? node.sources : (node.links && node.links.length ? node.links : null);
    if (sources && sources.length) {
      const s = ce("div", "modal-section source-section");
      const isAtomic = !(children && children.length) && !(node.examples && node.examples.length) && !(node.products && node.products.length);
      s.innerHTML = `<h4>${isAtomic ? "📌 原子内容 · 原始来源 (点击直达)" : "原始来源 / 深入资料"}</h4><div class="link-list"></div>`;
      const list = s.querySelector(".link-list");
      sources.forEach((l) => {
        const a = ce("a");
        a.href = l.url;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.innerHTML = `🔗 <span>${hl(l.label, q)}</span> <span class="ext">${getDomain(l.url)}</span> <span class="arrow">↗</span>`;
        a.addEventListener("click", (e) => {
          e.stopPropagation();
          // 预览/内嵌环境中 target=_blank 可能被拦截, 兜底用 window.open
          if (window.self !== window.top) {
            e.preventDefault();
            window.open(l.url, "_blank", "noopener,noreferrer");
          }
        });
        list.appendChild(a);
      });
      body.appendChild(s);
    } else {
      // 没有来源链接但已是末层的提示
      const hasNoDrill = !(children && children.length) && !(node.examples && node.examples.length) && !(node.products && node.products.length);
      if (hasNoDrill) {
        const s = ce("div", "modal-section");
        s.innerHTML = `<h4>📌 已到原子内容</h4><div class="atomic-note">本内容已拆解到最小单元，无法再下钻。</div>`;
        body.appendChild(s);
      }
    }

    // 返回按钮显隐
    $("modalBack").classList.toggle("show", state.modalStack.length > 1);
  }

  function getDomain(url) {
    try {
      return new URL(url).hostname.replace(/^www\./, "");
    } catch {
      return "";
    }
  }

  function closeModal() {
    state.modalStack = [];
    $("modalMask").classList.remove("open");
    document.body.style.overflow = "";
  }

  function modalBack() {
    state.modalStack.pop();
    if (state.modalStack.length === 0) {
      closeModal();
    } else {
      renderModal();
    }
  }

  /* ============================ 视图切换 ============================ */
  function switchView(viewId) {
    state.view = viewId;
    document.querySelectorAll(".view").forEach((v) => v.classList.remove("active"));
    $("view-" + viewId).classList.add("active");
    document.querySelectorAll("#viewTabs button").forEach((b) =>
      b.classList.toggle("active", b.dataset.view === viewId)
    );
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /* ============================ 搜索 ============================ */
  function showNoMatchHint(targetId, q, visibleCount) {
    const container = $(targetId);
    if (!container) return;
    let hint = container.parentNode.querySelector(".no-match-hint");
    if (q && visibleCount === 0) {
      if (!hint) {
        hint = ce("div", "no-match-hint");
        hint.innerHTML = `
          <div class="nm-icon">🔍</div>
          <div class="nm-text">没有找到与 "<b>${esc(q)}</b>" 匹配的内容</div>
          <div class="nm-tip">试试其他关键词，或点击右上角 × 清空搜索</div>`;
        container.parentNode.insertBefore(hint, container);
      } else {
        hint.querySelector(".nm-text b").textContent = q;
      }
    } else if (hint) {
      hint.remove();
    }
  }

  function handleSearch(q) {
    state.searchQuery = q;
    applyTimelineFilter();
    applyArchFilter();
    applyAppFilter();
    applyFutureFilter();
  }

  /* ============================ ⑦ 更新中心视图 ============================ */
  function renderUpdates() {
    const root = $("updatesRoot");
    if (!root) return;
    root.innerHTML = "";
    const m = DATA.updateMechanism;
    const log = DATA.updateLog || [];
    const meta = DATA.meta;

    // 计算距下次更新天数
    const last = new Date(meta.lastUpdated);
    const today = new Date("2026-09-10");
    const daysSince = Math.floor((today - last) / 86400000);
    const daysLeft = Math.max(0, m.cadenceDays - daysSince);
    const needUpdate = daysSince >= m.cadenceDays;

    // ① 状态卡片
    const status = ce("div", "upd-status-card");
    status.innerHTML = `
      <div class="upd-status-head">
        <span class="upd-emoji">${needUpdate ? "🔴" : "🟢"}</span>
        <div class="upd-status-info">
          <div class="upd-status-title">${needUpdate ? "建议更新" : "数据最新"}</div>
          <div class="upd-status-sub">${needUpdate ? `距上次更新已 ${daysSince} 天, 超过 ${m.cadenceDays} 天周期` : `数据最新, 距下次更新还有 ${daysLeft} 天`}</div>
        </div>
      </div>
      <div class="upd-status-grid">
        <div class="upd-metric">
          <div class="upd-m-val">${esc(meta.version)}</div>
          <div class="upd-m-lbl">当前版本</div>
        </div>
        <div class="upd-metric">
          <div class="upd-m-val">${esc(meta.lastUpdated)}</div>
          <div class="upd-m-lbl">最后更新</div>
        </div>
        <div class="upd-metric">
          <div class="upd-m-val">${m.cadenceDays} 天</div>
          <div class="upd-m-lbl">更新周期</div>
        </div>
        <div class="upd-metric">
          <div class="upd-m-val">${log.length}</div>
          <div class="upd-m-lbl">更新次数</div>
        </div>
      </div>`;
    root.appendChild(status);

    // ② 下次更新信息
    const next = ce("div", "upd-next-card");
    next.innerHTML = `
      <div class="upd-next-head">
        <span class="upd-emoji">⏰</span>
        <b>下次自动更新</b>
      </div>
      <div class="upd-next-body">
        <div class="upd-next-row"><span class="lbl">时间</span><span class="val">${esc(m.schedule)}</span></div>
        <div class="upd-next-row"><span class="lbl">触发</span><span class="val">${esc(m.updateTrigger)}</span></div>
        <div class="upd-next-row"><span class="lbl">目标文件</span><code class="val">${esc(m.dataFile)}</code></div>
        <div class="upd-next-row"><span class="lbl">重启命令</span><code class="val">${esc(m.restartCommand)}</code></div>
      </div>
      <div class="upd-next-guide">
        💡 ${esc(m.nextUpdateGuide)}
      </div>`;
    root.appendChild(next);

    // ③ 更新规则
    const rules = ce("div", "upd-rules-card");
    rules.innerHTML = `
      <div class="upd-rules-head"><span class="upd-emoji">📋</span><b>更新规则</b></div>
      <ol class="upd-rules-list">
        ${m.rules.map((r) => `<li>${esc(r)}</li>`).join("")}
      </ol>`;
    root.appendChild(rules);

    // ④ 更新历史日志
    const history = ce("div", "upd-history-card");
    history.innerHTML = `<div class="upd-history-head"><span class="upd-emoji">📜</span><b>更新历史 (${log.length} 次)</b></div>`;
    const timeline = ce("div", "upd-log-timeline");
    log.forEach((entry, idx) => {
      const item = ce("div", "upd-log-item" + (idx === 0 ? " latest" : ""));
      const add = entry.additions || {};
      const feats = entry.features || [];
      const eventCount = (add.events || []).length;
      const compCount = (add.components || []).length;
      const ucCount = (add.useCases || []).length;
      const termCount = (add.terms || []).length;
      const totalCount = eventCount + compCount + ucCount + termCount;
      let addHtml = "";
      if (eventCount) addHtml += `<span class="upd-tag upd-tag-e">事件 +${eventCount}</span>`;
      if (compCount) addHtml += `<span class="upd-tag upd-tag-c">组件 +${compCount}</span>`;
      if (ucCount) addHtml += `<span class="upd-tag upd-tag-u">用例 +${ucCount}</span>`;
      if (termCount) addHtml += `<span class="upd-tag upd-tag-t">术语 +${termCount}</span>`;
      let featHtml = feats.length ? feats.map((f) => `<span class="upd-tag upd-tag-f">${esc(f)}</span>`).join("") : "";
      item.innerHTML = `
        <div class="upd-log-date">
          <span class="upd-log-ver">v${esc(entry.version)}</span>
          <span class="upd-log-d">${esc(entry.date)}</span>
          <span class="upd-log-type">${esc(entry.type)}</span>
          ${idx === 0 ? '<span class="upd-log-latest">最新</span>' : ""}
        </div>
        <div class="upd-log-summary">${esc(entry.summary)}</div>
        ${(add.events || []).length ? `<div class="upd-log-sec"><b>新增事件:</b> ${(add.events || []).map((e) => esc(e)).join("、")}</div>` : ""}
        ${(add.components || []).length ? `<div class="upd-log-sec"><b>新增组件:</b> ${(add.components || []).map((e) => esc(e)).join("、")}</div>` : ""}
        ${(add.useCases || []).length ? `<div class="upd-log-sec"><b>新增用例:</b> ${(add.useCases || []).map((e) => esc(e)).join("、")}</div>` : ""}
        ${(add.terms || []).length ? `<div class="upd-log-sec"><b>新增术语:</b> ${(add.terms || []).map((e) => esc(e)).join("、")}</div>` : ""}
        ${featHtml ? `<div class="upd-log-sec"><b>新功能:</b> ${featHtml}</div>` : ""}
        <div class="upd-log-tags">${addHtml}</div>
        ${entry.stats ? `<div class="upd-log-stats">统计: ${entry.stats.events} 事件 / ${entry.stats.components} 组件 / ${entry.stats.useCases} 用例 / ${entry.stats.terms} 术语</div>` : ""}`;
      timeline.appendChild(item);
    });
    history.appendChild(timeline);
    root.appendChild(history);

    // ⑤ 手动触发更新按钮
    const trigger = ce("div", "upd-trigger-card");
    trigger.innerHTML = `
      <div class="upd-trigger-head"><span class="upd-emoji">🚀</span><b>手动触发更新</b></div>
      <div class="upd-trigger-desc">如果发现新的 AI 重大进展, 可以手动触发一次更新:</div>
      <button class="upd-trigger-btn" id="manualUpdateBtn">🔄 检查本周 AI 最新进展</button>
      <div class="upd-trigger-note" id="updTriggerNote"></div>`;
    root.appendChild(trigger);

    // 绑定手动触发按钮
    const btn = trigger.querySelector("#manualUpdateBtn");
    btn.addEventListener("click", () => {
      const note = $("updTriggerNote");
      note.innerHTML = `<span class="upd-loading">⏳ 正在检查本周 AI 最新进展...</span>`;
      // 模拟检查 (真实更新需要 AI 助理执行)
      setTimeout(() => {
        note.innerHTML = `
          <div class="upd-trigger-result">
            <div class="upd-result-icon">ℹ️</div>
            <div class="upd-result-text">
              <b>手动更新说明</b><br>
              本应用的数据更新需要 AI 助理执行以下步骤:<br>
              1. 用 WebSearch 搜索本周 AI 重大新闻<br>
              2. 用 Edit 工具在 data.js 对应数组追加新内容<br>
              3. 更新 DATA.meta.lastUpdated 日期<br>
              4. 重启 http.server 8770<br><br>
              <b>请对 AI 助理说:</b> "检查本周 AI 最新进展并更新路线图"
            </div>
          </div>`;
      }, 800);
    });
  }

  /* ============================ 事件绑定 ============================ */
  function attachListeners() {
    // 视图 tabs
    document.querySelectorAll("#viewTabs button").forEach((b) => {
      b.addEventListener("click", () => switchView(b.dataset.view));
    });

    // 视图切换（列表/架构图）
    document.querySelectorAll(".view-toggle .vt-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const target = btn.dataset.target;
        const mode = btn.dataset.mode;
        const parent = btn.closest(".view");
        // 切换按钮状态
        parent.querySelectorAll(".vt-btn").forEach((b) => b.classList.toggle("active", b === btn));
        // 切换显示
        const listEl = $(target);
        const diagEl = target === "archRoot" ? $("archDiagram") : $("appDiagram");
        if (mode === "diagram") {
          if (listEl) listEl.style.display = "none";
          if (diagEl) diagEl.style.display = "block";
        } else {
          if (listEl) listEl.style.display = "";
          if (diagEl) diagEl.style.display = "none";
        }
      });
    });

    // 搜索
    let t;
    $("searchInput").addEventListener("input", (e) => {
      const wrap = $("searchWrap");
      if (wrap) wrap.classList.toggle("has-text", !!e.target.value);
      clearTimeout(t);
      t = setTimeout(() => handleSearch(e.target.value), 120);
    });
    // 清空搜索按钮
    const clearBtn = $("searchClear");
    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        $("searchInput").value = "";
        $("searchWrap").classList.remove("has-text");
        handleSearch("");
        $("searchInput").focus();
      });
    }

    // 弹窗
    $("modalClose").addEventListener("click", closeModal);
    $("modalBack").addEventListener("click", modalBack);
    $("modalMask").addEventListener("click", (e) => {
      if (e.target === $("modalMask")) closeModal();
    });

    // 新手横幅
    const banner = $("noviceBanner");
    if (banner) {
      // localStorage 记忆关闭状态
      if (localStorage.getItem("ai_roadmap_nb_closed") === "1") banner.style.display = "none";
      $("nbClose").addEventListener("click", () => {
        banner.style.display = "none";
        try { localStorage.setItem("ai_roadmap_nb_closed", "1"); } catch (e) {}
      });
      banner.querySelectorAll("a[data-jump]").forEach((a) => {
        a.addEventListener("click", (e) => {
          e.preventDefault();
          switchView(a.dataset.jump);
        });
      });
    }

    // 键盘
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        if ($("modalMask").classList.contains("open")) {
          if (state.modalStack.length > 1) modalBack();
          else closeModal();
        }
      }
      // "/" 聚焦搜索
      if (e.key === "/" && document.activeElement.tagName !== "INPUT") {
        e.preventDefault();
        $("searchInput").focus();
      }
    });
  }

  /* ----------------------------- 启动 ----------------------------- */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // 暴露调试接口
  window.__AI_ROADMAP__ = { DATA, state, switchView, openModal };
})();
