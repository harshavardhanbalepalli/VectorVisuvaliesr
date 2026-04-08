import React, { useRef, useEffect } from "react";

export default function VectorCanvas({ data = [], accent = "#4fffb0", width = 700, height = 540 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!data.length) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;

    // background
    ctx.fillStyle = "#060a10";
    ctx.fillRect(0, 0, W, H);

    // grid
    ctx.strokeStyle = "rgba(30,45,66,0.5)";
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 10; i++) {
      const px = (W / 10) * i, py = (H / 10) * i;
      ctx.beginPath(); ctx.moveTo(px,0); ctx.lineTo(px,H); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0,py); ctx.lineTo(W,py); ctx.stroke();
    }

    // axes
    ctx.strokeStyle = "rgba(255,255,255,0.07)";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(W/2,0); ctx.lineTo(W/2,H); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0,H/2); ctx.lineTo(W,H/2); ctx.stroke();

    // axis labels
    ctx.fillStyle = "rgba(255,255,255,0.15)";
    ctx.font = "11px monospace";
    ctx.fillText("x", W - 14, H/2 - 6);
    ctx.fillText("y", W/2 + 6, 14);

    // magnitudes
    const mags = data.map(({ vx, vy }) => Math.sqrt(vx*vx + vy*vy));
    const maxMag = Math.max(...mags) || 1;

    // domain
    const xs = data.map(d => d.x), ys = data.map(d => d.y);
    const xMin = Math.min(...xs), xMax = Math.max(...xs);
    const yMin = Math.min(...ys), yMax = Math.max(...ys);
    const domW = xMax - xMin || 1, domH = yMax - yMin || 1;

    const toX = x => ((x - xMin) / domW) * (W * 0.88) + W * 0.06;
    const toY = y => H - (((y - yMin) / domH) * (H * 0.88) + H * 0.06);

    const cellW = (W * 0.88) / (domW / ((xMax - xMin) / Math.sqrt(data.length)));
    const arrowScale = (cellW * 0.42) / maxMag;

    // parse accent color
    const r = parseInt(accent.slice(1,3),16);
    const g = parseInt(accent.slice(3,5),16);
    const b = parseInt(accent.slice(5,7),16);

    const magColor = (mag) => {
      const t = mag / maxMag;
      return `rgba(${Math.round(20+t*(r-20))},${Math.round(30+t*(g-30))},${Math.round(80+t*(b-80))},${0.45+t*0.55})`;
    };

    data.forEach(({ x, y, vx, vy }) => {
      const mag = Math.sqrt(vx*vx + vy*vy);
      if (mag < 1e-6) return;

      const cx = toX(x), cy = toY(y);
      const dx = vx * arrowScale, dy = -vy * arrowScale;
      const ex = cx + dx, ey = cy + dy;
      const color = magColor(mag);

      // shaft
      ctx.beginPath();
      ctx.moveTo(cx, cy); ctx.lineTo(ex, ey);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // arrowhead
      const headLen = Math.min(8, Math.max(3, mag * arrowScale * 0.38));
      const angle = Math.atan2(ey - cy, ex - cx);
      const spread = 0.4;
      ctx.beginPath();
      ctx.moveTo(ex, ey);
      ctx.lineTo(ex - headLen * Math.cos(angle - spread), ey - headLen * Math.sin(angle - spread));
      ctx.lineTo(ex - headLen * Math.cos(angle + spread), ey - headLen * Math.sin(angle + spread));
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();

      // tail dot
      ctx.beginPath();
      ctx.arc(cx, cy, 1.3, 0, Math.PI*2);
      ctx.fillStyle = `rgba(${r},${g},${b},0.25)`;
      ctx.fill();
    });
  }, [data, accent]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{ width: "100%", height: "auto" }}
    />
  );
}
