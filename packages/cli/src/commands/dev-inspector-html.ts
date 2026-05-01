// Inspector UI shipped inline with the CLI. Vanilla JS — no build step,
// no external deps. Lives in its own module so dev.ts stays readable.

export const INSPECTOR_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Imprint dev</title>
<style>
  :root {
    color-scheme: dark;
    --bg: #0f1115;
    --panel: #161922;
    --panel-2: #1d2230;
    --border: #2a2f3d;
    --text: #e6e9f2;
    --muted: #8a93a6;
    --accent: #4ec9b0;
    --warn: #f08d49;
    --error: #f48771;
  }
  * { box-sizing: border-box; }
  html, body { margin: 0; height: 100%; background: var(--bg); color: var(--text); font: 13px/1.4 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
  body { display: grid; grid-template-columns: minmax(0, 1fr) 420px; height: 100vh; overflow: hidden; }
  .preview { background: #1a1a1a; border-right: 1px solid var(--border); position: relative; }
  .preview iframe { width: 100%; height: 100%; border: 0; background: #1a1a1a; }
  .preview .badge { position: absolute; left: 12px; bottom: 12px; padding: 4px 8px; background: rgba(0,0,0,0.6); border: 1px solid var(--border); border-radius: 4px; font-size: 11px; color: var(--muted); }
  .preview .badge.fresh { color: var(--accent); }
  .inspector { display: flex; flex-direction: column; min-width: 0; }
  header { padding: 10px 14px; border-bottom: 1px solid var(--border); background: var(--panel); display: flex; align-items: center; justify-content: space-between; gap: 8px; }
  header .file { font-family: ui-monospace, SF Mono, Menlo, monospace; font-size: 11px; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  header .status { font-size: 11px; color: var(--accent); }
  header .status.error { color: var(--error); }
  .tree { flex: 1 1 60%; overflow: auto; padding: 6px 0; border-bottom: 1px solid var(--border); }
  .detail { flex: 1 1 40%; overflow: auto; padding: 10px 14px; background: var(--panel); }
  .row { display: flex; align-items: center; gap: 4px; padding: 2px 8px 2px 0; cursor: pointer; user-select: none; white-space: nowrap; font-family: ui-monospace, SF Mono, Menlo, monospace; font-size: 12px; }
  .row:hover { background: var(--panel-2); }
  .row.selected { background: #2c3a5a; }
  .row .twist { width: 14px; text-align: center; color: var(--muted); }
  .row .type { color: var(--accent); }
  .row .meta { color: var(--muted); margin-left: 6px; font-size: 11px; }
  .row .text { color: #c8e1ff; margin-left: 6px; max-width: 220px; overflow: hidden; text-overflow: ellipsis; }
  .row .id { color: #555c70; margin-left: 6px; font-size: 10px; }
  .indent { display: inline-block; }
  .detail h3 { margin: 0 0 6px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted); font-weight: 600; }
  .detail section { margin-bottom: 14px; }
  .detail .field { display: grid; grid-template-columns: 110px 1fr; gap: 6px; margin: 2px 0; font-size: 12px; }
  .detail .field b { font-weight: 500; color: var(--muted); }
  .detail pre { margin: 0; font-family: ui-monospace, SF Mono, Menlo, monospace; font-size: 11px; white-space: pre-wrap; word-break: break-all; background: var(--panel-2); padding: 8px; border-radius: 4px; border: 1px solid var(--border); }
  .empty { color: var(--muted); font-style: italic; padding: 16px; }
  .error-banner { background: #3a1d1d; border: 1px solid #6b2b2b; color: #f4c1b8; padding: 8px 14px; font-family: ui-monospace, SF Mono, Menlo, monospace; font-size: 11px; white-space: pre-wrap; max-height: 160px; overflow: auto; }
</style>
</head>
<body>
  <div class="preview">
    <iframe id="pdf" src="/pdf"></iframe>
    <div class="badge" id="badge">loading…</div>
  </div>
  <div class="inspector">
    <header>
      <div class="file" id="file" title=""></div>
      <div class="status" id="status">connecting…</div>
    </header>
    <div id="errorBanner" class="error-banner" style="display:none"></div>
    <div class="tree" id="tree"></div>
    <div class="detail" id="detail">
      <div class="empty">Select a node to inspect.</div>
    </div>
  </div>
<script>
(function () {
  var state = { tree: null, file: null, selectedId: null, expanded: new Set() };
  var els = {
    file: document.getElementById('file'),
    status: document.getElementById('status'),
    tree: document.getElementById('tree'),
    detail: document.getElementById('detail'),
    badge: document.getElementById('badge'),
    err: document.getElementById('errorBanner'),
    pdf: document.getElementById('pdf'),
  };

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function fmtNumber(n) {
    if (typeof n !== 'number' || !isFinite(n)) return String(n);
    return Math.round(n * 100) / 100;
  }

  function buildTree(node, depth) {
    if (!node) return '';
    var hasChildren = node.children && node.children.length > 0;
    var isOpen = state.expanded.has(node.id);
    var twist = hasChildren ? (isOpen ? '▾' : '▸') : '·';
    var classNames = node.className ? ' .' + escapeHtml(node.className.split(/\\s+/).slice(0, 2).join('.')) : '';
    var meta = '';
    if (node.geometry) {
      meta = '[' + fmtNumber(node.geometry.width) + '×' + fmtNumber(node.geometry.height) + ']';
    }
    var text = node.text ? '"' + escapeHtml(node.text.slice(0, 40)) + (node.text.length > 40 ? '…' : '') + '"' : '';
    var selected = state.selectedId === node.id ? ' selected' : '';
    var indent = '<span class="indent" style="width:' + (depth * 14) + 'px"></span>';
    var html =
      '<div class="row' + selected + '" data-id="' + node.id + '" data-has-children="' + hasChildren + '">' +
      indent +
      '<span class="twist" data-twist="1">' + twist + '</span>' +
      '<span class="type">' + escapeHtml(node.type) + '</span>' +
      '<span class="meta">' + escapeHtml(classNames) + '</span>' +
      '<span class="text">' + text + '</span>' +
      '<span class="meta">' + meta + '</span>' +
      '<span class="id">' + escapeHtml(node.id) + '</span>' +
      '</div>';
    if (hasChildren && isOpen) {
      for (var i = 0; i < node.children.length; i++) {
        html += buildTree(node.children[i], depth + 1);
      }
    }
    return html;
  }

  function renderTree() {
    if (!state.tree) {
      els.tree.innerHTML = '<div class="empty">no tree yet</div>';
      return;
    }
    els.tree.innerHTML = buildTree(state.tree, 0);
  }

  function findNode(node, id) {
    if (!node) return null;
    if (node.id === id) return node;
    for (var i = 0; i < (node.children || []).length; i++) {
      var found = findNode(node.children[i], id);
      if (found) return found;
    }
    return null;
  }

  function renderDetail() {
    if (!state.selectedId) {
      els.detail.innerHTML = '<div class="empty">Select a node to inspect.</div>';
      return;
    }
    var node = findNode(state.tree, state.selectedId);
    if (!node) {
      els.detail.innerHTML = '<div class="empty">node not found in current tree</div>';
      return;
    }
    var rows = [
      ['type', node.type],
      ['id', node.id],
    ];
    if (node.className) rows.push(['className', node.className]);
    if (node.text != null) rows.push(['text', JSON.stringify(node.text)]);
    var fieldHtml = rows.map(function (r) {
      return '<div class="field"><b>' + escapeHtml(r[0]) + '</b><span>' + escapeHtml(String(r[1])) + '</span></div>';
    }).join('');

    var geomHtml = node.geometry
      ? '<section><h3>Geometry (pt)</h3>' +
          '<div class="field"><b>x · y</b><span>' + fmtNumber(node.geometry.x) + ' · ' + fmtNumber(node.geometry.y) + '</span></div>' +
          '<div class="field"><b>w × h</b><span>' + fmtNumber(node.geometry.width) + ' × ' + fmtNumber(node.geometry.height) + '</span></div>' +
          '<div class="field"><b>content</b><span>' + fmtNumber(node.geometry.contentWidth) + ' × ' + fmtNumber(node.geometry.contentHeight) + '</span></div>' +
          '<div class="field"><b>padding</b><span>' +
            fmtNumber(node.geometry.paddingTop) + ' / ' +
            fmtNumber(node.geometry.paddingRight) + ' / ' +
            fmtNumber(node.geometry.paddingBottom) + ' / ' +
            fmtNumber(node.geometry.paddingLeft) +
          '</span></div>' +
          (node.geometry.fontFamily ? '<div class="field"><b>fontFamily</b><span>' + escapeHtml(node.geometry.fontFamily) + '</span></div>' : '') +
        '</section>'
      : '<section><h3>Geometry</h3><div class="empty">no layout box</div></section>';

    var styleStr = JSON.stringify(node.style || {}, null, 2);
    var propsStr = JSON.stringify(node.props || {}, null, 2);

    els.detail.innerHTML =
      '<section><h3>Node</h3>' + fieldHtml + '</section>' +
      geomHtml +
      '<section><h3>Resolved style</h3><pre>' + escapeHtml(styleStr) + '</pre></section>' +
      '<section><h3>Props</h3><pre>' + escapeHtml(propsStr) + '</pre></section>';
  }

  function expandAncestors(id) {
    function walk(node, ancestors) {
      if (!node) return false;
      if (node.id === id) {
        ancestors.forEach(function (a) { state.expanded.add(a); });
        return true;
      }
      ancestors.push(node.id);
      for (var i = 0; i < (node.children || []).length; i++) {
        if (walk(node.children[i], ancestors)) return true;
      }
      ancestors.pop();
      return false;
    }
    walk(state.tree, []);
  }

  els.tree.addEventListener('click', function (e) {
    var row = e.target.closest('.row');
    if (!row) return;
    var id = row.getAttribute('data-id');
    if (e.target.getAttribute('data-twist') === '1' || e.target.classList.contains('twist')) {
      if (state.expanded.has(id)) state.expanded.delete(id);
      else state.expanded.add(id);
      renderTree();
      return;
    }
    state.selectedId = id;
    if (row.getAttribute('data-has-children') === 'true' && !state.expanded.has(id)) {
      state.expanded.add(id);
    }
    renderTree();
    renderDetail();
  });

  function refreshIframe() {
    try {
      els.pdf.src = '/pdf?t=' + Date.now();
    } catch (e) {}
  }

  function flashBadge(text, fresh) {
    els.badge.textContent = text;
    els.badge.classList.toggle('fresh', !!fresh);
  }

  function loadInspect() {
    return fetch('/inspect', { cache: 'no-store' }).then(function (r) {
      if (!r.ok) return r.json().then(function (j) { throw new Error(j.error || 'inspect failed'); });
      return r.json();
    }).then(function (data) {
      state.tree = data.tree;
      state.file = data.file;
      els.file.textContent = data.file;
      els.file.title = data.file;
      // expand the document + first page by default
      if (state.tree) {
        state.expanded.add(state.tree.id);
        if (state.tree.children[0]) state.expanded.add(state.tree.children[0].id);
      }
      els.err.style.display = 'none';
      flashBadge('rendered ' + new Date(data.renderedAt).toLocaleTimeString(), true);
      renderTree();
      renderDetail();
    }).catch(function (err) {
      els.err.style.display = 'block';
      els.err.textContent = err.message;
      flashBadge('error', false);
    });
  }

  function connect() {
    var es = new EventSource('/events');
    es.addEventListener('open', function () { els.status.textContent = 'live'; els.status.classList.remove('error'); });
    es.addEventListener('error', function () { els.status.textContent = 'reconnecting…'; els.status.classList.add('error'); });
    es.addEventListener('reload', function () {
      loadInspect();
      refreshIframe();
    });
    es.addEventListener('error', function (ev) {
      // browser fires generic error events; we already handle real render
      // errors via the /inspect 500 path inside loadInspect.
    });
  }

  loadInspect();
  connect();
})();
</script>
</body>
</html>`;
