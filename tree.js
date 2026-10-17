(function () {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  const tree = window.PLANT_TREE;
  const GAP = 8; // Equal left and right padding for every branch label.
  const DY = 44, MARGIN_X = 30, MARGIN_Y = 32;
  function svgEl(parent, tag, attrs, text) {
    const el = document.createElementNS(NS, tag);
    for (const [name, value] of Object.entries(attrs)) el.setAttribute(name, value);
    if (text !== undefined) el.textContent = text;
    parent.appendChild(el);
    return el;
  }
  function ancestry(root, target, path = []) {
    const next = [...path, root];
    if (root.id === target) return next;
    for (const child of root.children || []) {
      const result = ancestry(child, target, next);
      if (result) return result;
    }
    return null;
  }
  function focusedModel(focus) {
    const path = ancestry(tree, focus);
    if (!path) return null;
    const begin = Math.max(0, path.length - 4);
    function clone(node, index) {
      const onPath = path[index + 1];
      if (!onPath) return { ...node, children: [] };
      return { ...node, children: (node.children || []).map(child =>
        child.id === onPath.id ? clone(child, index + 1) : { ...child, children: [] }) };
    }
    return clone(path[begin], begin);
  }
  function render(svg) {
    const focus = svg.dataset.focus;
    const model = focus ? focusedModel(focus) : tree;
    if (!model) return;
    svg.replaceChildren();
    const nodes = [];
    let leaves = 0;

    // Measure using the *actual SVG font*. Hidden main-tree labels measure zero.
    function measure(text) {
      if (!text) return 0;
      const probe = svgEl(svg, 'text', {class: 'taxon', x: -10000, y: -10000}, text);
      const width = probe.getComputedTextLength();
      probe.remove();
      return width;
    }
    function structure(node) {
      const n = { ...node };
      n.children = (node.children || []).map(structure);
      n.visibleLabel = !!focus || node.showOnMain !== false;
      n.labelWidth = measure(n.visibleLabel ? n.name : '');
      if (!n.children.length) n.y = MARGIN_Y + leaves++ * DY;
      else n.y = (n.children[0].y + n.children[n.children.length - 1].y) / 2;
      nodes.push(n);
      return n;
    }
    const root = structure(model);

    // Each branching point ends exactly after the right label padding.
    // Child branches begin at that same position: no extra tail is inserted.
    function place(node, startX) {
      node.x = startX;
      node.endX = startX + GAP + node.labelWidth + GAP;
      for (const child of node.children) place(child, node.endX);
    }
    place(root, MARGIN_X);

    const farRight = Math.max(...nodes.map(n => n.endX));
    const width = Math.max(320, Math.ceil(farRight + MARGIN_X));
    const height = Math.max(135, MARGIN_Y * 2 + (leaves - 1) * DY);
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.setAttribute('width', width);
    svg.setAttribute('height', height);

    // Draw lines first. Branch text sits just ABOVE its horizontal line.
    // For a hidden label the horizontal part is exactly 2 * GAP wide.
    for (const n of nodes) {
      svgEl(svg, 'path', {
        d: `M ${n.x} ${n.y} H ${n.children.length ? n.endX : n.x + GAP}`,
        class: 'branch'
      });
      if (n.children.length > 1) {
        svgEl(svg, 'path', {
          d: `M ${n.endX} ${n.children[0].y} V ${n.children[n.children.length - 1].y}`,
          class: 'branch'
        });
      }
    }
    for (const n of nodes) {
      if (!n.visibleLabel) continue;
      const isLeaf = !n.children.length;
      const className = n.id === focus ? 'selected-taxon' :
        (n.page && !focus ? 'family-link' : 'taxon');
      let holder = svg;
      if (n.page && !focus) holder = svgEl(svg, 'a', {href: n.page});
      const label = svgEl(holder, 'text', {
        x: n.x + GAP,
        y: isLeaf ? n.y + 5 : n.y - 8,
        class: className
      }, n.name);
      if (n.id === focus) {
        const box = label.getBBox();
        const rect = document.createElementNS(NS, 'rect');
        rect.setAttribute('x', box.x - 6);
        rect.setAttribute('y', box.y - 5);
        rect.setAttribute('width', box.width + 12);
        rect.setAttribute('height', box.height + 10);
        rect.setAttribute('class', 'focus-box');
        svg.insertBefore(rect, holder === svg ? label : holder);
      }
    }
  }
  document.querySelectorAll('svg[data-tree]').forEach(render);
})();
