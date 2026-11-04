(() => {
  const state = { tab: "home", data: null, activity: [], chart: null, error: null, loading: true, retryIn: 5 };

  function dataPath() {
    const hash = location.hash || "";
    const m = hash.match(/[#&]d=([^&]+)/);
    if (m) {
      localStorage.setItem("desk_data_path", decodeURIComponent(m[1]));
      history.replaceState(null, "", location.pathname + location.search);
    }
    return localStorage.getItem("desk_data_path") || "";
  }

  async function loadJson(name) {
    const d = dataPath();
    if (!d) throw new Error("Missing data path. Open once with #d=…");
    const url = `./d/${d}/${name}.json?t=${Date.now()}`;
    const res = await fetch(url, { cache: "no-store" });
    if (res.status === 404) throw new Error("data not found");
    if (!res.ok) throw new Error(`${res.status}`);
    return res.json();
  }

  function money(n) {
    const v = Number(n || 0);
    return (v < 0 ? "-" : "") + "$" + Math.abs(v).toFixed(2);
  }

  function setBadge(mode) {
    const b = document.getElementById("paperBadge");
    if (!b) return;
    b.textContent = mode || "PAPER";
    b.classList.toggle("live", (mode || "").toUpperCase() === "LIVE");
  }

  function render() {
    const rootEl = document.getElementById("app") || document.getElementById("root") || document.body;
    const err = document.getElementById("errRow");
    if (err) {
      if (state.error) {
        err.textContent = `Desk offline · retrying in ${state.retryIn}s · ${state.error}`;
        err.classList.remove("hidden");
      } else err.classList.add("hidden");
    }
    const d = state.data;
    if (d) setBadge(d.mode || "PAPER");
    const bal = document.getElementById("balance");
    if (bal && d && d.balance) bal.textContent = money(d.balance.equity_usd ?? d.balance.cash_usd);
    const home = document.getElementById("homePane") || document.getElementById("content");
    if (home && d) {
      const eq = d.balance ? (d.balance.equity_usd ?? d.balance.cash_usd) : 0;
      home.innerHTML = `<div class="card"><div class="muted">PAPER · Plan B</div><div style="font-size:48px;font-variant-numeric:tabular-nums">${money(eq)}</div>
        <div class="muted">Cash ${money(d.balance && d.balance.cash_usd)} · mode ${d.mode||"PAPER"}</div></div>
        <div class="card"><h3>Agents</h3><div class="muted">${(d.agents||[]).length ? JSON.stringify(d.agents).slice(0,200) : "5 running (Telegram for controls)"}</div></div>
        <div class="card"><h3>Activity</h3>${(state.activity.rows||state.activity.items||[]).slice(0,5).map(r=>`<div class="row">${r.title||r.kind||"event"} <span class="muted">${r.value||""}</span></div>`).join("") || '<div class="empty">Nothing yet tonight</div>'}</div>`;
    }
  }

  async function tick() {
    try {
      state.data = await loadJson("state");
      try { state.activity = await loadJson("activity"); } catch(_) { state.activity = {rows:[]}; }
      try { state.chart = await loadJson("chart"); } catch(_) {}
      state.error = null;
      state.loading = false;
      render();
    } catch (e) {
      state.error = String(e.message || e);
      render();
    }
  }

  async function loop() {
    await tick();
    setTimeout(loop, 15000);
  }

  if (!dataPath()) {
    document.body.innerHTML = '<div style="padding:24px;font-family:-apple-system,sans-serif;background:#000;color:#fff;min-height:100vh">Ouvre une fois le lien avec <code>#d=…</code> (je te l’envoie).</div>';
    return;
  }
  loop();
})();
