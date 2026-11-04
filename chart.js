/* Minimal canvas sparkline / line chart — no framework */
window.DeskChart = {
  draw(canvas, points, opts) {
    opts = opts || {};
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(1, Math.floor(rect.width * dpr));
    const h = Math.max(1, Math.floor(rect.height * dpr));
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, w, h);
    if (!points || points.length < 2) {
      ctx.fillStyle = "#8e8e93";
      ctx.font = `${12 * dpr}px sans-serif`;
      ctx.fillText("No chart data", 12 * dpr, h / 2);
      return;
    }
    const vals = points.map(p => +p.price_usd).filter(v => !isNaN(v));
    let min = Math.min(...vals), max = Math.max(...vals);
    if (min === max) { min *= 0.99; max *= 1.01; }
    const pad = 8 * dpr;
    const up = vals[vals.length - 1] >= vals[0];
    const color = up ? "#00c853" : "#ff3b30";
    ctx.beginPath();
    vals.forEach((v, i) => {
      const x = pad + (i / (vals.length - 1)) * (w - pad * 2);
      const y = pad + (1 - (v - min) / (max - min)) * (h - pad * 2);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = color;
    ctx.lineWidth = 2 * dpr;
    ctx.stroke();
    // fill
    ctx.lineTo(w - pad, h - pad);
    ctx.lineTo(pad, h - pad);
    ctx.closePath();
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, up ? "rgba(0,200,83,0.25)" : "rgba(255,59,48,0.25)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fill();
  }
};
