(() => {
  const S = { tab: "home", data: null, activity: [], chart: null, error: null };
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const money = (n) => { const v = Number(n || 0); return (v < 0 ? "-" : "") + "$" + Math.abs(v).toFixed(2); };
  const ago = (ts) => { if (!ts) return "—"; const s = Math.max(0, Date.now()/1000 - Number(ts)); return s < 60 ? Math.round(s)+"s" : s < 3600 ? Math.round(s/60)+"m" : Math.round(s/3600)+"h"; };

  function dataPath() {
    const m = (location.hash || "").match(/[#&]d=([^&]+)/);
    if (m) { localStorage.setItem("desk_data_path", decodeURIComponent(m[1])); history.replaceState(null, "", location.pathname + location.search); }
    return localStorage.getItem("desk_data_path") || "";
  }
  async function getJSON(name) {
    const r = await fetch(`./d/${encodeURIComponent(dataPath())}/${name}?_=${Date.now()}`, { cache: "no-store" });
    if (!r.ok) throw new Error(`${name}: HTTP ${r.status}`);
    return r.json();
  }

  function home() {
    const d = S.data, b = d.balance || {};
    let h = `<div class="card"><h3>Portfolio</h3>
      <div class="row"><span class="muted">Cash</span><span>${money(b.cash_usd)}</span></div>
      <div class="row"><span class="muted">Equity</span><span>${money(b.equity_usd)}</span></div>
      <div class="row"><span class="muted">Realized</span><span class="${Number(b.realized_pnl)>=0?"pos":"neg"}">${money(b.realized_pnl)}</span></div>
      <div class="row"><span class="muted">Status</span><span>${d.paused ? "PAUSED" : "RUNNING"}</span></div>
      <div class="row"><span class="muted">Updated</span><span>${ago(d.ts)} ago</span></div></div>`;
    if (S.chart && S.chart.points && S.chart.points.length > 1) h += `<div class="card chart-wrap"><canvas id="chart" style="width:100%;height:140px"></canvas></div>`;
    h += `<div class="card"><h3>Open positions</h3>`;
    const pos = d.positions || [];
    if (!pos.length) h += `<div class="empty">No open positions</div>`;
    pos.forEach(p => { const pnl = Number(p.pnl_unrealized || 0); h += `<div class="row"><div><div class="sym">${esc(p.symbol || (p.mint||"").slice(0,6))}</div><div class="muted mono">${esc((p.mint||"").slice(0,8))}… · ${money(p.size_usd)}</div></div><div class="${pnl>=0?"pos":"neg"}">${money(pnl)}</div></div>`; });
    h += `</div><div class="card"><h3>Waiting room</h3>`;
    const w = d.waiting || [];
    if (!w.length) h += `<div class="empty">Empty</div>`;
    w.forEach(x => { h += `<div class="row"><div><div class="sym">${esc(x.symbol || x.name || (x.mint||"").slice(0,6))}</div><div class="muted mono">${esc((x.mint||"").slice(0,8))}… · seen ${ago(x.first_seen_at)} ago</div></div><div class="muted">liq ${money(x.last_liq)}</div></div>`; });
    return h + `</div>`;
  }
  function agents() {
    const hb = S.data.heartbeats || {};
    const ks = Object.keys(hb);
    let h = `<div class="card"><h3>Agents</h3>`;
    if (!ks.length) h += `<div class="empty">No heartbeats</div>`;
    ks.forEach(k => { const v = hb[k]; const ts = (v && typeof v === "object") ? (v.ts || v.at || v.last) : v; const age = ts ? Date.now()/1000 - Number(ts) : Infinity;
      h += `<div class="row"><span class="sym">${esc(k)}</span><span class="${age < 300 ? "pos" : "neg"}">${ts ? ago(ts) + " ago" : "—"}</span></div>`; });
    return h + `</div>`;
  }
  function activity() {
    const it = S.activity.length ? S.activity : (S.data.activity || []);
    let h = `<div class="card"><h3>Activity</h3>`;
    if (!it.length) h += `<div class="empty">No activity yet</div>`;
    it.slice(0, 100).forEach(a => { const t = a.ts || a.created_at; const txt = a.text || a.message || a.msg || a.kind || JSON.stringify(a);
      h += `<div class="row"><span>${esc(txt)}</span><span class="muted">${t ? ago(t) : ""}</span></div>`; });
    return h + `</div>`;
  }
  function account() {
    const d = S.data;
    const link = (u) => u ? `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(u)}</a>` : "—";
    return `<div class="card"><h3>Account</h3>
      <div class="row"><span class="muted">FOMO</span><span>${esc(d.fomo_handle || "—")}</span></div>
      <div class="row"><span class="muted">Profile</span><span>${link(d.profile_url)}</span></div>
      <div class="row"><span class="muted">Signup</span><span>${link(d.signup_url)}</span></div>
      <div class="row"><span class="muted">Mode</span><span>${esc(d.mode || "PAPER")}</span></div></div>
      <div class="card muted">Plan B : lecture seule (GitHub Pages). Pause, réglages et contrôles via Telegram.</div>`;
  }

  function render() {
    const v = $("view");
    document.querySelectorAll(".tab").forEach(b => b.classList.toggle("active", b.dataset.tab === S.tab));
    if (!dataPath()) { v.innerHTML = `<div class="card error">Lien incomplet : ouvrez une fois le lien Desk contenant <span class="mono">#d=…</span> pour enregistrer l'accès.</div>`; return; }
    if (!S.data) { v.innerHTML = S.error ? `<div class="card error">Desk hors ligne ou données manquantes.<br><span class="muted">${esc(S.error)}</span></div>` : `<div class="card empty">Chargement…</div>`; return; }
    const b = S.data.balance || {};
    $("equity").textContent = money(b.equity_usd);
    const badge = $("paperBadge"); badge.textContent = S.data.mode || "PAPER"; badge.classList.toggle("live", String(S.data.mode).toUpperCase() === "LIVE");
    let h = S.error ? `<div class="card error">Desk hors ligne (dernières données affichées) : ${esc(S.error)}</div>` : "";
    h += ({ home, agents, activity, account }[S.tab] || home)();
    v.innerHTML = h;
    const c = $("chart"); if (c && window.DeskChart) window.DeskChart.draw(c, S.chart.points);
  }

  async function poll() {
    if (!dataPath()) return render();
    try {
      const [s, a, c] = await Promise.all([getJSON("state.json"), getJSON("activity.json").catch(() => ({ items: [] })), getJSON("chart.json").catch(() => null)]);
      S.data = s; S.activity = (a && a.items) || []; S.chart = c; S.error = null;
    } catch (e) { S.error = e.message || String(e); }
    render();
  }

  document.querySelectorAll(".tab").forEach(b => b.addEventListener("click", () => { S.tab = b.dataset.tab; render(); }));
  window.addEventListener("hashchange", poll);
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("./sw.js").catch(() => {});
  render(); poll(); setInterval(poll, 15000);
})();
