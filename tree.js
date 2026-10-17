(function () {
  "use strict";
  const NS = "http://www.w3.org/2000/svg";
  const STEP_X = 175, STEP_Y = 48, START_X = 34, START_Y = 33;
  function elem(svg, kind, attrs, text) {
    const e = document.createElementNS(NS, kind);
    for (const [key, value] of Object.entries(attrs)) e.setAttribute(key, value);
    if (text !== undefined) e.textContent = text;
    svg.appendChild(e);
    return e;
  }
  const descendants = n => [n, ...(n.children || []).flatMap(descendants)];
  function locate(root, id) { return descendants(root).find(n => n.id === id); }
  function render(svg, opts = {}) {
    const focus = opts.focus || null;
    const root = window.PLANT_TREE;
    // Focused view: up to three parent clades plus the selected taxon.
    // Include sister branches but do not expand their descendants.
    let model;
    if (focus) {
      const path = [];
      function findPath(n) {
        path.push(n);
        if (n.id === focus) return true;
        for (const c of n.children || []) if (findPath(c)) return true;
        path.pop();
        return false;
      }
      if (!findPath(root)) return;
      const start = Math.max(0, path.length - 4);
      function limited(n, level) {
        if (level >= path.length - 1) return { ...n, children: [] };
        const next = path[level + 1];
        return { ...n, children: (n.children || []).map(c =>
          c.id === next.id ? limited(c, level + 1) : { ...c, children: [] }
        ) };
      }
      model = limited(path[start], start);
    } else model = root;
    const nodes = [];
    let leaf = 0;
    function layout(n, depth) {
      const visibleChildren = (n.children || []).filter(c => !opts.main || c.showOnMain !== false);
      n = { ...n, children: visibleChildren, depth, x: START_X + depth * STEP_X };
      n.children = visibleChildren.map(c => layout(c, depth + 1));
      n.y = n.children.length ? (n.children[0].y + n.children[n.children.length - 1].y)/2 : START_Y + leaf++ * STEP_Y;
      nodes.push(n);
      return n;
    }
    const drawn = layout(model, 0);
    const width = Math.max(550, ...nodes.map(n => n.x + 170));
    const height = Math.max(120, START_Y + Math.max(leaf - 1, 0) * STEP_Y + 35);
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.setAttribute("width", width);
    svg.setAttribute("height", height);
    svg.replaceChildren();
    for (const n of nodes) {
      if (!n.children.length) continue;
      const joinX = n.x + 100;
      elem(svg, "path", {d:`M ${n.x + 10} ${n.y} H ${joinX} V ${n.children[0].y} V ${n.children[n.children.length-1].y}`, class:"branch"});
      for (const c of n.children) elem(svg,"path",{d:`M ${joinX} ${c.y} H ${c.x + 8}`,class:"branch"});
    }
    for (const n of nodes) {
      const labelY = n.children.length ? n.y - 7 : n.y + 4;
      if (n.page && !focus) {
        const a = elem(svg, "a", {href:n.page});
        const t = document.createElementNS(NS,"text");
        t.setAttribute("x", n.x + 14); t.setAttribute("y", labelY);
        t.setAttribute("class", "family-link"); t.textContent = n.name; a.appendChild(t);
      } else {
        const x = n.children.length ? n.x + 12 : n.x + 14;
        elem(svg,"text",{x,y:labelY,class:n.id===focus ? "selected-taxon" : "taxon"},n.name);
      }
    }
  }
  document.querySelectorAll("svg[data-tree]").forEach(svg => render(svg, {
    focus: svg.dataset.focus || null,
    main: svg.dataset.tree === "main"
  }));
})();
