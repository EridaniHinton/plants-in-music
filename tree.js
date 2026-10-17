(function () {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  const tree = window.PLANT_TREE;
  const DX = 155, DY = 44, MARGIN_X = 30, MARGIN_Y = 32;
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
    // The last three clades before the selected taxon, with sibling branches
    // present but not expanded. Unnamed levels still count as branches.
    const begin = Math.max(0, path.length - 4);
    function clone(node, index) {
      const onPath = path[index + 1];
      if (!onPath) return { ...node, children: [] };
      return { ...node, children: (node.children || []).map(child =>
        child.id === onPath.id ? clone(child, index + 1) : {...child, children: []}) };
    }
    return clone(path[begin], begin);
  }
  function render(svg) {
    const focus = svg.dataset.focus;
    const model = focus ? focusedModel(focus) : tree;
    if (!model) return;
    const nodes = [];
    let leaves = 0;
    let maxDepth = 0;
    function position(node, depth) {
      const n = { ...node, depth, x: MARGIN_X + depth * DX };
      n.children = (node.children || []).map(child => position(child, depth + 1));
      n.y = n.children.length
        ? (n.children[0].y + n.children[n.children.length-1].y) / 2
        : MARGIN_Y + leaves++ * DY;
      maxDepth = Math.max(maxDepth, depth);
      nodes.push(n);
      return n;
    }
    const laidOut = position(model, 0);
    const width = MARGIN_X + (maxDepth + 1) * DX + 165;
    const height = Math.max(135, MARGIN_Y * 2 + (leaves - 1) * DY);
    svg.replaceChildren();
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.setAttribute('width', width);
    svg.setAttribute('height', height);
    // Branches are drawn first, so labels remain on top.
    for (const n of nodes) {
      if (!n.children.length) continue;
      const first = n.children[0], last = n.children[n.children.length-1];
      const joinX = n.x + 45;
      svgEl(svg, 'path', {d:`M ${n.x - 14} ${n.y} H ${joinX} M ${joinX} ${first.y} V ${last.y}`, class:'branch'});
      for (const c of n.children) {
        svgEl(svg, 'path', {d:`M ${joinX} ${c.y} H ${c.x}`, class:'branch'});
      }
    }
    for (const n of nodes) {
      if (!focus && n.showOnMain === false) continue;
      const isLeaf = !n.children.length;
      const className = n.id === focus ? 'selected-taxon' : (n.page && !focus ? 'family-link' : 'taxon');
      const x = isLeaf ? n.x + 7 : n.x - 5;
      const y = isLeaf ? n.y + 5 : n.y - 9;
      let holder = svg;
      if (n.page && !focus) {
        holder = svgEl(svg, 'a', {href:n.page});
      }
      const label = svgEl(holder, 'text', {x, y, class:className}, n.name);
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
