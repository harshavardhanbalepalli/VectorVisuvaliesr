const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

/* ───────────── SAFE EVAL ───────────── */

function safeEval(expr, x, y) {
  try {
    const sanitized = expr
      .replace(/\^/g, "**")
      .replace(/[^0-9a-zA-Z_\+\-\*\/\(\)\.\s]/g, "");

    const fn = new Function(
      "x","y","sin","cos","tan","exp","log","sqrt","abs","PI","E",
      `"use strict"; return (${sanitized});`
    );

    const result = fn(
      x, y,
      Math.sin, Math.cos, Math.tan,
      Math.exp, Math.log, Math.sqrt,
      Math.abs, Math.PI, Math.E
    );

    return isFinite(result) ? result : null;
  } catch {
    return null;
  }
}

/* ───────────── NUMERICAL CALCULUS ───────────── */

function numericalGradient(expr, x, y) {
  const h = 1e-5;

  const f1 = safeEval(expr, x + h, y);
  const f2 = safeEval(expr, x - h, y);
  const f3 = safeEval(expr, x, y + h);
  const f4 = safeEval(expr, x, y - h);

  if ([f1, f2, f3, f4].includes(null)) {
    return { vx: null, vy: null };
  }

  return {
    vx: (f1 - f2) / (2 * h),
    vy: (f3 - f4) / (2 * h),
  };
}

function numericalPartials(fx, fy, x, y) {
  const h = 1e-5;

  const fx1 = safeEval(fx, x + h, y);
  const fx2 = safeEval(fx, x - h, y);
  const fx3 = safeEval(fx, x, y + h);
  const fx4 = safeEval(fx, x, y - h);

  const fy1 = safeEval(fy, x + h, y);
  const fy2 = safeEval(fy, x - h, y);
  const fy3 = safeEval(fy, x, y + h);
  const fy4 = safeEval(fy, x, y - h);

  if ([fx1, fx2, fx3, fx4, fy1, fy2, fy3, fy4].includes(null)) {
    return null;
  }

  return {
    dFx_dx: (fx1 - fx2) / (2 * h),
    dFx_dy: (fx3 - fx4) / (2 * h),
    dFy_dx: (fy1 - fy2) / (2 * h),
    dFy_dy: (fy3 - fy4) / (2 * h),
  };
}

/* ───────────── GRID ───────────── */

function makeGrid({ xMin=-4, xMax=4, yMin=-4, yMax=4 }) {
  const steps = 14;
  const sx = (xMax - xMin) / steps;
  const sy = (yMax - yMin) / steps;

  const grid = [];

  for (let x = xMin; x <= xMax; x += sx) {
    for (let y = yMin; y <= yMax; y += sy) {
      grid.push([x, y]);
    }
  }

  return grid;
}

/* ───────────── GENERATORS ───────────── */

function generateCustom(type, exprs, opts) {
  const data = [];

  for (const [x, y] of makeGrid(opts)) {
    let vx, vy;

    if (type === "gradient") {
      const g = numericalGradient(exprs.f, x, y);
      vx = g.vx;
      vy = g.vy;
    } else {
      vx = safeEval(exprs.fx, x, y);
      vy = safeEval(exprs.fy, x, y);
    }

    if (
      vx === null || vy === null ||
      isNaN(vx) || isNaN(vy)
    ) continue;

    data.push({
      x: +x.toFixed(3),
      y: +y.toFixed(3),
      vx: +vx.toFixed(4),
      vy: +vy.toFixed(4),
    });
  }

  return data;
}

/* ───────────── ROUTES ───────────── */

app.get("/api/functions", (req, res) => {
  res.json({
    gradient: [{ key: "custom", label: "Custom Gradient" }],
    curl: [{ key: "custom", label: "Custom Curl" }],
    divergence: [{ key: "custom", label: "Custom Divergence" }],
  });
});

["gradient", "curl", "divergence"].forEach((type) => {
  app.post(`/api/${type}`, (req, res) => {
    try {
      const { custom, exprs, xMin, xMax, yMin, yMax } = req.body;

      if (!custom || !exprs) {
        return res.status(400).json({ error: "Invalid request" });
      }

      if (type === "gradient" && !exprs.f) {
        return res.status(400).json({ error: "Missing f(x,y)" });
      }

      if (type !== "gradient" && (!exprs.fx || !exprs.fy)) {
        return res.status(400).json({ error: "Missing Fx or Fy" });
      }

      const data = generateCustom(type, exprs, {
        xMin, xMax, yMin, yMax,
      });

      if (!data.length) {
        return res.status(400).json({
          error: "Invalid expression — no valid points generated"
        });
      }

      return res.json({
        type,
        func: "custom",
        label:
          type === "gradient"
            ? `f = ${exprs.f}`
            : `F = (${exprs.fx}, ${exprs.fy})`,
        custom: true,
        data,
      });

    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  });
});

/* ───────────── START SERVER ───────────── */

app.listen(4000, () => {
  console.log("✅ Vector API running on http://localhost:4000");
});