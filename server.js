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

/* ───────────── PREDEFINED FUNCTIONS ───────────── */

const FUNCTIONS = {
  gradient: {
    quadratic: {
      label: "f = x² + y²",
      fn: (x,y) => ({ vx: 2*x, vy: 2*y }),
      diff: {
        form: "∇f = (∂f/∂x, ∂f/∂y)",
        result: "(2x, 2y)",
        steps: ["∂f/∂x = 2x", "∂f/∂y = 2y"]
      }
    }
  },

  curl: {
    rotation: {
      label: "F = (-y, x)",
      fn: (x,y) => ({ vx: -y, vy: x }),
      diff: {
        form: "curl(F) = ∂Fy/∂x − ∂Fx/∂y",
        result: "2",
        steps: ["∂Fy/∂x = 1", "∂Fx/∂y = -1"]
      }
    }
  },

  divergence: {
    source: {
      label: "F = (x, y)",
      fn: (x,y) => ({ vx: x, vy: y }),
      diff: {
        form: "div(F) = ∂Fx/∂x + ∂Fy/∂y",
        result: "2",
        steps: ["∂Fx/∂x = 1", "∂Fy/∂y = 1"]
      }
    }
  }
};

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

function generatePredefined(type, key, opts) {
  const entry = FUNCTIONS[type]?.[key];
  if (!entry) return null;

  const data = [];

  for (const [x, y] of makeGrid(opts)) {
    const { vx, vy } = entry.fn(x, y);
    data.push({ x, y, vx, vy });
  }

  return {
    label: entry.label,
    data,
    diff: entry.diff
  };
}

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

    if (vx === null || vy === null || isNaN(vx) || isNaN(vy)) continue;

    data.push({ x, y, vx, vy });
  }

  return data;
}

/* ───────────── ROUTES ───────────── */

app.get("/", (req, res) => {
  res.send("API running 🚀");
});

app.get("/api/functions", (req, res) => {
  const out = {};
  for (const [type, fns] of Object.entries(FUNCTIONS)) {
    out[type] = Object.entries(fns).map(([k,v]) => ({
      key: k,
      label: v.label
    }));
  }
  res.json(out);
});

["gradient","curl","divergence"].forEach((type) => {
  app.post(`/api/${type}`, (req, res) => {
    const { func, custom, exprs, xMin, xMax, yMin, yMax } = req.body;

    const opts = { xMin, xMax, yMin, yMax };

    if (custom) {
      const data = generateCustom(type, exprs, opts);

      if (!data.length) {
        return res.status(400).json({ error: "Invalid expression" });
      }

      return res.json({
        type,
        func: "custom",
        label: "Custom",
        data
      });
    }

    const result = generatePredefined(type, func, opts);
    if (!result) {
      return res.status(400).json({ error: "Unknown function" });
    }

    res.json({
      type,
      func,
      label: result.label,
      data: result.data,
      diff: result.diff
    });
  });
});

/* ───────────── START SERVER ───────────── */

app.listen(4000, () => {
  console.log("✅ Vector API running on http://localhost:4000");
});